/**
 * purchase-new-tools.js
 *
 * MCP tools mirroring PurchaseNewPages.jsx + purchasenewctlrds.js
 *
 * Collections / Models (all unique names, explicit collection args):
 *   PurchaseIndentMcp        → purchasenewindentds
 *   PurchaseIndentAuditMcp   → purchasenewindentauditds
 *   PurchaseDeptWfMcp        → purchasenewdepartmentworkflowds
 *   PurchaseInstWfMcp        → purchasenewinstitutionworkflowds
 *   PurchaseApprovalWfMcp    → purchasenewapprovalworkflowds  (generic: RFP/PO/FinancePayment)
 *   PurchaseCatOfficerMcp    → purchasenewcategoryofficerds
 *   PurchaseRfpMcp           → purchasenewrfpds
 *   PurchaseVendorMcp        → purchasenewvendords
 *   PurchaseRfpVendorMcp     → purchasenewrfpvendords
 *   PurchaseRfpSubmissionMcp → purchasenewrfpsubmissionds
 *   PurchasePoMcp            → purchasenewpurchaseorderds
 *   PurchaseDeliveryMcp      → purchasenewdeliveryscheduleds
 *   PurchaseInvoiceMcp       → purchasenewinvoiceds
 *   BudgetCatPurchaseMcp     → newbudgetcategoryds  (for category options)
 *   BudgetItemPurchaseMcp    → newbudgetitemds       (for budget summary)
 *   PurchaseUserMcp          → users                (non-student lookup)
 *
 * Pages covered:
 *   purchasenewindent               – create/update/submit indents
 *   purchasenewindenthistory        – own indent history + audit logs
 *   purchasenewdepartmentapproval   – dept indent approval queue
 *   purchasenewinstitutionapproval  – institution indent approval queue
 *   purchasenewofficerworkbench     – officer approved indents, create RFP
 *   purchasenewcategoryofficer      – category officer CRUD
 *   purchasenewrfpapproval          – RFP approval queue
 *   purchasenewapprovedrfps         – approved RFPs list
 *   purchasenewvendor               – vendor CRUD
 *   purchasenewrfpvendorassignment  – assign vendors to RFPs
 *   purchasenewvendorcomparison     – compare submissions, create PO
 *   purchasenewpoapproval           – PO approval queue
 *   purchasenewapprovedpo           – approved POs list
 *   purchasenewquality              – delivery quality check
 *   purchasenewinvoiceapproval      – invoice approval queue
 *
 * NO delete tools (policy).
 * workflowTypes: ["PurchaseOrder", "FinancePayment", "RFP"]
 */

import mongoose from "mongoose";
import { z } from "zod";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const indentSchema = new mongoose.Schema(
  {
    colid: Number, department: String, category: String, categorytype: String,
    item: String, description: String,
    quantity: { type: Number, default: 1 },
    approximatevalue: { type: Number, default: 0 },
    approximatetotalcost: { type: Number, default: 0 },
    status: { type: String, default: "Draft" },
    stage: { type: String, default: "Draft" },
    procurementstatus: { type: String, default: "Pending RFP" },
    rfpid: String, currentlevel: { type: Number, default: 0 },
    submittedby: String, submittedbyname: String, submittedrole: String,
    rejectedreason: String, approvedat: Date,
    history: [{ action: String, stage: String, level: Number, username: String, useremail: String, role: String, comments: String, time: { type: Date, default: Date.now } }]
  },
  { strict: false, timestamps: true, collection: "purchasenewindentds" }
);

const indentAuditSchema = new mongoose.Schema(
  {
    colid: Number, indentid: mongoose.Schema.Types.ObjectId,
    department: String, category: String, categorytype: String, item: String,
    action: String, status: String, stage: String, level: Number,
    comments: String, username: String, useremail: String, role: String,
    olddata: mongoose.Schema.Types.Mixed, newdata: mongoose.Schema.Types.Mixed,
    timeofactivity: { type: Date, default: Date.now }
  },
  { strict: false, collection: "purchasenewindentauditds" }
);

const deptWfSchema = new mongoose.Schema(
  { colid: Number, department: String, level: Number, approverrole: String, approvername: String, approveremail: String, active: { type: String, default: "Yes" }, remarks: String, user: String },
  { strict: false, collection: "purchasenewdepartmentworkflowds" }
);

const instWfSchema = new mongoose.Schema(
  { colid: Number, level: Number, approverrole: String, approvername: String, approveremail: String, active: { type: String, default: "Yes" }, remarks: String, user: String },
  { strict: false, collection: "purchasenewinstitutionworkflowds" }
);

const approvalWfSchema = new mongoose.Schema(
  { colid: Number, workflowtype: String, level: Number, approverrole: String, approvername: String, approveremail: String, active: { type: String, default: "Yes" }, remarks: String, user: String },
  { strict: false, collection: "purchasenewapprovalworkflowds" }
);

const catOfficerSchema = new mongoose.Schema(
  { colid: Number, category: String, categorytype: String, officername: String, officeremail: String, active: { type: String, default: "Yes" }, remarks: String, user: String },
  { strict: false, collection: "purchasenewcategoryofficerds" }
);

const rfpSchema = new mongoose.Schema(
  {
    colid: Number, rfpid: String, title: String, category: String, categorytype: String,
    officername: String, officeremail: String, indentids: [mongoose.Schema.Types.ObjectId],
    items: [{ indentid: mongoose.Schema.Types.ObjectId, department: String, requestedby: String, requestedbyname: String, item: String, description: String, originalitem: String, originaldescription: String, quantity: Number, approximatevalue: Number, approximatetotalcost: Number }],
    qualificationcriteria: String, experience: String,
    startdatetime: Date, enddatetime: Date,
    minimumbid: Number, cautiondeposit: Number,
    paymentterms: String, refundterms: String, deliveryterms: String, terms: String,
    documents: [{ documenttype: String, description: String, filename: String, key: String, url: String, uploadedby: String }],
    status: { type: String, default: "Draft" }, stage: String, currentlevel: { type: Number, default: 0 },
    createdby: String, createdbyname: String, approvedat: Date, rejectedreason: String,
    history: [{ action: String, stage: String, level: Number, username: String, useremail: String, role: String, comments: String, time: { type: Date, default: Date.now } }]
  },
  { strict: false, timestamps: true, collection: "purchasenewrfpds" }
);

const vendorSchema = new mongoose.Schema(
  {
    colid: Number, companyname: String, type: { type: String, default: "Pvt Ltd" },
    address: String, gstno: String, panno: String, tanno: String,
    contactperson: String, contactemail: String, contactphone: String,
    specialization: String, pastrecords: String, bankdetails: String,
    documents: [{ documenttype: String, filename: String, url: String }],
    username: String, password: String, status: { type: String, default: "Active" },
    remarks: String, createdby: String, createdbyname: String
  },
  { strict: false, collection: "purchasenewvendords" }
);

const rfpVendorSchema = new mongoose.Schema(
  {
    colid: Number, rfp: mongoose.Schema.Types.ObjectId, rfpid: String, rfptitle: String,
    vendor: mongoose.Schema.Types.ObjectId, vendorname: String, vendorusername: String, vendoremail: String, vendorphone: String,
    status: { type: String, default: "Assigned" },
    assignedby: String, assignedbyname: String, assignedat: Date, remarks: String
  },
  { strict: false, collection: "purchasenewrfpvendords" }
);

const rfpSubmissionSchema = new mongoose.Schema(
  {
    colid: Number, rfp: mongoose.Schema.Types.ObjectId, rfpid: String, rfptitle: String,
    vendor: mongoose.Schema.Types.ObjectId, vendorname: String, vendorusername: String, vendoremail: String,
    items: [{ rfpitemindex: Number, item: String, description: String, quantity: Number, unitprice: { type: Number, default: 0 }, gstpercent: { type: Number, default: 0 }, gstamount: { type: Number, default: 0 }, freightcost: { type: Number, default: 0 }, loadingcost: { type: Number, default: 0 }, customscost: { type: Number, default: 0 }, installationcost: { type: Number, default: 0 }, othercost: { type: Number, default: 0 }, total: { type: Number, default: 0 } }],
    qualificationresponse: String, experienceresponse: String, technicalbid: String, financialremarks: String,
    subtotal: Number, gsttotal: Number, grandtotal: Number,
    status: { type: String, default: "Submitted" }, editable: { type: String, default: "No" },
    submittedat: Date, resubmittedat: Date,
    documents: [{ documenttype: String, filename: String, url: String }],
    blockchainhash: String, blockchainrecordid: String
  },
  { strict: false, collection: "purchasenewrfpsubmissionds" }
);

const poSchema = new mongoose.Schema(
  {
    colid: Number, poid: String, title: String,
    rfp: mongoose.Schema.Types.ObjectId, rfpid: String, rfptitle: String,
    submission: mongoose.Schema.Types.ObjectId,
    vendor: mongoose.Schema.Types.ObjectId, vendorname: String, vendorusername: String, vendoremail: String,
    items: [{ item: String, description: String, quantity: Number, unitprice: Number, gstpercent: Number, gstamount: Number, freightcost: Number, loadingcost: Number, customscost: Number, installationcost: Number, othercost: Number, total: Number }],
    subtotal: Number, gsttotal: Number, grandtotal: Number,
    paymentterms: String, deliveryterms: String, penaltyclause: String, generalterms: String,
    status: { type: String, default: "Draft" }, stage: String, currentlevel: { type: Number, default: 0 },
    createdby: String, createdbyname: String, approvedat: Date,
    blockchainhash: String, blockchainrecordid: String,
    history: [{ action: String, stage: String, level: Number, username: String, useremail: String, role: String, comments: String, time: { type: Date, default: Date.now } }]
  },
  { strict: false, timestamps: true, collection: "purchasenewpurchaseorderds" }
);

const deliverySchema = new mongoose.Schema(
  {
    colid: Number, po: mongoose.Schema.Types.ObjectId, poid: String,
    vendor: mongoose.Schema.Types.ObjectId, vendorname: String, vendorusername: String,
    itemindex: Number, item: String, quantity: Number,
    deliverydatetime: Date, vehicledetails: String, shipmentdetails: String, remarks: String,
    acceptedquantity: { type: Number, default: 0 },
    returnedquantity: { type: Number, default: 0 },
    qualityremarks: String, status: { type: String, default: "Scheduled" },
    grnhash: String, grnrecordid: String, returnhash: String, returnrecordid: String
  },
  { strict: false, timestamps: true, collection: "purchasenewdeliveryscheduleds" }
);

const invoiceSchema = new mongoose.Schema(
  {
    colid: Number, invoiceid: String, invoiceno: String, invoicedate: Date,
    po: mongoose.Schema.Types.ObjectId, poid: String,
    vendor: mongoose.Schema.Types.ObjectId, vendorname: String, vendorusername: String,
    items: [{ itemindex: Number, item: String, quantity: Number, unitprice: Number, gstpercent: Number, gstamount: Number, total: Number }],
    subtotal: Number, gsttotal: Number, grandtotal: Number,
    paymode: String, bankdetails: String, remarks: String,
    documents: [{ documenttype: String, filename: String, url: String }],
    status: { type: String, default: "Draft" }, stage: String, currentlevel: { type: Number, default: 0 },
    approvedat: Date, blockchainhash: String, blockchainrecordid: String,
    history: [{ action: String, stage: String, level: Number, username: String, useremail: String, role: String, comments: String, time: { type: Date, default: Date.now } }]
  },
  { strict: false, timestamps: true, collection: "purchasenewinvoiceds" }
);

const budgetCatPurchaseSchema = new mongoose.Schema(
  { colid: Number, category: String, type: String, active: String },
  { strict: false, collection: "newbudgetcategoryds" }
);

const budgetItemPurchaseSchema = new mongoose.Schema(
  { colid: Number, department: String, category: String, categorytype: String, amount: Number, utilized: Number, remaining: Number, status: String },
  { strict: false, collection: "newbudgetitemds" }
);

const purchaseUserSchema = new mongoose.Schema(
  { name: String, email: String, role: String, department: String, designation: String, colid: Number },
  { strict: false, collection: "users" }
);

// ─── Guarded model registrations ─────────────────────────────────────────────

const PurchaseIndentMcp        = mongoose.models.PurchaseIndentMcp        || mongoose.model("PurchaseIndentMcp",        indentSchema,          "purchasenewindentds");
const PurchaseIndentAuditMcp   = mongoose.models.PurchaseIndentAuditMcp   || mongoose.model("PurchaseIndentAuditMcp",   indentAuditSchema,     "purchasenewindentauditds");
const PurchaseDeptWfMcp        = mongoose.models.PurchaseDeptWfMcp        || mongoose.model("PurchaseDeptWfMcp",        deptWfSchema,          "purchasenewdepartmentworkflowds");
const PurchaseInstWfMcp        = mongoose.models.PurchaseInstWfMcp        || mongoose.model("PurchaseInstWfMcp",        instWfSchema,          "purchasenewinstitutionworkflowds");
const PurchaseApprovalWfMcp    = mongoose.models.PurchaseApprovalWfMcp    || mongoose.model("PurchaseApprovalWfMcp",    approvalWfSchema,      "purchasenewapprovalworkflowds");
const PurchaseCatOfficerMcp    = mongoose.models.PurchaseCatOfficerMcp    || mongoose.model("PurchaseCatOfficerMcp",    catOfficerSchema,      "purchasenewcategoryofficerds");
const PurchaseRfpMcp           = mongoose.models.PurchaseRfpMcp           || mongoose.model("PurchaseRfpMcp",           rfpSchema,             "purchasenewrfpds");
const PurchaseVendorMcp        = mongoose.models.PurchaseVendorMcp        || mongoose.model("PurchaseVendorMcp",        vendorSchema,          "purchasenewvendords");
const PurchaseRfpVendorMcp     = mongoose.models.PurchaseRfpVendorMcp     || mongoose.model("PurchaseRfpVendorMcp",     rfpVendorSchema,       "purchasenewrfpvendords");
const PurchaseRfpSubmissionMcp = mongoose.models.PurchaseRfpSubmissionMcp || mongoose.model("PurchaseRfpSubmissionMcp", rfpSubmissionSchema,   "purchasenewrfpsubmissionds");
const PurchasePoMcp            = mongoose.models.PurchasePoMcp            || mongoose.model("PurchasePoMcp",            poSchema,              "purchasenewpurchaseorderds");
const PurchaseDeliveryMcp      = mongoose.models.PurchaseDeliveryMcp      || mongoose.model("PurchaseDeliveryMcp",      deliverySchema,        "purchasenewdeliveryscheduleds");
const PurchaseInvoiceMcp       = mongoose.models.PurchaseInvoiceMcp       || mongoose.model("PurchaseInvoiceMcp",       invoiceSchema,         "purchasenewinvoiceds");
const BudgetCatPurchaseMcp     = mongoose.models.BudgetCatPurchaseMcp     || mongoose.model("BudgetCatPurchaseMcp",     budgetCatPurchaseSchema, "newbudgetcategoryds");
const BudgetItemPurchaseMcp    = mongoose.models.BudgetItemPurchaseMcp    || mongoose.model("BudgetItemPurchaseMcp",    budgetItemPurchaseSchema, "newbudgetitemds");
const PurchaseUserMcp          = mongoose.models.PurchaseUserMcp          || mongoose.model("PurchaseUserMcp",          purchaseUserSchema,    "users");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const num = (v, fb = undefined) => { const p = Number(v); return Number.isFinite(p) ? p : fb; };
const clean = (v) => String(v || "").trim();
const byLevelAsc = (a, b) => num(a.level, 0) - num(b.level, 0);
const byLevelDesc = (a, b) => num(b.level, 0) - num(a.level, 0);

const approverMatches = (level, useremail) => {
  const cfg = clean(level.approveremail).toLowerCase();
  const cur = clean(useremail).toLowerCase();
  return Boolean(cfg && cur && cfg === cur);
};

const addHistory = (item, action, who, comments = "") => {
  item.history = item.history || [];
  item.history.push({ action, stage: item.stage, level: item.currentlevel, username: who.username || "", useremail: who.useremail || "", role: who.role || "", comments });
};

const logIndentAudit = async (action, item, who, olddata = null, newdata = null, comments = "") => {
  if (!item) return;
  await PurchaseIndentAuditMcp.create({
    colid: item.colid, indentid: item._id,
    department: item.department, category: item.category, categorytype: item.categorytype, item: item.item,
    action, status: item.status, stage: item.stage, level: item.currentlevel,
    comments, username: who.username || "", useremail: who.useremail || "", role: who.role || "",
    olddata, newdata
  });
};

// Indent workflow state machine (mirrors purchasenewctlrds.js)
const nextInstWfState = async (item) => {
  const levels = await PurchaseInstWfMcp.find({ colid: item.colid, active: "Yes" }).lean();
  levels.sort(byLevelAsc);
  if (levels.length) { item.stage = "Institution"; item.currentlevel = num(levels[0].level, 1); item.status = `Institution Pending Level ${item.currentlevel}`; return; }
  item.stage = "Approved"; item.currentlevel = 0; item.status = "Approved"; item.approvedat = new Date();
};

const nextDeptWfState = async (item) => {
  const levels = await PurchaseDeptWfMcp.find({ colid: item.colid, active: "Yes", department: { $in: [item.department, "All"] } }).lean();
  levels.sort(byLevelAsc);
  if (levels.length) { item.stage = "Department"; item.currentlevel = num(levels[0].level, 1); item.status = `Department Pending Level ${item.currentlevel}`; return; }
  await nextInstWfState(item);
};

const progressIndent = async (item) => {
  if (item.stage === "Department") {
    const levels = await PurchaseDeptWfMcp.find({ colid: item.colid, active: "Yes", department: { $in: [item.department, "All"] } }).lean();
    const next = levels.filter((l) => num(l.level, 0) > num(item.currentlevel, 0)).sort(byLevelAsc)[0];
    if (next) { item.currentlevel = num(next.level); item.status = `Department Pending Level ${item.currentlevel}`; return; }
    await nextInstWfState(item); return;
  }
  if (item.stage === "Institution") {
    const levels = await PurchaseInstWfMcp.find({ colid: item.colid, active: "Yes" }).lean();
    const next = levels.filter((l) => num(l.level, 0) > num(item.currentlevel, 0)).sort(byLevelAsc)[0];
    if (next) { item.currentlevel = num(next.level); item.status = `Institution Pending Level ${item.currentlevel}`; return; }
  }
  item.stage = "Approved"; item.currentlevel = 0; item.status = "Approved"; item.approvedat = new Date();
};

const regressIndent = async (item) => {
  if (item.stage === "Institution") {
    const instLevels = await PurchaseInstWfMcp.find({ colid: item.colid, active: "Yes" }).lean();
    const prev = instLevels.filter((l) => num(l.level, 0) < num(item.currentlevel, 0)).sort(byLevelDesc)[0];
    if (prev) { item.currentlevel = num(prev.level); item.status = `Institution Pending Level ${item.currentlevel}`; return; }
    const deptLevels = await PurchaseDeptWfMcp.find({ colid: item.colid, active: "Yes", department: { $in: [item.department, "All"] } }).lean();
    const topDept = deptLevels.sort(byLevelDesc)[0];
    if (topDept) { item.stage = "Department"; item.currentlevel = num(topDept.level); item.status = `Department Pending Level ${item.currentlevel}`; return; }
  }
  if (item.stage === "Department") {
    const levels = await PurchaseDeptWfMcp.find({ colid: item.colid, active: "Yes", department: { $in: [item.department, "All"] } }).lean();
    const prev = levels.filter((l) => num(l.level, 0) < num(item.currentlevel, 0)).sort(byLevelDesc)[0];
    if (prev) { item.currentlevel = num(prev.level); item.status = `Department Pending Level ${item.currentlevel}`; return; }
  }
  item.stage = "Rejected"; item.currentlevel = 0; item.status = "Rejected";
};

const matchingIndentLevel = async (item, role, useremail) => {
  if (item.stage === "Department") {
    const levels = await PurchaseDeptWfMcp.find({ colid: item.colid, active: "Yes", approverrole: role, department: { $in: [item.department, "All"] } }).lean();
    return levels.find((l) => num(l.level, 0) === num(item.currentlevel, 0) && approverMatches(l, useremail)) || null;
  }
  if (item.stage === "Institution") {
    const levels = await PurchaseInstWfMcp.find({ colid: item.colid, active: "Yes", approverrole: role }).lean();
    return levels.find((l) => num(l.level, 0) === num(item.currentlevel, 0) && approverMatches(l, useremail)) || null;
  }
  return null;
};

// Generic workflow state machine (RFP, PurchaseOrder, FinancePayment)
const firstGenericState = async (item, workflowtype) => {
  const levels = await PurchaseApprovalWfMcp.find({ colid: item.colid, workflowtype, active: "Yes" }).lean();
  levels.sort(byLevelAsc);
  if (levels.length) { item.stage = workflowtype; item.currentlevel = num(levels[0].level, 1); item.status = `${workflowtype} Pending Level ${item.currentlevel}`; return; }
  item.stage = "Approved"; item.currentlevel = 0; item.status = "Approved"; item.approvedat = new Date();
};

const progressGeneric = async (item, workflowtype) => {
  const levels = await PurchaseApprovalWfMcp.find({ colid: item.colid, workflowtype, active: "Yes" }).lean();
  const next = levels.filter((l) => num(l.level, 0) > num(item.currentlevel, 0)).sort(byLevelAsc)[0];
  if (next) { item.stage = workflowtype; item.currentlevel = num(next.level); item.status = `${workflowtype} Pending Level ${item.currentlevel}`; return; }
  item.stage = "Approved"; item.currentlevel = 0; item.status = "Approved"; item.approvedat = new Date();
};

const regressGeneric = async (item, workflowtype) => {
  const levels = await PurchaseApprovalWfMcp.find({ colid: item.colid, workflowtype, active: "Yes" }).lean();
  const previous = levels.filter((l) => num(l.level, 0) < num(item.currentlevel, 0)).sort(byLevelDesc)[0];
  if (previous) { item.stage = workflowtype; item.currentlevel = num(previous.level); item.status = `${workflowtype} Pending Level ${item.currentlevel}`; return; }
  item.stage = "Rejected"; item.currentlevel = 0; item.status = "Rejected";
};

const matchingGenericLevel = async (item, workflowtype, role, useremail) => {
  const levels = await PurchaseApprovalWfMcp.find({ colid: item.colid, workflowtype, active: "Yes", approverrole: role }).lean();
  return levels.find((l) => num(l.level, 0) === num(item.currentlevel, 0) && approverMatches(l, useremail)) || null;
};

// Deduct from budget when indent approved
const updateBudgetUtilization = async (indent) => {
  if (!indent?.category || !indent?.department) return;
  const budgetItems = await BudgetItemPurchaseMcp.find({
    colid: indent.colid, department: indent.department, category: indent.category, status: "Approved"
  }).sort({ createdAt: 1 }).lean();
  let remaining = num(indent.approximatetotalcost, 0);
  for (const bi of budgetItems) {
    if (remaining <= 0) break;
    const available = num(bi.amount, 0) - num(bi.utilized, 0);
    if (available <= 0) continue;
    const deduct = Math.min(available, remaining);
    await BudgetItemPurchaseMcp.findByIdAndUpdate(bi._id, {
      $inc: { utilized: deduct, remaining: -deduct }
    });
    remaining -= deduct;
  }
};

const indentFilter = (q, colid) => {
  const f = { colid };
  ["department", "category", "categorytype", "item", "status", "stage", "submittedby"].forEach((k) => { if (q[k]) f[k] = q[k]; });
  return f;
};

// ─── Tool registration ────────────────────────────────────────────────────────

export function registerPurchaseNewTools(server, { requireAuth, resolveColid, connectDB }) {

  // ── 1. get_purchase_users ────────────────────────────────────────────────────
  server.tool(
    "get_purchase_users",
    "List non-student users with their departments and roles for use in purchase workflow approver assignment.",
    { search: z.string().optional() },
    async ({ search }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const filter = { colid, role: { $not: /^Student$/i } };
      if (search) { const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); filter.$or = [{ name: rx }, { email: rx }, { department: rx }, { role: rx }]; }
      const users = await PurchaseUserMcp.find(filter).select("name email role department designation").sort({ name: 1 }).limit(500).lean();
      const departments = [...new Set(users.map((u) => u.department).filter(Boolean))].sort();
      const roles = [...new Set(users.map((u) => u.role).filter(Boolean))].sort();
      return { content: [{ type: "text", text: JSON.stringify({ users, departments, roles, total: users.length }, null, 2) }] };
    }
  );

  // ── 2. list_purchase_dept_workflow ───────────────────────────────────────────
  server.tool(
    "list_purchase_dept_workflow",
    "List department-level indent approval workflow levels for purchase module. Each level defines who approves indents from a given department.",
    { department: z.string().optional() },
    async ({ department }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (department) filter.department = department;
      const data = await PurchaseDeptWfMcp.find(filter).sort({ department: 1, level: 1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 3. save_purchase_dept_workflow ───────────────────────────────────────────
  server.tool(
    "save_purchase_dept_workflow",
    "Create or update a department indent approval workflow level. Required: department (or 'All'), level, approverrole. Provide id to update.",
    {
      id: z.string().optional(),
      department: z.string().optional().describe("Department name or 'All'"),
      level: z.number().int().optional(),
      approverrole: z.string().optional(),
      approvername: z.string().optional(),
      approveremail: z.string().optional().describe("Email must match exactly for approval routing"),
      active: z.enum(["Yes", "No"]).optional(),
      remarks: z.string().optional()
    },
    async ({ id, department, level, approverrole, approvername, approveremail, active, remarks }) => {
      requireAuth();
      await connectDB();
      const payload = { colid: resolveColid(), department, level, approverrole, approvername, approveremail, active, remarks };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id ? await PurchaseDeptWfMcp.findByIdAndUpdate(id, payload, { new: true, runValidators: true }) : await PurchaseDeptWfMcp.create(payload);
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 4. list_purchase_institution_workflow ────────────────────────────────────
  server.tool(
    "list_purchase_institution_workflow",
    "List institution-level indent approval workflow levels (runs after all department levels).",
    {},
    async () => {
      requireAuth();
      await connectDB();
      const data = await PurchaseInstWfMcp.find({ colid: resolveColid() }).sort({ level: 1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 5. save_purchase_institution_workflow ────────────────────────────────────
  server.tool(
    "save_purchase_institution_workflow",
    "Create or update an institution indent approval workflow level. Required: level, approverrole.",
    {
      id: z.string().optional(),
      level: z.number().int().optional(),
      approverrole: z.string().optional(),
      approvername: z.string().optional(),
      approveremail: z.string().optional(),
      active: z.enum(["Yes", "No"]).optional(),
      remarks: z.string().optional()
    },
    async ({ id, level, approverrole, approvername, approveremail, active, remarks }) => {
      requireAuth();
      await connectDB();
      const payload = { colid: resolveColid(), level, approverrole, approvername, approveremail, active, remarks };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id ? await PurchaseInstWfMcp.findByIdAndUpdate(id, payload, { new: true, runValidators: true }) : await PurchaseInstWfMcp.create(payload);
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 6. list_purchase_generic_workflow ────────────────────────────────────────
  server.tool(
    "list_purchase_generic_workflow",
    "List generic approval workflow levels. workflowtype must be one of: 'RFP', 'PurchaseOrder', 'FinancePayment'.",
    { workflowtype: z.enum(["RFP", "PurchaseOrder", "FinancePayment"]).describe("Workflow type to list") },
    async ({ workflowtype }) => {
      requireAuth();
      await connectDB();
      const data = await PurchaseApprovalWfMcp.find({ colid: resolveColid(), workflowtype }).sort({ level: 1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 7. save_purchase_generic_workflow ────────────────────────────────────────
  server.tool(
    "save_purchase_generic_workflow",
    "Create or update a generic approval workflow level for RFP, PurchaseOrder, or FinancePayment approval chains.",
    {
      id: z.string().optional(),
      workflowtype: z.enum(["RFP", "PurchaseOrder", "FinancePayment"]),
      level: z.number().int().optional(),
      approverrole: z.string().optional(),
      approvername: z.string().optional(),
      approveremail: z.string().optional(),
      active: z.enum(["Yes", "No"]).optional(),
      remarks: z.string().optional()
    },
    async ({ id, workflowtype, level, approverrole, approvername, approveremail, active, remarks }) => {
      requireAuth();
      await connectDB();
      const payload = { colid: resolveColid(), workflowtype, level, approverrole, approvername, approveremail, active, remarks };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id ? await PurchaseApprovalWfMcp.findByIdAndUpdate(id, payload, { new: true, runValidators: true }) : await PurchaseApprovalWfMcp.create(payload);
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 8. list_category_officers ────────────────────────────────────────────────
  server.tool(
    "list_category_officers",
    "List purchase category officers. Each record maps a category to the procurement officer responsible for creating RFPs.",
    { category: z.string().optional(), active: z.enum(["Yes", "No"]).optional() },
    async ({ category, active }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (category) filter.category = category;
      if (active) filter.active = active;
      const data = await PurchaseCatOfficerMcp.find(filter).sort({ category: 1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 9. save_category_officer ─────────────────────────────────────────────────
  server.tool(
    "save_category_officer",
    "Create or update a category officer assignment. Required: category, officeremail.",
    {
      id: z.string().optional(),
      category: z.string().optional().describe("Budget category (e.g. 'Laboratory Equipment')"),
      categorytype: z.string().optional(),
      officername: z.string().optional(),
      officeremail: z.string().optional().describe("Officer's email — used to filter officer workbench"),
      active: z.enum(["Yes", "No"]).optional(),
      remarks: z.string().optional()
    },
    async ({ id, category, categorytype, officername, officeremail, active, remarks }) => {
      requireAuth();
      await connectDB();
      const payload = { colid: resolveColid(), category, categorytype, officername, officeremail, active, remarks };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id ? await PurchaseCatOfficerMcp.findByIdAndUpdate(id, payload, { new: true, runValidators: true }) : await PurchaseCatOfficerMcp.create(payload);
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 10. get_purchase_categories ──────────────────────────────────────────────
  server.tool(
    "get_purchase_categories",
    "Get available budget categories for indent creation. If department is provided, returns only categories with approved budget items for that department. Otherwise returns all active budget categories.",
    { department: z.string().optional().describe("Department to scope categories by budget availability") },
    async ({ department }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      let data;
      if (department) {
        const items = await BudgetItemPurchaseMcp.find({ colid, department, status: "Approved" }).lean();
        const seen = new Set();
        data = items.filter((item) => {
          const key = `${item.category}||${item.categorytype}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).map((item) => ({ category: item.category, type: item.categorytype || item.category }));
      } else {
        data = await BudgetCatPurchaseMcp.find({ colid, active: "Yes" }).sort({ category: 1 }).lean();
      }
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 11. get_purchase_budget_summary ──────────────────────────────────────────
  server.tool(
    "get_purchase_budget_summary",
    "Get approved budget summary (total approved, utilized, remaining) for a department+category combination. Shown during indent entry to check available budget.",
    {
      department: z.string().describe("Department name"),
      category: z.string().describe("Budget category"),
      categorytype: z.string().optional()
    },
    async ({ department, category, categorytype }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const filter = { colid, department, category, status: "Approved" };
      if (categorytype) filter.categorytype = categorytype;
      const rows = await BudgetItemPurchaseMcp.find(filter).lean();
      const approved = rows.reduce((s, r) => s + num(r.amount, 0), 0);
      const utilized = rows.reduce((s, r) => s + num(r.utilized, 0), 0);
      const remaining = approved - utilized;
      return { content: [{ type: "text", text: JSON.stringify({ data: { approved, utilized, remaining, rows }, total: rows.length }, null, 2) }] };
    }
  );

  // ── 12. list_purchase_indents ─────────────────────────────────────────────────
  server.tool(
    "list_purchase_indents",
    "List purchase indents with optional filters. Use submittedby to get own indents (indent entry/history pages). Use status='Approved' for approved indents. Includes approval history.",
    {
      department: z.string().optional(),
      category: z.string().optional(),
      categorytype: z.string().optional(),
      item: z.string().optional(),
      status: z.string().optional().describe("Draft, Department Pending Level N, Institution Pending Level N, Approved, Rejected"),
      stage: z.string().optional().describe("Draft, Department, Institution, Approved, Rejected"),
      submittedby: z.string().optional().describe("Filter by submitter email — use for own-items view")
    },
    async (filters) => {
      requireAuth();
      await connectDB();
      const data = await PurchaseIndentMcp.find(indentFilter(filters, resolveColid())).sort({ createdAt: -1 }).lean();
      const counts = { total: data.length, draft: 0, pending: 0, approved: 0, rejected: 0 };
      data.forEach((r) => {
        if (r.status === "Draft") counts.draft++;
        else if (r.status === "Approved") counts.approved++;
        else if (r.status === "Rejected") counts.rejected++;
        else counts.pending++;
      });
      return { content: [{ type: "text", text: JSON.stringify({ data, counts }, null, 2) }] };
    }
  );

  // ── 13. save_purchase_indent ──────────────────────────────────────────────────
  server.tool(
    "save_purchase_indent",
    "Create or update a purchase indent (only Draft items can be edited). Required: department, category, item. approximatetotalcost = quantity × approximatevalue (auto-calculated).",
    {
      id: z.string().optional().describe("Indent _id to update (omit to create)"),
      department: z.string().optional(),
      category: z.string().optional(),
      categorytype: z.string().optional(),
      item: z.string().optional().describe("Item name/title"),
      description: z.string().optional(),
      quantity: z.number().optional(),
      approximatevalue: z.number().optional().describe("Approximate value per unit"),
      submittedby: z.string().optional().describe("Submitter email"),
      submittedbyname: z.string().optional(),
      submittedrole: z.string().optional()
    },
    async ({ id, department, category, categorytype, item, description, quantity, approximatevalue, submittedby, submittedbyname, submittedrole }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const who = { username: submittedbyname || "", useremail: submittedby || "", role: submittedrole || "" };
      const qty = num(quantity, 1);
      const rate = num(approximatevalue, 0);
      const total = qty * rate;

      if (id) {
        const existing = await PurchaseIndentMcp.findById(id);
        if (!existing) throw new Error("Indent not found");
        if (existing.status !== "Draft") throw new Error("Only Draft indents can be edited");
        const olddata = existing.toObject();
        const fields = { department, category, categorytype, item, description };
        Object.entries(fields).forEach(([k, v]) => { if (v !== undefined) existing[k] = v; });
        if (quantity !== undefined) existing.quantity = qty;
        if (approximatevalue !== undefined) existing.approximatevalue = rate;
        if (quantity !== undefined || approximatevalue !== undefined) existing.approximatetotalcost = existing.quantity * existing.approximatevalue;
        const data = await existing.save();
        await logIndentAudit("Update Draft Indent", data, who, olddata, data.toObject());
        return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
      }

      const data = await PurchaseIndentMcp.create({
        colid, department, category, categorytype, item, description,
        quantity: qty, approximatevalue: rate, approximatetotalcost: total,
        status: "Draft", stage: "Draft", submittedby, submittedbyname, submittedrole
      });
      await logIndentAudit("Create Draft Indent", data, who, null, data.toObject());
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 14. submit_purchase_indents ───────────────────────────────────────────────
  server.tool(
    "submit_purchase_indents",
    "Submit one or more Draft purchase indents into the approval workflow. Non-Draft items are skipped. Items move to the first Department level, or directly to Institution if no Department levels exist.",
    {
      ids: z.array(z.string()).describe("Array of indent _id strings to submit"),
      useremail: z.string().optional(),
      username: z.string().optional(),
      role: z.string().optional(),
      comments: z.string().optional()
    },
    async ({ ids, useremail, username, role, comments }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const who = { username: username || "", useremail: useremail || "", role: role || "" };
      const items = await PurchaseIndentMcp.find({ _id: { $in: ids }, colid });
      let submitted = 0;
      for (const item of items) {
        if (item.status !== "Draft") continue;
        const olddata = item.toObject();
        if (useremail) item.submittedby = useremail;
        if (username) item.submittedbyname = username;
        if (role) item.submittedrole = role;
        await nextDeptWfState(item);
        addHistory(item, "Submit", who, comments || "");
        await item.save();
        await logIndentAudit("Submit Indent", item, who, olddata, item.toObject(), comments || "");
        submitted++;
      }
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", submitted, total: items.length }, null, 2) }] };
    }
  );

  // ── 15. get_indent_approval_queue ────────────────────────────────────────────
  server.tool(
    "get_indent_approval_queue",
    "Get purchase indents pending approval for the current user's role and email. Pass stage='Department' or 'Institution' to filter. The approver's email must match the workflow configuration exactly.",
    {
      role: z.string().describe("Approver's role"),
      useremail: z.string().describe("Approver's email (must match workflow approveremail)"),
      department: z.string().optional().describe("Approver's own department (for dept-level matching)"),
      stage: z.enum(["Department", "Institution"]).optional().describe("Stage filter — omit to get both"),
      category: z.string().optional()
    },
    async ({ role, useremail, department, stage, category }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const deptLevels = await PurchaseDeptWfMcp.find({ colid, active: "Yes", approverrole: role, department: { $in: [department || "", "All"] } }).lean();
      const instLevels = await PurchaseInstWfMcp.find({ colid, active: "Yes", approverrole: role }).lean();
      const matchedDept = deptLevels.filter((l) => approverMatches(l, useremail));
      const matchedInst = instLevels.filter((l) => approverMatches(l, useremail));
      const or = [];
      if (!stage || stage === "Department") matchedDept.forEach((l) => or.push({ stage: "Department", currentlevel: num(l.level, 0), department: l.department === "All" ? { $exists: true } : l.department }));
      if (!stage || stage === "Institution") matchedInst.forEach((l) => or.push({ stage: "Institution", currentlevel: num(l.level, 0) }));
      let data = [];
      if (or.length) {
        const filter = { colid, $or: or };
        if (category) filter.category = category;
        data = await PurchaseIndentMcp.find(filter).sort({ createdAt: -1 }).lean();
      }
      return { content: [{ type: "text", text: JSON.stringify({ data, queueCount: data.length, matchedDeptLevels: matchedDept, matchedInstLevels: matchedInst }, null, 2) }] };
    }
  );

  // ── 16. approve_purchase_indent ───────────────────────────────────────────────
  server.tool(
    "approve_purchase_indent",
    "Approve a purchase indent. Approver role+email must match the workflow level. If this is the final approval level the indent becomes 'Approved' and budget utilization is updated automatically.",
    {
      id: z.string().describe("Indent _id to approve"),
      role: z.string(),
      useremail: z.string(),
      username: z.string().optional(),
      comments: z.string().optional()
    },
    async ({ id, role, useremail, username, comments }) => {
      requireAuth();
      await connectDB();
      const item = await PurchaseIndentMcp.findById(id);
      if (!item) throw new Error("Indent not found");
      const level = await matchingIndentLevel(item, role, useremail);
      if (!level) throw new Error("Indent is not pending for your role and email at the current level");
      const olddata = item.toObject();
      const who = { username: username || "", useremail, role };
      addHistory(item, "Approve", who, comments || "Approved");
      await progressIndent(item);
      await item.save();
      if (item.status === "Approved") await updateBudgetUtilization(item);
      await logIndentAudit("Approve Indent", item, who, olddata, item.toObject(), comments || "Approved");
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data: item }, null, 2) }] };
    }
  );

  // ── 17. reject_purchase_indent ────────────────────────────────────────────────
  server.tool(
    "reject_purchase_indent",
    "Reject a purchase indent. The indent regresses to the previous workflow level or is fully rejected if no prior level exists.",
    {
      id: z.string(),
      role: z.string(),
      useremail: z.string(),
      username: z.string().optional(),
      comments: z.string().describe("Rejection reason — required")
    },
    async ({ id, role, useremail, username, comments }) => {
      requireAuth();
      await connectDB();
      const item = await PurchaseIndentMcp.findById(id);
      if (!item) throw new Error("Indent not found");
      const level = await matchingIndentLevel(item, role, useremail);
      if (!level) throw new Error("Indent is not pending for your role and email at the current level");
      const olddata = item.toObject();
      const who = { username: username || "", useremail, role };
      item.rejectedreason = comments || "";
      addHistory(item, "Reject", who, comments || "");
      await regressIndent(item);
      await item.save();
      await logIndentAudit("Reject Indent", item, who, olddata, item.toObject(), comments || "");
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data: item }, null, 2) }] };
    }
  );

  // ── 18. list_purchase_indent_audit_logs ──────────────────────────────────────
  server.tool(
    "list_purchase_indent_audit_logs",
    "List purchase indent audit trail entries. Tracks all actions: Create/Update/Submit/Approve/Reject. Filter by any combination of fields.",
    {
      department: z.string().optional(),
      category: z.string().optional(),
      categorytype: z.string().optional(),
      item: z.string().optional(),
      action: z.string().optional(),
      status: z.string().optional(),
      stage: z.string().optional(),
      useremail: z.string().optional(),
      limit: z.number().int().min(1).max(5000).optional().default(500)
    },
    async ({ department, category, categorytype, item, action, status, stage, useremail, limit }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const filter = { colid };
      if (department) filter.department = department;
      if (category) filter.category = category;
      if (categorytype) filter.categorytype = categorytype;
      if (item) filter.item = new RegExp(item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (action) filter.action = action;
      if (status) filter.status = status;
      if (stage) filter.stage = stage;
      if (useremail) filter.useremail = useremail;
      const data = await PurchaseIndentAuditMcp.find(filter).sort({ timeofactivity: -1 }).limit(limit || 500).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 19. list_officer_approved_indents ────────────────────────────────────────
  server.tool(
    "list_officer_approved_indents",
    "Get approved indents assigned to a category officer that have not yet been converted to an RFP (procurementstatus != 'RFP Created'). Used in the officer workbench to select indents for RFP creation.",
    {
      officeremail: z.string().describe("Officer's email — must match category officer assignment"),
      view: z.string().optional().describe("Optional: 'all' to see all indents regardless of assignment, or omit for officer's categories only"),
      submittedby: z.string().optional().describe("Filter by submitter email")
    },
    async ({ officeremail, view, submittedby }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      let data;
      if (view === "all") {
        const filter = { colid, status: "Approved", procurementstatus: { $ne: "RFP Created" } };
        if (submittedby) filter.submittedby = submittedby;
        data = await PurchaseIndentMcp.find(filter).sort({ approvedat: -1 }).lean();
      } else {
        const officers = await PurchaseCatOfficerMcp.find({ colid, officeremail, active: "Yes" }).lean();
        const categories = officers.map((o) => o.category).filter(Boolean);
        if (!categories.length) { return { content: [{ type: "text", text: JSON.stringify({ data: [], total: 0, message: "No categories assigned to this officer" }, null, 2) }] }; }
        const filter = { colid, status: "Approved", category: { $in: categories }, procurementstatus: { $ne: "RFP Created" } };
        if (submittedby) filter.submittedby = submittedby;
        data = await PurchaseIndentMcp.find(filter).sort({ approvedat: -1 }).lean();
      }
      const employees = [...new Map(data.filter((r) => r.submittedby).map((r) => [r.submittedby, { email: r.submittedby, name: r.submittedbyname || r.submittedby }])).values()];
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length, employees }, null, 2) }] };
    }
  );

  // ── 20. create_purchase_rfp ───────────────────────────────────────────────────
  server.tool(
    "create_purchase_rfp",
    "Create an RFP from one or more approved indents. Selected indents' items are combined into RFP items. All provided indents must be Approved and belong to the same category. The RFP enters the RFP approval workflow immediately.",
    {
      indentids: z.array(z.string()).describe("Array of approved indent _ids to include in the RFP"),
      title: z.string().describe("RFP title"),
      category: z.string().describe("Category (must match indents)"),
      categorytype: z.string().optional(),
      officeremail: z.string().describe("Creating officer's email"),
      officername: z.string().optional(),
      qualificationcriteria: z.string().optional(),
      experience: z.string().optional(),
      startdatetime: z.string().optional().describe("ISO datetime for bid start"),
      enddatetime: z.string().optional().describe("ISO datetime for bid deadline"),
      minimumbid: z.number().optional(),
      cautiondeposit: z.number().optional(),
      paymentterms: z.string().optional(),
      refundterms: z.string().optional(),
      deliveryterms: z.string().optional(),
      terms: z.string().optional(),
      useremail: z.string().optional(),
      username: z.string().optional(),
      role: z.string().optional(),
      comments: z.string().optional()
    },
    async ({ indentids, title, category, categorytype, officeremail, officername, qualificationcriteria, experience, startdatetime, enddatetime, minimumbid, cautiondeposit, paymentterms, refundterms, deliveryterms, terms, useremail, username, role, comments }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const who = { username: username || "", useremail: useremail || "", role: role || "" };
      const indents = await PurchaseIndentMcp.find({ _id: { $in: indentids }, colid, status: "Approved" });
      if (!indents.length) throw new Error("No approved indents found for the provided ids");
      const count = await PurchaseRfpMcp.countDocuments({ colid });
      const rfpid = `RFP-${colid}-${String(count + 1).padStart(5, "0")}`;
      const items = indents.map((indent, index) => ({
        indentid: indent._id, department: indent.department,
        requestedby: indent.submittedby, requestedbyname: indent.submittedbyname,
        item: indent.item, description: indent.description,
        originalitem: indent.item, originaldescription: indent.description,
        quantity: indent.quantity, approximatevalue: indent.approximatevalue,
        approximatetotalcost: indent.approximatetotalcost
      }));
      const rfp = await PurchaseRfpMcp.create({
        colid, rfpid, title, category, categorytype,
        officeremail, officername,
        indentids: indents.map((i) => i._id), items,
        qualificationcriteria, experience,
        startdatetime: startdatetime ? new Date(startdatetime) : undefined,
        enddatetime: enddatetime ? new Date(enddatetime) : undefined,
        minimumbid, cautiondeposit, paymentterms, refundterms, deliveryterms, terms,
        createdby: useremail, createdbyname: username,
        stage: "Draft", currentlevel: 0, status: "Draft"
      });
      await firstGenericState(rfp, "RFP");
      addHistory(rfp, "Create RFP", who, comments || "");
      await rfp.save();
      await PurchaseIndentMcp.updateMany({ _id: { $in: indents.map((i) => i._id) } }, { $set: { procurementstatus: "RFP Created", rfpid } });
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", rfpid, data: rfp }, null, 2) }] };
    }
  );

  // ── 21. list_purchase_rfps ────────────────────────────────────────────────────
  server.tool(
    "list_purchase_rfps",
    "List RFPs with optional filters. Use status='Approved' for approved RFPs page. Use officeremail to get an officer's RFPs. Returns items array showing all indent items per RFP.",
    {
      status: z.string().optional().describe("e.g. Approved, Draft, RFP Pending Level 1, Rejected"),
      stage: z.string().optional(),
      category: z.string().optional(),
      officeremail: z.string().optional(),
      rfpid: z.string().optional()
    },
    async ({ status, stage, category, officeremail, rfpid }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (status) filter.status = status;
      if (stage) filter.stage = stage;
      if (category) filter.category = category;
      if (officeremail) filter.officeremail = officeremail;
      if (rfpid) filter.rfpid = rfpid;
      const data = await PurchaseRfpMcp.find(filter).sort({ createdAt: -1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 22. get_rfp_approval_queue ───────────────────────────────────────────────
  server.tool(
    "get_rfp_approval_queue",
    "Get RFPs pending approval for the current user's role and email. Uses the 'RFP' generic workflow.",
    {
      role: z.string().describe("Approver's role"),
      useremail: z.string().describe("Approver's email")
    },
    async ({ role, useremail }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const levels = await PurchaseApprovalWfMcp.find({ colid, workflowtype: "RFP", active: "Yes", approverrole: role }).lean();
      const matched = levels.filter((l) => approverMatches(l, useremail));
      if (!matched.length) return { content: [{ type: "text", text: JSON.stringify({ data: [], queueCount: 0 }, null, 2) }] };
      const or = matched.map((l) => ({ stage: "RFP", currentlevel: num(l.level, 0) }));
      const data = await PurchaseRfpMcp.find({ colid, $or: or }).sort({ createdAt: -1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, queueCount: data.length }, null, 2) }] };
    }
  );

  // ── 23. approve_purchase_rfp ─────────────────────────────────────────────────
  server.tool(
    "approve_purchase_rfp",
    "Approve an RFP. Approver role+email must match the RFP workflow level. On final approval the RFP status becomes 'Approved'.",
    {
      id: z.string().describe("RFP _id"),
      role: z.string(), useremail: z.string(), username: z.string().optional(), comments: z.string().optional()
    },
    async ({ id, role, useremail, username, comments }) => {
      requireAuth();
      await connectDB();
      const rfp = await PurchaseRfpMcp.findById(id);
      if (!rfp) throw new Error("RFP not found");
      const level = await matchingGenericLevel(rfp, "RFP", role, useremail);
      if (!level) throw new Error("RFP is not pending for your role and email at the current level");
      const olddata = rfp.toObject();
      const who = { username: username || "", useremail, role };
      addHistory(rfp, "Approve", who, comments || "Approved");
      await progressGeneric(rfp, "RFP");
      await rfp.save();
      await logIndentAudit("Approve RFP", { ...rfp.toObject(), _id: rfp._id, category: rfp.category, department: rfp.category, item: rfp.title }, who, olddata, rfp.toObject(), comments || "Approved");
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data: rfp }, null, 2) }] };
    }
  );

  // ── 24. reject_purchase_rfp ──────────────────────────────────────────────────
  server.tool(
    "reject_purchase_rfp",
    "Reject an RFP. The RFP regresses to the previous workflow level or becomes 'Rejected'.",
    {
      id: z.string(), role: z.string(), useremail: z.string(), username: z.string().optional(), comments: z.string().describe("Rejection reason")
    },
    async ({ id, role, useremail, username, comments }) => {
      requireAuth();
      await connectDB();
      const rfp = await PurchaseRfpMcp.findById(id);
      if (!rfp) throw new Error("RFP not found");
      const level = await matchingGenericLevel(rfp, "RFP", role, useremail);
      if (!level) throw new Error("RFP is not pending for your role and email at the current level");
      const olddata = rfp.toObject();
      const who = { username: username || "", useremail, role };
      rfp.rejectedreason = comments || "";
      addHistory(rfp, "Reject", who, comments || "");
      await regressGeneric(rfp, "RFP");
      await rfp.save();
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data: rfp }, null, 2) }] };
    }
  );

  // ── 25. list_purchase_vendors ─────────────────────────────────────────────────
  server.tool(
    "list_purchase_vendors",
    "List vendors registered in the purchase system. Supports regex search on companyname, username, gstno, panno. Passwords are excluded from results.",
    {
      search: z.string().optional().describe("Search across companyname, username, contactemail, gstno, panno"),
      status: z.string().optional().describe("e.g. Active, Inactive"),
      type: z.string().optional().describe("e.g. Pvt Ltd, Public Ltd, Partnership, Sole Proprietorship")
    },
    async ({ search, status, type }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (status) filter.status = status;
      if (type) filter.type = type;
      if (search) { const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); filter.$or = [{ companyname: rx }, { username: rx }, { contactemail: rx }, { gstno: rx }, { panno: rx }]; }
      const data = await PurchaseVendorMcp.find(filter).select("-password").sort({ companyname: 1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 26. save_purchase_vendor ──────────────────────────────────────────────────
  server.tool(
    "save_purchase_vendor",
    "Create or update a vendor. Required for new: companyname, username. Username must be unique per institution. Provide id to update an existing vendor.",
    {
      id: z.string().optional(),
      companyname: z.string().optional(),
      type: z.string().optional().describe("Pvt Ltd, Public Ltd, Partnership, Sole Proprietorship, etc."),
      address: z.string().optional(),
      gstno: z.string().optional(),
      panno: z.string().optional(),
      tanno: z.string().optional(),
      contactperson: z.string().optional(),
      contactemail: z.string().optional(),
      contactphone: z.string().optional(),
      specialization: z.string().optional(),
      pastrecords: z.string().optional(),
      bankdetails: z.string().optional(),
      username: z.string().optional().describe("Unique vendor login username"),
      status: z.string().optional(),
      remarks: z.string().optional(),
      createdby: z.string().optional(),
      createdbyname: z.string().optional()
    },
    async ({ id, companyname, type, address, gstno, panno, tanno, contactperson, contactemail, contactphone, specialization, pastrecords, bankdetails, username, status, remarks, createdby, createdbyname }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { colid, companyname, type, address, gstno, panno, tanno, contactperson, contactemail, contactphone, specialization, pastrecords, bankdetails, username, status, remarks, createdby, createdbyname };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      if (!id && username) {
        const exists = await PurchaseVendorMcp.findOne({ colid, username }).lean();
        if (exists) throw new Error(`Username '${username}' is already taken`);
      }
      const data = id ? await PurchaseVendorMcp.findByIdAndUpdate(id, payload, { new: true, runValidators: true }) : await PurchaseVendorMcp.create(payload);
      const safe = { ...data.toObject(), password: undefined };
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data: safe }, null, 2) }] };
    }
  );

  // ── 27. list_rfp_vendor_assignments ──────────────────────────────────────────
  server.tool(
    "list_rfp_vendor_assignments",
    "List vendor assignments for an RFP. Shows which vendors have been invited to submit bids, and their submission status.",
    {
      rfpid: z.string().optional().describe("RFP ID string (e.g. RFP-123-00001)"),
      rfp: z.string().optional().describe("RFP _id (ObjectId)")
    },
    async ({ rfpid, rfp }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (rfpid) filter.rfpid = rfpid;
      if (rfp) filter.rfp = rfp;
      const data = await PurchaseRfpVendorMcp.find(filter).sort({ vendorname: 1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 28. assign_rfp_vendors ────────────────────────────────────────────────────
  server.tool(
    "assign_rfp_vendors",
    "Assign one or more vendors to an RFP (invite them to submit bids). Existing assignments for the same vendor+RFP are upserted (not duplicated).",
    {
      rfpId: z.string().describe("RFP _id (ObjectId)"),
      vendorIds: z.array(z.string()).describe("Array of vendor _ids to assign"),
      remarks: z.string().optional(),
      username: z.string().optional(),
      useremail: z.string().optional()
    },
    async ({ rfpId, vendorIds, remarks, username, useremail }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const rfp = await PurchaseRfpMcp.findById(rfpId).lean();
      if (!rfp) throw new Error("RFP not found");
      const vendors = await PurchaseVendorMcp.find({ _id: { $in: vendorIds }, colid }).select("-password").lean();
      const results = [];
      for (const vendor of vendors) {
        const doc = await PurchaseRfpVendorMcp.findOneAndUpdate(
          { colid, rfp: rfp._id, vendor: vendor._id },
          { colid, rfp: rfp._id, rfpid: rfp.rfpid, rfptitle: rfp.title, vendor: vendor._id, vendorname: vendor.companyname, vendorusername: vendor.username, vendoremail: vendor.contactemail, vendorphone: vendor.contactphone, status: "Assigned", assignedby: useremail, assignedbyname: username, assignedat: new Date(), remarks: remarks || "" },
          { upsert: true, new: true }
        );
        results.push(doc);
      }
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", assigned: results.length, data: results }, null, 2) }] };
    }
  );

  // ── 29. list_rfp_submissions ──────────────────────────────────────────────────
  server.tool(
    "list_rfp_submissions",
    "List vendor bid submissions for an RFP, sorted by grand total ascending (cheapest first). Used on the vendor comparison page to select the winning bid.",
    {
      rfpid: z.string().optional().describe("RFP ID string"),
      rfp: z.string().optional().describe("RFP _id")
    },
    async ({ rfpid, rfp }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (rfpid) filter.rfpid = rfpid;
      if (rfp) filter.rfp = rfp;
      const data = await PurchaseRfpSubmissionMcp.find(filter).sort({ grandtotal: 1, vendorname: 1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 30. make_rfp_submission_editable ─────────────────────────────────────────
  server.tool(
    "make_rfp_submission_editable",
    "Allow a vendor to resubmit their bid by marking a submission as editable. Sets editable='Yes' and status='Editable'.",
    { id: z.string().describe("Submission _id") },
    async ({ id }) => {
      requireAuth();
      await connectDB();
      const data = await PurchaseRfpSubmissionMcp.findByIdAndUpdate(id, { editable: "Yes", status: "Editable" }, { new: true });
      if (!data) throw new Error("Submission not found");
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 31. create_po_from_submission ─────────────────────────────────────────────
  server.tool(
    "create_po_from_submission",
    "Create a Purchase Order from a winning vendor bid submission. Items, totals, and vendor details are copied from the submission. The PO enters the PurchaseOrder approval workflow immediately.",
    {
      submissionid: z.string().describe("RFP submission _id of the winning bid"),
      title: z.string().optional().describe("PO title (defaults to RFP title)"),
      paymentterms: z.string().optional(),
      deliveryterms: z.string().optional(),
      penaltyclause: z.string().optional(),
      generalterms: z.string().optional(),
      useremail: z.string().optional(),
      username: z.string().optional(),
      role: z.string().optional(),
      comments: z.string().optional()
    },
    async ({ submissionid, title, paymentterms, deliveryterms, penaltyclause, generalterms, useremail, username, role, comments }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const submission = await PurchaseRfpSubmissionMcp.findById(submissionid).lean();
      if (!submission) throw new Error("Submission not found");
      const rfp = await PurchaseRfpMcp.findById(submission.rfp).lean();
      const count = await PurchasePoMcp.countDocuments({ colid });
      const poid = `PNPO-${colid}-${String(count + 1).padStart(5, "0")}`;
      const who = { username: username || "", useremail: useremail || "", role: role || "" };
      const po = await PurchasePoMcp.create({
        colid, poid,
        title: title || rfp?.title || submission.rfptitle || poid,
        rfp: submission.rfp, rfpid: submission.rfpid, rfptitle: submission.rfptitle,
        submission: submission._id,
        vendor: submission.vendor, vendorname: submission.vendorname, vendorusername: submission.vendorusername, vendoremail: submission.vendoremail,
        items: submission.items,
        subtotal: submission.subtotal, gsttotal: submission.gsttotal, grandtotal: submission.grandtotal,
        paymentterms: paymentterms || rfp?.paymentterms || "",
        deliveryterms: deliveryterms || rfp?.deliveryterms || "",
        penaltyclause: penaltyclause || "",
        generalterms: generalterms || "",
        createdby: useremail, createdbyname: username,
        stage: "Draft", currentlevel: 0, status: "Draft"
      });
      await firstGenericState(po, "PurchaseOrder");
      addHistory(po, "Create PO", who, comments || "");
      await po.save();
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", poid, data: po }, null, 2) }] };
    }
  );

  // ── 32. list_purchase_orders ───────────────────────────────────────────────────
  server.tool(
    "list_purchase_orders",
    "List purchase orders with optional filters. Use status='Approved' for approved POs. Use vendorusername to filter by vendor.",
    {
      status: z.string().optional().describe("e.g. Approved, Draft, PurchaseOrder Pending Level 1, Rejected"),
      stage: z.string().optional(),
      rfpid: z.string().optional(),
      vendorusername: z.string().optional()
    },
    async ({ status, stage, rfpid, vendorusername }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (status) filter.status = status;
      if (stage) filter.stage = stage;
      if (rfpid) filter.rfpid = rfpid;
      if (vendorusername) filter.vendorusername = vendorusername;
      const data = await PurchasePoMcp.find(filter).sort({ createdAt: -1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 33. get_po_approval_queue ──────────────────────────────────────────────────
  server.tool(
    "get_po_approval_queue",
    "Get purchase orders pending approval for the current approver's role and email. Uses the 'PurchaseOrder' generic workflow.",
    {
      role: z.string(),
      useremail: z.string()
    },
    async ({ role, useremail }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const levels = await PurchaseApprovalWfMcp.find({ colid, workflowtype: "PurchaseOrder", active: "Yes", approverrole: role }).lean();
      const matched = levels.filter((l) => approverMatches(l, useremail));
      if (!matched.length) return { content: [{ type: "text", text: JSON.stringify({ data: [], queueCount: 0 }, null, 2) }] };
      const or = matched.map((l) => ({ stage: "PurchaseOrder", currentlevel: num(l.level, 0) }));
      const data = await PurchasePoMcp.find({ colid, $or: or }).sort({ createdAt: -1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, queueCount: data.length }, null, 2) }] };
    }
  );

  // ── 34. approve_purchase_order ────────────────────────────────────────────────
  server.tool(
    "approve_purchase_order",
    "Approve a purchase order. Approver role+email must match the PurchaseOrder workflow level. On final approval the PO status becomes 'Approved'.",
    {
      id: z.string(), role: z.string(), useremail: z.string(), username: z.string().optional(), comments: z.string().optional()
    },
    async ({ id, role, useremail, username, comments }) => {
      requireAuth();
      await connectDB();
      const po = await PurchasePoMcp.findById(id);
      if (!po) throw new Error("Purchase order not found");
      const level = await matchingGenericLevel(po, "PurchaseOrder", role, useremail);
      if (!level) throw new Error("PO is not pending for your role and email at the current level");
      const who = { username: username || "", useremail, role };
      addHistory(po, "Approve", who, comments || "Approved");
      await progressGeneric(po, "PurchaseOrder");
      await po.save();
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data: po }, null, 2) }] };
    }
  );

  // ── 35. reject_purchase_order ─────────────────────────────────────────────────
  server.tool(
    "reject_purchase_order",
    "Reject a purchase order. Regresses to the previous PurchaseOrder workflow level or becomes 'Rejected'.",
    {
      id: z.string(), role: z.string(), useremail: z.string(), username: z.string().optional(), comments: z.string().describe("Rejection reason")
    },
    async ({ id, role, useremail, username, comments }) => {
      requireAuth();
      await connectDB();
      const po = await PurchasePoMcp.findById(id);
      if (!po) throw new Error("Purchase order not found");
      const level = await matchingGenericLevel(po, "PurchaseOrder", role, useremail);
      if (!level) throw new Error("PO is not pending for your role and email at the current level");
      const who = { username: username || "", useremail, role };
      po.rejectedreason = comments || "";
      addHistory(po, "Reject", who, comments || "");
      await regressGeneric(po, "PurchaseOrder");
      await po.save();
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data: po }, null, 2) }] };
    }
  );

  // ── 36. list_delivery_schedules ───────────────────────────────────────────────
  server.tool(
    "list_delivery_schedules",
    "List delivery schedules for purchase orders. Filter by poid (e.g. 'PNPO-123-00001'), po (_id), or vendorusername. Shows accepted/returned quantities and quality check status.",
    {
      po: z.string().optional().describe("PO _id (ObjectId)"),
      poid: z.string().optional().describe("PO ID string e.g. PNPO-123-00001"),
      vendorusername: z.string().optional(),
      status: z.string().optional().describe("Scheduled, Delivered, Quality Checked, Partially Checked")
    },
    async ({ po, poid, vendorusername, status }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (po) filter.po = po;
      if (poid) filter.poid = poid;
      if (vendorusername) filter.vendorusername = vendorusername;
      if (status) filter.status = status;
      const data = await PurchaseDeliveryMcp.find(filter).sort({ deliverydatetime: 1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 37. update_delivery_quality ───────────────────────────────────────────────
  server.tool(
    "update_delivery_quality",
    "Record quality inspection results for a delivery schedule entry. acceptedquantity + returnedquantity must not exceed the scheduled quantity. Status becomes 'Quality Checked' (all accepted) or 'Partially Checked'.",
    {
      id: z.string().describe("Delivery schedule _id"),
      acceptedquantity: z.number().int().min(0).describe("Units accepted after quality check"),
      returnedquantity: z.number().int().min(0).describe("Units returned (rejected)"),
      qualityremarks: z.string().optional()
    },
    async ({ id, acceptedquantity, returnedquantity, qualityremarks }) => {
      requireAuth();
      await connectDB();
      const schedule = await PurchaseDeliveryMcp.findById(id);
      if (!schedule) throw new Error("Delivery schedule not found");
      const qty = num(schedule.quantity, 0);
      if (acceptedquantity + returnedquantity > qty) throw new Error(`Total (${acceptedquantity + returnedquantity}) exceeds scheduled quantity (${qty})`);
      schedule.acceptedquantity = acceptedquantity;
      schedule.returnedquantity = returnedquantity;
      schedule.qualityremarks = qualityremarks || "";
      schedule.status = returnedquantity > 0 ? "Partially Checked" : "Quality Checked";
      await schedule.save();
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data: schedule }, null, 2) }] };
    }
  );

  // ── 38. list_purchase_invoices ────────────────────────────────────────────────
  server.tool(
    "list_purchase_invoices",
    "List purchase invoices. Filter by poid, status, or vendorusername. Shows items, totals, and payment mode.",
    {
      poid: z.string().optional(),
      po: z.string().optional().describe("PO _id"),
      vendorusername: z.string().optional(),
      status: z.string().optional().describe("Draft, FinancePayment Pending Level 1, Approved, Rejected")
    },
    async ({ poid, po, vendorusername, status }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (poid) filter.poid = poid;
      if (po) filter.po = po;
      if (vendorusername) filter.vendorusername = vendorusername;
      if (status) filter.status = status;
      const data = await PurchaseInvoiceMcp.find(filter).sort({ createdAt: -1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 39. get_invoice_approval_queue ───────────────────────────────────────────
  server.tool(
    "get_invoice_approval_queue",
    "Get invoices pending finance payment approval for the current approver's role and email. Uses the 'FinancePayment' generic workflow.",
    {
      role: z.string(),
      useremail: z.string()
    },
    async ({ role, useremail }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const levels = await PurchaseApprovalWfMcp.find({ colid, workflowtype: "FinancePayment", active: "Yes", approverrole: role }).lean();
      const matched = levels.filter((l) => approverMatches(l, useremail));
      if (!matched.length) return { content: [{ type: "text", text: JSON.stringify({ data: [], queueCount: 0 }, null, 2) }] };
      const or = matched.map((l) => ({ stage: "FinancePayment", currentlevel: num(l.level, 0) }));
      const data = await PurchaseInvoiceMcp.find({ colid, $or: or }).sort({ createdAt: -1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, queueCount: data.length }, null, 2) }] };
    }
  );

  // ── 40. approve_purchase_invoice ─────────────────────────────────────────────
  server.tool(
    "approve_purchase_invoice",
    "Approve an invoice for payment. Approver role+email must match the FinancePayment workflow level.",
    {
      id: z.string(), role: z.string(), useremail: z.string(), username: z.string().optional(), comments: z.string().optional()
    },
    async ({ id, role, useremail, username, comments }) => {
      requireAuth();
      await connectDB();
      const invoice = await PurchaseInvoiceMcp.findById(id);
      if (!invoice) throw new Error("Invoice not found");
      const level = await matchingGenericLevel(invoice, "FinancePayment", role, useremail);
      if (!level) throw new Error("Invoice is not pending for your role and email at the current level");
      const who = { username: username || "", useremail, role };
      addHistory(invoice, "Approve", who, comments || "Approved");
      await progressGeneric(invoice, "FinancePayment");
      await invoice.save();
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data: invoice }, null, 2) }] };
    }
  );

  // ── 41. reject_purchase_invoice ──────────────────────────────────────────────
  server.tool(
    "reject_purchase_invoice",
    "Reject an invoice. Regresses to the previous FinancePayment workflow level or becomes 'Rejected'.",
    {
      id: z.string(), role: z.string(), useremail: z.string(), username: z.string().optional(), comments: z.string().describe("Rejection reason")
    },
    async ({ id, role, useremail, username, comments }) => {
      requireAuth();
      await connectDB();
      const invoice = await PurchaseInvoiceMcp.findById(id);
      if (!invoice) throw new Error("Invoice not found");
      const level = await matchingGenericLevel(invoice, "FinancePayment", role, useremail);
      if (!level) throw new Error("Invoice is not pending for your role and email at the current level");
      const who = { username: username || "", useremail, role };
      invoice.rejectedreason = comments || "";
      addHistory(invoice, "Reject", who, comments || "");
      await regressGeneric(invoice, "FinancePayment");
      await invoice.save();
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data: invoice }, null, 2) }] };
    }
  );
}
