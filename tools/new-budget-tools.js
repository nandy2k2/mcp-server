/**
 * new-budget-tools.js
 *
 * MCP tools mirroring NewBudgetApprovalPages.jsx + newbudgetapprovalctlrds.js
 *
 * Collections / Models (all unique names):
 *   BudgetDeptWf      → newbudgetdepartmentworkflowds
 *   BudgetInstWf      → newbudgetinstitutionworkflowds
 *   BudgetCategory    → newbudgetcategoryds
 *   BudgetItem        → newbudgetitemds
 *   BudgetAuditLog    → newbudgetauditlogds
 *   BudgetUserLookup  → users  (read-only; role != Student)
 *
 * Pages covered:
 *   newbudgetdepartmentworkflow   – list/save/bulk dept workflow
 *   newbudgetinstitutionworkflow  – list/save/bulk inst workflow
 *   newbudgetentry                – create/update/submit budget items
 *   newbudgetdepartmentapproval   – dept approval queue + approve/reject
 *   newbudgetinstitutionapproval  – inst approval queue + approve/reject + add item
 *   newbudgetanalysis             – list all items with filters + summary
 *   newbudgetauditlog             – read audit trail
 *
 * NO delete tools (policy).
 */

import mongoose from "mongoose";
import { z } from "zod";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const deptWfSchema = new mongoose.Schema(
  {
    colid: Number, department: String, level: Number,
    approverrole: String, approvername: String, approveremail: String,
    active: { type: String, default: "Yes" }, remarks: String, user: String
  },
  { strict: false, collection: "newbudgetdepartmentworkflowds" }
);

const instWfSchema = new mongoose.Schema(
  {
    colid: Number, level: Number,
    approverrole: String, approvername: String, approveremail: String,
    accesslevel: { type: String, default: "Approve Only" },
    active: { type: String, default: "Yes" }, remarks: String, user: String
  },
  { strict: false, collection: "newbudgetinstitutionworkflowds" }
);

const categorySchema = new mongoose.Schema(
  {
    colid: Number, category: String, type: String,
    active: { type: String, default: "Yes" }, description: String, user: String
  },
  { strict: false, collection: "newbudgetcategoryds" }
);

const budgetItemSchema = new mongoose.Schema(
  {
    colid: Number, academicyear: String, department: String,
    category: String, categorytype: String, item: String,
    amount: { type: Number, default: 0 },
    utilized: { type: Number, default: 0 },
    remaining: { type: Number, default: 0 },
    status: { type: String, default: "Draft" },
    stage: { type: String, default: "Draft" },
    currentlevel: { type: Number, default: 0 },
    submittedby: String, submittedbyname: String, submittedrole: String,
    remarks: String, rejectedreason: String, approvedat: Date,
    history: [{
      action: String, stage: String, level: Number,
      username: String, useremail: String, role: String,
      comments: String, amount: Number,
      time: { type: Date, default: Date.now }
    }]
  },
  { strict: false, timestamps: true, collection: "newbudgetitemds" }
);

const auditLogSchema = new mongoose.Schema(
  {
    colid: Number, budgetitemid: mongoose.Schema.Types.ObjectId,
    academicyear: String, department: String, category: String,
    categorytype: String, item: String, amount: Number,
    utilized: Number, remaining: Number,
    status: String, stage: String, level: Number,
    action: String, olddata: mongoose.Schema.Types.Mixed,
    newdata: mongoose.Schema.Types.Mixed, comments: String,
    username: String, useremail: String, role: String,
    timeofactivity: { type: Date, default: Date.now }
  },
  { strict: false, collection: "newbudgetauditlogds" }
);

const budgetUserSchema = new mongoose.Schema(
  { name: String, email: String, role: String, department: String, designation: String, colid: Number },
  { strict: false, collection: "users" }
);

// ─── Guarded model registrations ─────────────────────────────────────────────

const BudgetDeptWf    = mongoose.models.BudgetDeptWf    || mongoose.model("BudgetDeptWf",    deptWfSchema,       "newbudgetdepartmentworkflowds");
const BudgetInstWf    = mongoose.models.BudgetInstWf    || mongoose.model("BudgetInstWf",    instWfSchema,       "newbudgetinstitutionworkflowds");
const BudgetCat       = mongoose.models.BudgetCat       || mongoose.model("BudgetCat",       categorySchema,     "newbudgetcategoryds");
const BudgetItem      = mongoose.models.BudgetItem      || mongoose.model("BudgetItem",      budgetItemSchema,   "newbudgetitemds");
const BudgetAuditLog  = mongoose.models.BudgetAuditLog  || mongoose.model("BudgetAuditLog",  auditLogSchema,     "newbudgetauditlogds");
const BudgetUserLookup = mongoose.models.BudgetUserLookup || mongoose.model("BudgetUserLookup", budgetUserSchema, "users");

// ─── Helpers (mirrors newbudgetapprovalctlrds.js) ────────────────────────────

const num = (v, fallback = undefined) => { const p = Number(v); return Number.isFinite(p) ? p : fallback; };
const clean = (v) => String(v || "").trim();
const byLevelAsc = (a, b) => num(a.level, 0) - num(b.level, 0);
const byLevelDesc = (a, b) => num(b.level, 0) - num(a.level, 0);

const approverMatches = (level, useremail) => {
  const cfgEmail = clean(level.approveremail).toLowerCase();
  const curEmail = clean(useremail).toLowerCase();
  return Boolean(cfgEmail && curEmail && cfgEmail === curEmail);
};

const addHistory = (item, action, who, comments = "") => {
  item.history = item.history || [];
  item.history.push({
    action, stage: item.stage, level: item.currentlevel,
    username: who.username || "", useremail: who.useremail || "",
    role: who.role || "", comments, amount: item.amount
  });
};

const logAudit = async (action, item, who, olddata = null, newdata = null, comments = "") => {
  if (!item) return;
  await BudgetAuditLog.create({
    colid: item.colid, budgetitemid: item._id,
    academicyear: item.academicyear, department: item.department,
    category: item.category, categorytype: item.categorytype,
    item: item.item, amount: item.amount,
    utilized: item.utilized || 0,
    remaining: num(item.amount, 0) - num(item.utilized, 0),
    status: item.status, stage: item.stage, level: item.currentlevel,
    action, olddata, newdata, comments,
    username: who.username || "", useremail: who.useremail || "", role: who.role || ""
  });
};

const nextInstitutionState = async (item) => {
  const levels = await BudgetInstWf.find({ colid: item.colid, active: "Yes" }).lean();
  levels.sort(byLevelAsc);
  if (levels.length) {
    item.stage = "Institution";
    item.currentlevel = num(levels[0].level, 1);
    item.status = `Institution Pending Level ${item.currentlevel}`;
  } else {
    item.stage = "Approved";
    item.currentlevel = 0;
    item.status = "Approved";
    item.approvedat = new Date();
  }
};

const nextDepartmentState = async (item) => {
  const levels = await BudgetDeptWf.find({
    colid: item.colid, active: "Yes",
    department: { $in: [item.department, "All"] }
  }).lean();
  levels.sort(byLevelAsc);
  if (levels.length) {
    item.stage = "Department";
    item.currentlevel = num(levels[0].level, 1);
    item.status = `Department Pending Level ${item.currentlevel}`;
    return;
  }
  await nextInstitutionState(item);
};

const progressItem = async (item) => {
  if (item.stage === "Department") {
    const levels = await BudgetDeptWf.find({
      colid: item.colid, active: "Yes",
      department: { $in: [item.department, "All"] }
    }).lean();
    const next = levels.filter((l) => num(l.level, 0) > num(item.currentlevel, 0)).sort(byLevelAsc)[0];
    if (next) { item.currentlevel = num(next.level); item.status = `Department Pending Level ${item.currentlevel}`; return; }
    await nextInstitutionState(item);
    return;
  }
  if (item.stage === "Institution") {
    const levels = await BudgetInstWf.find({ colid: item.colid, active: "Yes" }).lean();
    const next = levels.filter((l) => num(l.level, 0) > num(item.currentlevel, 0)).sort(byLevelAsc)[0];
    if (next) { item.currentlevel = num(next.level); item.status = `Institution Pending Level ${item.currentlevel}`; return; }
  }
  item.stage = "Approved"; item.currentlevel = 0; item.status = "Approved"; item.approvedat = new Date();
};

const regressItem = async (item) => {
  if (item.stage === "Institution") {
    const instLevels = await BudgetInstWf.find({ colid: item.colid, active: "Yes" }).lean();
    const prevInst = instLevels.filter((l) => num(l.level, 0) < num(item.currentlevel, 0)).sort(byLevelDesc)[0];
    if (prevInst) { item.currentlevel = num(prevInst.level); item.status = `Institution Pending Level ${item.currentlevel}`; return; }
    const deptLevels = await BudgetDeptWf.find({ colid: item.colid, active: "Yes", department: { $in: [item.department, "All"] } }).lean();
    const topDept = deptLevels.sort(byLevelDesc)[0];
    if (topDept) { item.stage = "Department"; item.currentlevel = num(topDept.level); item.status = `Department Pending Level ${item.currentlevel}`; return; }
  }
  if (item.stage === "Department") {
    const levels = await BudgetDeptWf.find({ colid: item.colid, active: "Yes", department: { $in: [item.department, "All"] } }).lean();
    const prevDept = levels.filter((l) => num(l.level, 0) < num(item.currentlevel, 0)).sort(byLevelDesc)[0];
    if (prevDept) { item.currentlevel = num(prevDept.level); item.status = `Department Pending Level ${item.currentlevel}`; return; }
  }
  item.status = "Rejected"; item.stage = "Rejected"; item.currentlevel = 0;
};

const getMatchingWorkflowLevel = async (item, role, useremail) => {
  if (item.stage === "Department") {
    const levels = await BudgetDeptWf.find({
      colid: item.colid, active: "Yes", approverrole: role,
      department: { $in: [item.department, "All"] }
    }).lean();
    return levels.find((l) => num(l.level, 0) === num(item.currentlevel, 0) && approverMatches(l, useremail)) || null;
  }
  if (item.stage === "Institution") {
    const levels = await BudgetInstWf.find({ colid: item.colid, active: "Yes", approverrole: role }).lean();
    return levels.find((l) => num(l.level, 0) === num(item.currentlevel, 0) && approverMatches(l, useremail)) || null;
  }
  return null;
};

// ─── Tool registration ────────────────────────────────────────────────────────

export function registerNewBudgetTools(server, { requireAuth, resolveColid, connectDB }) {

  // ── 1. get_budget_users ──────────────────────────────────────────────────────
  server.tool(
    "get_budget_users",
    "List users (non-students), departments and roles available for budget workflow approver assignment. Used when setting up department/institution workflow levels.",
    {
      search: z.string().optional().describe("Optional name/email/department search string")
    },
    async ({ search }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const filter = { colid, role: { $not: /^Student$/i } };
      if (search) {
        const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [{ name: rx }, { email: rx }, { department: rx }, { role: rx }];
      }
      const users = await BudgetUserLookup.find(filter)
        .select("name email role department designation")
        .sort({ name: 1 }).limit(500).lean();
      const departments = [...new Set(users.map((u) => u.department).filter(Boolean))].sort();
      const roles = [...new Set(users.map((u) => u.role).filter(Boolean))].sort();
      return { content: [{ type: "text", text: JSON.stringify({ users, departments, roles, total: users.length }, null, 2) }] };
    }
  );

  // ── 2. list_department_workflow ───────────────────────────────────────────────
  server.tool(
    "list_department_workflow",
    "List all department-level budget approval workflow configurations. Each record defines who approves at which level for a given department.",
    {
      department: z.string().optional().describe("Filter by department name (or 'All')")
    },
    async ({ department }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const filter = { colid };
      if (department) filter.department = department;
      const data = await BudgetDeptWf.find(filter).sort({ department: 1, level: 1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 3. save_department_workflow ───────────────────────────────────────────────
  server.tool(
    "save_department_workflow",
    "Create or update a department budget approval workflow level. Provide id to update an existing record. Required: department, level, approverrole.",
    {
      id: z.string().optional().describe("Record _id for update (omit to create)"),
      department: z.string().optional().describe("Department name or 'All' for all departments"),
      level: z.number().int().min(1).optional().describe("Workflow level number (1 = first approver)"),
      approverrole: z.string().optional().describe("Role that approves at this level (e.g. HOD, Principal)"),
      approvername: z.string().optional(),
      approveremail: z.string().optional().describe("Email of the specific approver — must match exactly for approval to work"),
      active: z.enum(["Yes", "No"]).optional(),
      remarks: z.string().optional()
    },
    async ({ id, department, level, approverrole, approvername, approveremail, active, remarks }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { colid, department, level, approverrole, approvername, approveremail, active, remarks };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id
        ? await BudgetDeptWf.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
        : await BudgetDeptWf.create(payload);
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 4. bulk_department_workflow ───────────────────────────────────────────────
  server.tool(
    "bulk_department_workflow",
    "Bulk insert department workflow levels from a JSON array. Each item needs department, level, approverrole at minimum.",
    {
      rows: z.array(z.object({
        department: z.string(),
        level: z.number().int(),
        approverrole: z.string(),
        approvername: z.string().optional(),
        approveremail: z.string().optional(),
        active: z.string().optional(),
        remarks: z.string().optional()
      })).describe("Array of workflow level objects")
    },
    async ({ rows }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const docs = rows.filter((r) => r.department && r.approverrole).map((r) => ({ ...r, colid }));
      if (docs.length) await BudgetDeptWf.insertMany(docs);
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", inserted: docs.length }, null, 2) }] };
    }
  );

  // ── 5. list_institution_workflow ──────────────────────────────────────────────
  server.tool(
    "list_institution_workflow",
    "List all institution-level budget approval workflow configurations. Institution workflow runs after all department levels pass.",
    {},
    async () => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const data = await BudgetInstWf.find({ colid }).sort({ level: 1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 6. save_institution_workflow ──────────────────────────────────────────────
  server.tool(
    "save_institution_workflow",
    "Create or update an institution budget approval workflow level. Required: level, approverrole. accesslevel controls whether the approver can also add/edit items.",
    {
      id: z.string().optional().describe("Record _id for update (omit to create)"),
      level: z.number().int().min(1).optional().describe("Workflow level number (1 = first institution approver)"),
      approverrole: z.string().optional().describe("Role that approves at this level"),
      approvername: z.string().optional(),
      approveremail: z.string().optional().describe("Email of the specific approver — must match exactly"),
      accesslevel: z.enum(["Approve Only", "Edit and Add Items"]).optional().describe("Whether this approver can also add/edit budget items"),
      active: z.enum(["Yes", "No"]).optional(),
      remarks: z.string().optional()
    },
    async ({ id, level, approverrole, approvername, approveremail, accesslevel, active, remarks }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { colid, level, approverrole, approvername, approveremail, accesslevel, active, remarks };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id
        ? await BudgetInstWf.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
        : await BudgetInstWf.create(payload);
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 7. bulk_institution_workflow ──────────────────────────────────────────────
  server.tool(
    "bulk_institution_workflow",
    "Bulk insert institution workflow levels from a JSON array. Each item needs level, approverrole at minimum.",
    {
      rows: z.array(z.object({
        level: z.number().int(),
        approverrole: z.string(),
        approvername: z.string().optional(),
        approveremail: z.string().optional(),
        accesslevel: z.string().optional(),
        active: z.string().optional(),
        remarks: z.string().optional()
      }))
    },
    async ({ rows }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const docs = rows.filter((r) => r.approverrole).map((r) => ({ ...r, colid }));
      if (docs.length) await BudgetInstWf.insertMany(docs);
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", inserted: docs.length }, null, 2) }] };
    }
  );

  // ── 8. list_budget_categories ─────────────────────────────────────────────────
  server.tool(
    "list_budget_categories",
    "List budget categories (e.g. Laboratory, Library, Capital). Used to populate the category dropdown when creating budget entries.",
    {
      active: z.enum(["Yes", "No"]).optional().describe("Filter by active status")
    },
    async ({ active }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const filter = { colid };
      if (active) filter.active = active;
      const data = await BudgetCat.find(filter).sort({ category: 1, type: 1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 9. save_budget_category ───────────────────────────────────────────────────
  server.tool(
    "save_budget_category",
    "Create or update a budget category. Required: category, type (e.g. Capital/Revenue/Operating). Provide id to update.",
    {
      id: z.string().optional(),
      category: z.string().optional().describe("Category name (e.g. Laboratory Equipment)"),
      type: z.string().optional().describe("Budget type: Capital, Revenue, Operating, etc."),
      active: z.enum(["Yes", "No"]).optional(),
      description: z.string().optional()
    },
    async ({ id, category, type, active, description }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { colid, category, type, active, description };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id
        ? await BudgetCat.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
        : await BudgetCat.create(payload);
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 10. bulk_budget_categories ────────────────────────────────────────────────
  server.tool(
    "bulk_budget_categories",
    "Bulk insert budget categories from a JSON array. Each item needs category and type.",
    {
      rows: z.array(z.object({
        category: z.string(),
        type: z.string(),
        active: z.string().optional(),
        description: z.string().optional()
      }))
    },
    async ({ rows }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const docs = rows.filter((r) => r.category && r.type).map((r) => ({ ...r, colid }));
      if (docs.length) await BudgetCat.insertMany(docs);
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", inserted: docs.length }, null, 2) }] };
    }
  );

  // ── 11. list_budget_items ─────────────────────────────────────────────────────
  server.tool(
    "list_budget_items",
    "List budget items with optional filters. Used by budget entry (own items), budget analysis (all items), and approval pages. Returns utilized/remaining amounts too.",
    {
      academicyear: z.string().optional().describe("e.g. '2026-27'"),
      department: z.string().optional(),
      category: z.string().optional(),
      categorytype: z.string().optional(),
      status: z.string().optional().describe("Draft, Department Pending Level 1, Institution Pending Level 1, Approved, Rejected, etc."),
      stage: z.string().optional().describe("Draft, Department, Institution, Approved, Rejected"),
      submittedby: z.string().optional().describe("Filter by submitter email (for own-items view)")
    },
    async ({ academicyear, department, category, categorytype, status, stage, submittedby }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const filter = { colid };
      if (academicyear) filter.academicyear = academicyear;
      if (department) filter.department = department;
      if (category) filter.category = category;
      if (categorytype) filter.categorytype = categorytype;
      if (status) filter.status = status;
      if (stage) filter.stage = stage;
      if (submittedby) filter.submittedby = submittedby;
      const data = await BudgetItem.find(filter).sort({ createdAt: -1 }).lean();

      const totalAmount = data.reduce((s, r) => s + num(r.amount, 0), 0);
      const approvedAmount = data.filter((r) => r.status === "Approved").reduce((s, r) => s + num(r.amount, 0), 0);
      const pendingAmount = data.filter((r) => r.status !== "Approved" && r.status !== "Rejected").reduce((s, r) => s + num(r.amount, 0), 0);
      const rejectedAmount = data.filter((r) => r.status === "Rejected").reduce((s, r) => s + num(r.amount, 0), 0);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            data,
            total: data.length,
            summary: { totalAmount, approvedAmount, pendingAmount, rejectedAmount }
          }, null, 2)
        }]
      };
    }
  );

  // ── 12. save_budget_item ──────────────────────────────────────────────────────
  server.tool(
    "save_budget_item",
    "Create a new draft budget item or update an existing draft item. Only Draft status items can be edited. Required fields: academicyear, department, category, item.",
    {
      id: z.string().optional().describe("Record _id to update (omit to create new)"),
      academicyear: z.string().optional().describe("Academic year e.g. '2026-27'"),
      department: z.string().optional().describe("Department name — auto-locked to submitter's department"),
      category: z.string().optional().describe("Budget category from list_budget_categories"),
      categorytype: z.string().optional().describe("Auto-filled from category type; can be overridden"),
      item: z.string().optional().describe("Description of the budget item"),
      amount: z.number().optional().describe("Requested budget amount in INR"),
      utilized: z.number().optional().describe("Amount already utilized (default 0)"),
      remarks: z.string().optional(),
      submittedby: z.string().optional().describe("Submitter email (auto-populated from session)"),
      submittedbyname: z.string().optional(),
      submittedrole: z.string().optional()
    },
    async ({ id, academicyear, department, category, categorytype, item, amount, utilized, remarks, submittedby, submittedbyname, submittedrole }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();

      if (id) {
        const existing = await BudgetItem.findById(id);
        if (!existing) throw new Error("Budget item not found");
        if (existing.status !== "Draft") throw new Error("Only Draft items can be edited. Submitted items cannot be modified.");
        const olddata = existing.toObject();
        const fields = { academicyear, department, category, categorytype, item, remarks };
        Object.entries(fields).forEach(([k, v]) => { if (v !== undefined) existing[k] = v; });
        if (amount !== undefined) existing.amount = num(amount, 0);
        if (utilized !== undefined) existing.utilized = num(utilized, 0);
        existing.remaining = num(existing.amount, 0) - num(existing.utilized, 0);
        const data = await existing.save();
        await logAudit("Update Draft Item", data, { username: submittedbyname || "", useremail: submittedby || "", role: submittedrole || "" }, olddata, data.toObject());
        return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
      }

      const amt = num(amount, 0);
      const util = num(utilized, 0);
      const data = await BudgetItem.create({
        colid, academicyear, department, category, categorytype, item,
        amount: amt, utilized: util, remaining: amt - util,
        remarks, submittedby, submittedbyname, submittedrole,
        status: "Draft", stage: "Draft", currentlevel: 0
      });
      await logAudit("Create Draft Item", data, { username: submittedbyname || "", useremail: submittedby || "", role: submittedrole || "" }, null, data.toObject());
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 13. submit_budget_items ───────────────────────────────────────────────────
  server.tool(
    "submit_budget_items",
    "Submit one or more Draft budget items into the approval workflow. Only Draft items are processed; already-submitted items in the list are skipped. The item moves to the first Department workflow level, or directly to Institution if no Department levels exist.",
    {
      ids: z.array(z.string()).describe("Array of budget item _id strings to submit"),
      useremail: z.string().optional().describe("Submitter email"),
      username: z.string().optional().describe("Submitter name"),
      role: z.string().optional().describe("Submitter role"),
      comments: z.string().optional()
    },
    async ({ ids, useremail, username, role, comments }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const items = await BudgetItem.find({ _id: { $in: ids }, colid });
      let updated = 0;
      for (const item of items) {
        if (item.status !== "Draft") continue;
        const olddata = item.toObject();
        if (useremail) item.submittedby = useremail;
        if (username) item.submittedbyname = username;
        if (role) item.submittedrole = role;
        await nextDepartmentState(item);
        addHistory(item, "Submit", { username, useremail, role }, comments || "");
        await item.save();
        await logAudit("Submit Budget Item", item, { username, useremail, role }, olddata, item.toObject(), comments || "");
        updated++;
      }
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", submitted: updated, total: items.length }, null, 2) }] };
    }
  );

  // ── 14. get_budget_approval_queue ─────────────────────────────────────────────
  server.tool(
    "get_budget_approval_queue",
    "Get budget items pending approval for the current user's role and email. Returns items assigned to this approver at the matching stage and level. Use stage='Department' or stage='Institution' to filter.",
    {
      role: z.string().describe("Approver's role (must match workflow configuration)"),
      useremail: z.string().describe("Approver's email (must match workflow approveremail exactly)"),
      department: z.string().optional().describe("Approver's department (for Department stage matching)"),
      stage: z.enum(["Department", "Institution"]).optional().describe("Stage to filter queue — omit to get both"),
      academicyear: z.string().optional().describe("Optional filter by academic year")
    },
    async ({ role, useremail, department, stage, academicyear }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();

      const deptLevels = await BudgetDeptWf.find({
        colid, active: "Yes", approverrole: role,
        department: { $in: [department || "", "All"] }
      }).lean();
      const instLevels = await BudgetInstWf.find({ colid, active: "Yes", approverrole: role }).lean();
      const matchedDept = deptLevels.filter((l) => approverMatches(l, useremail));
      const matchedInst = instLevels.filter((l) => approverMatches(l, useremail));

      const or = [];
      if (!stage || stage === "Department") {
        matchedDept.forEach((l) => {
          or.push({
            stage: "Department",
            currentlevel: num(l.level, 0),
            department: l.department === "All" ? { $exists: true } : l.department
          });
        });
      }
      if (!stage || stage === "Institution") {
        matchedInst.forEach((l) => or.push({ stage: "Institution", currentlevel: num(l.level, 0) }));
      }

      let data = [];
      if (or.length) {
        const filter = { colid, $or: or };
        if (academicyear) filter.academicyear = academicyear;
        data = await BudgetItem.find(filter).sort({ academicyear: 1, department: 1, category: 1 }).lean();
      }

      const queueTotal = data.reduce((s, r) => s + num(r.amount, 0), 0);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            data,
            queueCount: data.length,
            queueTotal,
            matchedDepartmentLevels: matchedDept,
            matchedInstitutionLevels: matchedInst
          }, null, 2)
        }]
      };
    }
  );

  // ── 15. approve_budget_item ───────────────────────────────────────────────────
  server.tool(
    "approve_budget_item",
    "Approve a single budget item. The approver's role and email must match the workflow configuration for the item's current stage and level. The item advances to the next level, next stage, or becomes Approved if all levels are complete.",
    {
      id: z.string().describe("Budget item _id to approve"),
      role: z.string().describe("Approver's role"),
      useremail: z.string().describe("Approver's email"),
      username: z.string().optional().describe("Approver's name"),
      comments: z.string().optional().describe("Approval comments"),
      amount: z.number().optional().describe("Optionally adjust the amount during approval"),
      item: z.string().optional().describe("Optionally adjust item description during approval"),
      remarks: z.string().optional()
    },
    async ({ id, role, useremail, username, comments, amount, item: itemDesc, remarks }) => {
      requireAuth();
      await connectDB();
      const budgetItem = await BudgetItem.findById(id);
      if (!budgetItem) throw new Error("Budget item not found");
      const matchingLevel = await getMatchingWorkflowLevel(budgetItem, role, useremail);
      if (!matchingLevel) throw new Error("This budget item is not pending for your role and email at the current workflow level.");
      const olddata = budgetItem.toObject();
      if (itemDesc !== undefined) budgetItem.item = itemDesc;
      if (remarks !== undefined) budgetItem.remarks = remarks;
      if (amount !== undefined) budgetItem.amount = num(amount, budgetItem.amount);
      budgetItem.remaining = num(budgetItem.amount, 0) - num(budgetItem.utilized, 0);
      addHistory(budgetItem, "Approve", { username, useremail, role }, comments || "Approved");
      await progressItem(budgetItem);
      await budgetItem.save();
      await logAudit("Approve Budget Item", budgetItem, { username, useremail, role }, olddata, budgetItem.toObject(), comments || "Approved");
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data: budgetItem }, null, 2) }] };
    }
  );

  // ── 16. reject_budget_item ────────────────────────────────────────────────────
  server.tool(
    "reject_budget_item",
    "Reject a single budget item. The item regresses to the previous workflow level, or to the previous stage, or to Rejected if no prior levels exist. Reason/comments are recorded in audit log and history.",
    {
      id: z.string().describe("Budget item _id to reject"),
      role: z.string().describe("Approver's role"),
      useremail: z.string().describe("Approver's email"),
      username: z.string().optional(),
      comments: z.string().describe("Reason for rejection — required by workflow")
    },
    async ({ id, role, useremail, username, comments }) => {
      requireAuth();
      await connectDB();
      const budgetItem = await BudgetItem.findById(id);
      if (!budgetItem) throw new Error("Budget item not found");
      const matchingLevel = await getMatchingWorkflowLevel(budgetItem, role, useremail);
      if (!matchingLevel) throw new Error("This budget item is not pending for your role and email at the current workflow level.");
      const olddata = budgetItem.toObject();
      budgetItem.rejectedreason = comments || "";
      addHistory(budgetItem, "Reject", { username, useremail, role }, comments || "");
      await regressItem(budgetItem);
      await budgetItem.save();
      await logAudit("Reject Budget Item", budgetItem, { username, useremail, role }, olddata, budgetItem.toObject(), comments || "");
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data: budgetItem }, null, 2) }] };
    }
  );

  // ── 17. add_institution_budget_item ───────────────────────────────────────────
  server.tool(
    "add_institution_budget_item",
    "Add a new budget item directly at the Institution approval stage. Only available to institution approvers whose workflow accesslevel is 'Edit and Add Items'. The item starts at the institution approver's own level and progresses through remaining institution levels before becoming Approved.",
    {
      academicyear: z.string().describe("Academic year e.g. '2026-27'"),
      department: z.string().describe("Department the budget item belongs to"),
      category: z.string().describe("Budget category"),
      categorytype: z.string().optional(),
      item: z.string().describe("Budget item description"),
      amount: z.number().describe("Budget amount in INR"),
      utilized: z.number().optional(),
      remarks: z.string().optional(),
      role: z.string().describe("Institution approver's role"),
      useremail: z.string().describe("Institution approver's email"),
      username: z.string().optional(),
      comments: z.string().optional()
    },
    async ({ academicyear, department, category, categorytype, item, amount, utilized, remarks, role, useremail, username, comments }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();

      const currentLevels = await BudgetInstWf.find({ colid, active: "Yes", approverrole: role }).lean();
      const matchingLevel = currentLevels.filter((l) => approverMatches(l, useremail)).sort(byLevelAsc)[0];
      const firstInstLevel = matchingLevel || await BudgetInstWf.findOne({ colid, active: "Yes" }).sort({ level: 1 }).lean();

      const amt = num(amount, 0);
      const util = num(utilized, 0);
      const newItem = await BudgetItem.create({
        colid, academicyear, department, category, categorytype, item,
        amount: amt, utilized: util, remaining: amt - util, remarks,
        stage: firstInstLevel ? "Institution" : "Approved",
        currentlevel: firstInstLevel ? firstInstLevel.level : 0,
        status: firstInstLevel ? `Institution Pending Level ${firstInstLevel.level}` : "Approved",
        submittedby: useremail, submittedbyname: username, submittedrole: role
      });
      addHistory(newItem, "Institution Add Item", { username, useremail, role }, comments || "Added during institution approval");
      await newItem.save();
      await logAudit("Institution Add Item", newItem, { username, useremail, role }, null, newItem.toObject(), comments || "Added during institution approval");
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data: newItem }, null, 2) }] };
    }
  );

  // ── 18. list_budget_audit_logs ────────────────────────────────────────────────
  server.tool(
    "list_budget_audit_logs",
    "List budget audit trail entries. Tracks every action: Create Draft Item, Update Draft Item, Submit Budget Item, Approve Budget Item, Reject Budget Item, Institution Add Item, etc. Filter by any combination of fields.",
    {
      academicyear: z.string().optional(),
      department: z.string().optional(),
      category: z.string().optional(),
      categorytype: z.string().optional(),
      stage: z.string().optional().describe("Draft, Department, Institution, Approved, Rejected"),
      status: z.string().optional(),
      action: z.string().optional().describe("e.g. 'Approve Budget Item', 'Submit Budget Item', 'Reject Budget Item'"),
      useremail: z.string().optional().describe("Filter by the email of who performed the action"),
      limit: z.number().int().min(1).max(5000).optional().default(500).describe("Max records to return (default 500, max 5000)")
    },
    async ({ academicyear, department, category, categorytype, stage, status, action, useremail, limit }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const filter = { colid };
      if (academicyear) filter.academicyear = academicyear;
      if (department) filter.department = department;
      if (category) filter.category = category;
      if (categorytype) filter.categorytype = categorytype;
      if (stage) filter.stage = stage;
      if (status) filter.status = status;
      if (action) filter.action = action;
      if (useremail) filter.useremail = useremail;
      const data = await BudgetAuditLog.find(filter).sort({ timeofactivity: -1 }).limit(limit || 500).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 19. get_budget_analysis_summary ───────────────────────────────────────────
  server.tool(
    "get_budget_analysis_summary",
    "Get aggregated budget summaries grouped by category, department, status and academic year. Applies the same filters as list_budget_items. Returns totals + per-group breakdowns useful for the Budget Analysis dashboard.",
    {
      academicyear: z.string().optional(),
      department: z.string().optional(),
      category: z.string().optional(),
      categorytype: z.string().optional(),
      status: z.string().optional(),
      stage: z.string().optional(),
      submittedby: z.string().optional()
    },
    async ({ academicyear, department, category, categorytype, status, stage, submittedby }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const filter = { colid };
      if (academicyear) filter.academicyear = academicyear;
      if (department) filter.department = department;
      if (category) filter.category = category;
      if (categorytype) filter.categorytype = categorytype;
      if (status) filter.status = status;
      if (stage) filter.stage = stage;
      if (submittedby) filter.submittedby = submittedby;

      const data = await BudgetItem.find(filter).lean();

      const groupBy = (field) => {
        const map = new Map();
        data.forEach((row) => {
          const key = String(row[field] || "Not specified");
          const cur = map.get(key) || { name: key, count: 0, amount: 0, utilized: 0 };
          cur.count += 1;
          cur.amount += num(row.amount, 0);
          cur.utilized += num(row.utilized, 0);
          map.set(key, cur);
        });
        return [...map.values()].sort((a, b) => b.amount - a.amount);
      };

      const totalAmount = data.reduce((s, r) => s + num(r.amount, 0), 0);
      const approvedAmount = data.filter((r) => r.status === "Approved").reduce((s, r) => s + num(r.amount, 0), 0);
      const pendingAmount = data.filter((r) => r.status !== "Approved" && r.status !== "Rejected").reduce((s, r) => s + num(r.amount, 0), 0);
      const rejectedAmount = data.filter((r) => r.status === "Rejected").reduce((s, r) => s + num(r.amount, 0), 0);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            totalItems: data.length,
            totalAmount, approvedAmount, pendingAmount, rejectedAmount,
            byCategory: groupBy("category"),
            byDepartment: groupBy("department"),
            byStatus: groupBy("status"),
            byAcademicYear: groupBy("academicyear")
          }, null, 2)
        }]
      };
    }
  );
}
