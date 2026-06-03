/**
 * mfees-config-tools.js
 *
 * MCP tools mirroring MFeesConfigPage.jsx + mfeesconfigctlrds.js
 *
 * Collection: fees  (Mongoose model "Fees")
 *
 * Tools:
 *   get_mfees_options          – dropdown data (feebooks, cashbooks, programs,
 *                                 regulations, majors, minors) scoped by context
 *   list_mfees                 – list fee records with filters
 *   add_mfees                  – create a fee record
 *   update_mfees               – update a fee record by id
 *   bulk_create_mfees          – bulk insert from JSON array (⚠️ WRITE)
 *   get_mfees_for_approval     – records pending approval for the caller's role
 *   approve_mfees              – approve a fee record (moves approval workflow)
 *   reject_mfees               – reject a fee record
 *   get_excel_template_mfees   – sample Excel template columns + rows
 */

import mongoose from "mongoose";
import { z } from "zod";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const feesSchema = new mongoose.Schema(
  {
    name: String, user: String, colid: Number,
    academicyear: { type: String, required: true },
    program: String, programcode: { type: String, required: true },
    regulation: String, major: String, minor: String, IDC: String,
    gender: String, feebook: String, cashbook: String,
    feegroup: { type: String, required: true },
    semester: { type: String, required: true },
    feeeitem: { type: String, required: true },
    feecategory: { type: String, required: true },
    studtype: String, domicile: String, feetype: String,
    classdate: Date, amount: Number, status: String,
    approvalhistory: { type: Array, default: [] }
  },
  { strict: false, collection: "fees" }
);

const feebookSchema = new mongoose.Schema(
  { feebook: String, colid: Number },
  { strict: false, collection: "feebooks" }
);

const cashbookSchema = new mongoose.Schema(
  { cashbook: String, cashnook: String, colid: Number },
  { strict: false, collection: "cashbooks" }
);

const mprogramsSchema = new mongoose.Schema(
  { program: String, name: String, programcode: String, colid: Number },
  { strict: false, collection: "mprograms" }
);

const regulationMasterSchema = new mongoose.Schema(
  { regulation: String, colid: Number, isactive: String },
  { strict: false, collection: "regulationmasterds" }
);

const regulationSubjectSchema = new mongoose.Schema(
  { regulation: String, academicyear: String, program: String, programcode: String,
    subject: String, type: String, colid: Number, status: String },
  { strict: false, collection: "regulationsubjectds" }
);

const feeApprovalRoleSchema = new mongoose.Schema(
  { colid: Number, role: String, level: Number, isactive: String },
  { strict: false, collection: "feeapprovalroles" }
);

// ── Guarded model registrations ───────────────────────────────────────────────
const FeesConfig     = mongoose.models.FeesConfig       || mongoose.model("FeesConfig",      feesSchema,             "fees");
const FeebookMfees   = mongoose.models.FeebookMfees     || mongoose.model("FeebookMfees",    feebookSchema,          "feebooks");
const CashbookMfees  = mongoose.models.CashbookMfees    || mongoose.model("CashbookMfees",   cashbookSchema,         "cashbooks");
const MProgramsMfees = mongoose.models.MProgramsMfees   || mongoose.model("MProgramsMfees",  mprogramsSchema,        "mprograms");
const RegMasterMfees = mongoose.models.RegMasterMfees   || mongoose.model("RegMasterMfees",  regulationMasterSchema, "regulationmasterds");
const RegSubjMfees   = mongoose.models.RegSubjMfees     || mongoose.model("RegSubjMfees",    regulationSubjectSchema,"regulationsubjectds");
const FeeApprRole    = mongoose.models.FeeApprRole      || mongoose.model("FeeApprRole",     feeApprovalRoleSchema,  "feeapprovalroles");

// ─── Helpers ──────────────────────────────────────────────────────────────────
function safeNum(v)   { const n = Number(v ?? 0); return Number.isNaN(n) ? 0 : n; }
function cleanStr(v)  { return String(v ?? "").trim(); }

function buildQuery(colid, params) {
  const query = { colid };
  ["academicyear","programcode","regulation","major","minor","IDC","gender",
   "semester","feebook","cashbook","status"].forEach((key) => {
    if (params[key]) query[key] = cleanStr(params[key]);
  });
  return query;
}

function cleanPayload(input, colid, user) {
  return {
    name:        cleanStr(input.name || user),
    user:        cleanStr(input.user || user),
    colid,
    academicyear:cleanStr(input.academicyear) || "2026-27",
    program:     cleanStr(input.program),
    programcode: cleanStr(input.programcode),
    regulation:  cleanStr(input.regulation),
    major:       cleanStr(input.major),
    minor:       cleanStr(input.minor),
    IDC:         cleanStr(input.IDC || input.idc),
    gender:      cleanStr(input.gender),
    feebook:     cleanStr(input.feebook),
    cashbook:    cleanStr(input.cashbook),
    feegroup:    cleanStr(input.feegroup),
    semester:    cleanStr(input.semester),
    feeeitem:    cleanStr(input.feeeitem || input.feeitem),
    feecategory: cleanStr(input.feecategory),
    studtype:    cleanStr(input.studtype),
    domicile:    cleanStr(input.domicile),
    feetype:     cleanStr(input.feetype),
    classdate:   input.classdate ? new Date(input.classdate) : new Date(),
    amount:      safeNum(input.amount),
    status:      cleanStr(input.status) || "Added"
  };
}

function validatePayload(p) {
  if (!p.academicyear) return "academicyear is required";
  if (!p.programcode)  return "programcode is required";
  if (!p.feegroup)     return "feegroup is required";
  if (!p.semester)     return "semester is required";
  if (!p.feeeitem)     return "feeeitem (fee item name) is required";
  if (!p.feecategory)  return "feecategory is required";
  return "";
}

async function getApprovalRoles(colid) {
  const roles = await FeeApprRole.find({ colid, isactive: { $ne: "No" } }).sort({ level: 1 }).lean();
  return roles.map((r) => cleanStr(r.role)).filter(Boolean);
}

// ─── Tool registration ────────────────────────────────────────────────────────
export function registerMFeesConfigTools(server, { requireAuth, resolveColid, resolveUser, connectDB }) {
  const text = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });

  // ════════════════════════════════════════════════════════════════════════════
  // 1. get_mfees_options
  //    Mirrors getMFeesOptions — feebooks, cashbooks, programs, regulations,
  //    majors (type=Major), minors (type=Minor), IDCs (type=IDC) from regulation
  //    subjects, plus distinct values already in the fees collection.
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "get_mfees_options",
    "Get dropdown options for the mfees fee configuration form: fee books, cash books, " +
    "programs, regulations, majors, minors, IDC subjects. " +
    "Optionally scope majors/minors/IDC by academicyear, regulation, and programcode.",
    {
      colid:        z.number().optional().describe("College ID (from session)"),
      academicyear: z.string().optional().describe("Scope regulation subjects by academic year"),
      regulation:   z.string().optional().describe("Scope regulation subjects by regulation"),
      programcode:  z.string().optional().describe("Scope regulation subjects by program code")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);

      const subjectQuery = { colid };
      if (params.academicyear) subjectQuery.academicyear = params.academicyear;
      if (params.regulation)   subjectQuery.regulation   = params.regulation;
      if (params.programcode)  subjectQuery.programcode  = params.programcode;

      const [
        feebooks, cashbooks, programs,
        masterRegulations, subjectRegulations,
        majors, minors, idcs,
        feeAcademicYears, feeProgramRows, feeRegulations,
        feeMajors, feeMinors, feeIdcs,
        feeGenders, feeSemesters, feeStatuses
      ] = await Promise.all([
        FeebookMfees.find({ colid }).sort({ feebook: 1 }).lean(),
        CashbookMfees.find({ colid }).sort({ cashbook: 1, cashnook: 1 }).lean(),
        MProgramsMfees.find({ colid }).sort({ program: 1, programcode: 1 }).lean(),
        RegMasterMfees.find({ colid, isactive: "Yes" }).sort({ regulation: 1 }).lean(),
        RegSubjMfees.distinct("regulation", { colid, ...(params.academicyear ? { academicyear: params.academicyear } : {}) }),
        RegSubjMfees.find({ ...subjectQuery, type: "Major",  status: "Active" }).sort({ subject: 1 }).lean(),
        RegSubjMfees.find({ ...subjectQuery, type: "Minor",  status: "Active" }).sort({ subject: 1 }).lean(),
        RegSubjMfees.find({ ...subjectQuery, type: "IDC",    status: "Active" }).sort({ subject: 1 }).lean(),
        FeesConfig.distinct("academicyear", { colid }),
        FeesConfig.find({ colid }).select("program programcode").lean(),
        FeesConfig.distinct("regulation",  { colid }),
        FeesConfig.distinct("major",       { colid }),
        FeesConfig.distinct("minor",       { colid }),
        FeesConfig.distinct("IDC",         { colid }),
        FeesConfig.distinct("gender",      { colid }),
        FeesConfig.distinct("semester",    { colid }),
        FeesConfig.distinct("status",      { colid })
      ]);

      const regulations = [...new Set([
        ...subjectRegulations.filter(Boolean),
        ...masterRegulations.map((r) => r.regulation).filter(Boolean)
      ])].sort((a, b) => a.localeCompare(b));

      return text({
        success: true,
        academicYears: [...new Set(["2026-27","2027-28","2028-29","2029-30","2030-31", ...(feeAcademicYears||[])])].sort(),
        feebooks:  feebooks.map((f) => f.feebook).filter(Boolean),
        cashbooks: cashbooks.map((c) => c.cashbook || c.cashnook).filter(Boolean),
        programs:  programs.map((p) => ({
          _id: String(p._id), program: p.program || p.name || "", programcode: p.programcode || ""
        })).filter((p) => p.program || p.programcode),
        regulations,
        majors: majors.map((m) => m.subject).filter(Boolean),
        minors: minors.map((m) => m.subject).filter(Boolean),
        idcs:   idcs.map((m) => m.subject).filter(Boolean),
        feeFilterOptions: {
          academicYears: (feeAcademicYears||[]).filter(Boolean).sort(),
          programs: [...new Map(feeProgramRows.filter((p) => p.programcode)
            .map((p) => [p.programcode, { program: p.program||"", programcode: p.programcode }])).values()]
            .sort((a,b) => (a.program||"").localeCompare(b.program||"")),
          regulations: (feeRegulations||[]).filter(Boolean).sort(),
          majors:  (feeMajors||[]).filter(Boolean).sort(),
          minors:  (feeMinors||[]).filter(Boolean).sort(),
          idcs:    (feeIdcs||[]).filter(Boolean).sort(),
          genders: (feeGenders||[]).filter(Boolean).sort(),
          semesters: (feeSemesters||[]).filter(Boolean).sort(),
          statuses:  (feeStatuses||[]).filter(Boolean).sort()
        }
      });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 2. list_mfees
  //    Mirrors getMFees — list fee records with filter support.
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "list_mfees",
    "List mfees fee configuration records. Filter by academicyear, programcode, regulation, " +
    "major, minor, IDC, gender, semester, feebook, cashbook, status. All filters are exact match.",
    {
      colid:        z.number().optional().describe("College ID (from session)"),
      academicyear: z.string().optional().describe("Academic year e.g. 2026-27"),
      programcode:  z.string().optional().describe("Program code"),
      regulation:   z.string().optional().describe("Regulation"),
      major:        z.string().optional().describe("Major subject"),
      minor:        z.string().optional().describe("Minor subject"),
      IDC:          z.string().optional().describe("IDC subject"),
      gender:       z.string().optional().describe("Gender"),
      semester:     z.string().optional().describe("Semester e.g. 1"),
      feebook:      z.string().optional().describe("Fee book"),
      cashbook:     z.string().optional().describe("Cash book"),
      status:       z.string().optional().describe("Status e.g. Active, Added, Rejected"),
      limit:        z.number().int().min(1).max(2000).optional().default(500)
        .describe("Max records to return (default 500)")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);
      const query = buildQuery(colid, params);

      const data = await FeesConfig.find(query)
        .sort({ academicyear: -1, program: 1, semester: 1, feeeitem: 1 })
        .limit(params.limit ?? 500)
        .lean();

      return text({
        success: true,
        count:   data.length,
        data: data.map((r) => ({
          _id:         String(r._id),
          academicyear:r.academicyear,
          feebook:     r.feebook     || "",
          cashbook:    r.cashbook    || "",
          program:     r.program     || "",
          programcode: r.programcode || "",
          regulation:  r.regulation  || "",
          major:       r.major       || "",
          minor:       r.minor       || "",
          IDC:         r.IDC         || "",
          gender:      r.gender      || "",
          feegroup:    r.feegroup    || "",
          semester:    r.semester    || "",
          feeitem:     r.feeeitem    || "",
          feecategory: r.feecategory || "",
          studtype:    r.studtype    || "",
          domicile:    r.domicile    || "",
          feetype:     r.feetype     || "",
          duedate:     r.classdate   ? new Date(r.classdate).toISOString().slice(0,10) : "",
          amount:      safeNum(r.amount),
          status:      r.status      || "",
          user:        r.user        || "",
          historyCount: Array.isArray(r.approvalhistory) ? r.approvalhistory.length : 0
        }))
      });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 3. add_mfees
  //    Mirrors createMFees
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "add_mfees",
    "Create a new mfees fee configuration record. " +
    "Required: academicyear, programcode, feegroup, semester, feeeitem, feecategory, amount.",
    {
      colid:        z.number().optional().describe("College ID (from session)"),
      academicyear: z.string().min(1).describe("Academic year e.g. 2026-27"),
      program:      z.string().optional().describe("Program name"),
      programcode:  z.string().min(1).describe("Program code e.g. BTECH-CSE"),
      regulation:   z.string().optional().describe("Regulation e.g. R2021"),
      major:        z.string().optional().describe("Major subject"),
      minor:        z.string().optional().describe("Minor subject"),
      IDC:          z.string().optional().describe("IDC subject"),
      gender:       z.string().optional().describe("Gender filter e.g. Male, Female"),
      feebook:      z.string().optional().describe("Fee book"),
      cashbook:     z.string().optional().describe("Cash book"),
      feegroup:     z.string().min(1).describe("Fee group e.g. Tuition Fee"),
      semester:     z.string().min(1).describe("Semester e.g. 1"),
      feeeitem:     z.string().min(1).describe("Fee item name (feeeitem — 3 e's)"),
      feecategory:  z.string().min(1).describe("Fee category e.g. General, SC, OBC"),
      studtype:     z.string().optional().describe("Student type"),
      domicile:     z.string().optional().describe("Domicile"),
      feetype:      z.string().optional().describe("Fee type"),
      classdate:    z.string().optional().describe("Due date YYYY-MM-DD"),
      amount:       z.number().min(0).describe("Fee amount in INR"),
      status:       z.string().optional().default("Added").describe("Status (default: Added)")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);
      const user  = resolveUser();
      const p     = cleanPayload(params, colid, user);
      const err   = validatePayload(p);
      if (err) return text({ success: false, error: err });

      const data = await FeesConfig.create(p);
      return text({ success: true, _id: String(data._id), data: { ...p, _id: String(data._id) } });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 4. update_mfees
  //    Mirrors updateMFees
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "update_mfees",
    "Update an existing mfees fee configuration record. Get _id from list_mfees.",
    {
      id:           z.string().min(1).describe("Record _id from list_mfees"),
      colid:        z.number().optional().describe("College ID (from session)"),
      academicyear: z.string().optional().describe("Academic year"),
      program:      z.string().optional().describe("Program name"),
      programcode:  z.string().optional().describe("Program code"),
      regulation:   z.string().optional().describe("Regulation"),
      major:        z.string().optional().describe("Major subject"),
      minor:        z.string().optional().describe("Minor subject"),
      IDC:          z.string().optional().describe("IDC subject"),
      gender:       z.string().optional().describe("Gender"),
      feebook:      z.string().optional().describe("Fee book"),
      cashbook:     z.string().optional().describe("Cash book"),
      feegroup:     z.string().optional().describe("Fee group"),
      semester:     z.string().optional().describe("Semester"),
      feeeitem:     z.string().optional().describe("Fee item name"),
      feecategory:  z.string().optional().describe("Fee category"),
      studtype:     z.string().optional().describe("Student type"),
      domicile:     z.string().optional().describe("Domicile"),
      feetype:      z.string().optional().describe("Fee type"),
      classdate:    z.string().optional().describe("Due date YYYY-MM-DD"),
      amount:       z.number().min(0).optional().describe("Amount"),
      status:       z.string().optional().describe("Status")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);
      const user  = resolveUser();

      // Fetch existing to merge — required fields must still be valid
      const existing = await FeesConfig.findById(params.id).lean();
      if (!existing || existing.colid !== colid) {
        return text({ success: false, error: "Fee record not found" });
      }

      const merged = { ...existing, ...params, colid, user };
      const p   = cleanPayload(merged, colid, user);
      const err = validatePayload(p);
      if (err) return text({ success: false, error: err });

      const data = await FeesConfig.findByIdAndUpdate(params.id, p, { new: true, runValidators: true }).lean();
      return text({ success: true, _id: String(data._id), data: { ...p, _id: String(data._id) } });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 5. bulk_create_mfees  ⚠️ WRITE
  //    Mirrors bulkCreateMFees
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "bulk_create_mfees",
    "⚠️ WRITE — Bulk insert mfees fee records from a JSON array. " +
    "Required per row: academicyear, programcode, feegroup, semester, feeeitem, feecategory, amount. " +
    "Rows with validation errors are skipped and reported.",
    {
      colid: z.number().optional().describe("College ID (from session)"),
      items: z.array(z.object({
        academicyear: z.string().describe("Academic year e.g. 2026-27"),
        program:      z.string().optional(),
        programcode:  z.string().describe("Program code"),
        regulation:   z.string().optional(),
        major:        z.string().optional(),
        minor:        z.string().optional(),
        IDC:          z.string().optional(),
        gender:       z.string().optional(),
        feebook:      z.string().optional(),
        cashbook:     z.string().optional(),
        feegroup:     z.string().describe("Fee group"),
        semester:     z.string().describe("Semester"),
        feeeitem:     z.string().optional().describe("Fee item (feeeitem — 3 e's)"),
        feeitem:      z.string().optional().describe("Alias for feeeitem"),
        feecategory:  z.string().describe("Fee category"),
        studtype:     z.string().optional(),
        domicile:     z.string().optional(),
        feetype:      z.string().optional(),
        classdate:    z.string().optional().describe("Due date YYYY-MM-DD"),
        amount:       z.union([z.number(), z.string()]).describe("Amount"),
        status:       z.string().optional()
      })).min(1).max(500).describe("Fee records to insert (max 500)")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);
      const user  = resolveUser();

      const errors = [];
      const valid  = [];

      params.items.forEach((item, idx) => {
        const p   = cleanPayload({ ...item, status: item.status || "Added" }, colid, user);
        const err = validatePayload(p);
        if (err) { errors.push({ rowNumber: idx + 2, message: err }); return; }
        valid.push(p);
      });

      const inserted = valid.length
        ? await FeesConfig.insertMany(valid, { ordered: false })
        : [];

      return text({
        success:    true,
        inserted:   inserted.length,
        errorCount: errors.length,
        errors
      });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 6. get_mfees_for_approval
  //    Mirrors getMFeesForApproval — fees pending for the caller's role
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "get_mfees_for_approval",
    "Get mfees fee records pending approval for a specific role. " +
    "The approval workflow uses roles configured in FeeApprovalRole. " +
    "First-level approver sees status 'Added'; subsequent levels see '<Role>_PENDING'.",
    {
      colid: z.number().optional().describe("College ID (from session)"),
      role:  z.string().min(1).describe("Approver role name e.g. HOD, Finance, Principal")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid       = resolveColid(params.colid);
      const currentRole = cleanStr(params.role);

      const roles        = await getApprovalRoles(colid);
      const currentIndex = roles.findIndex((r) => r.toLowerCase() === currentRole.toLowerCase());

      if (currentIndex === -1) {
        return text({ success: true, roles, data: [], message: `Role '${currentRole}' is not configured for fee approval` });
      }

      const ownPending     = `${roles[currentIndex]}_PENDING`;
      const statusFilter   = currentIndex === 0
        ? ["Added", ownPending, "Active"]
        : [ownPending, "Active"];

      const data = await FeesConfig.find({ colid, status: { $in: statusFilter } })
        .sort({ academicyear: -1, program: 1, semester: 1, feeeitem: 1 })
        .lean();

      return text({
        success: true,
        role:    currentRole,
        roles,
        currentLevel: currentIndex + 1,
        count:   data.length,
        data: data.map((r) => ({
          _id:         String(r._id),
          academicyear:r.academicyear, program: r.program,
          programcode: r.programcode,  regulation: r.regulation,
          feegroup:    r.feegroup,     semester: r.semester,
          feeitem:     r.feeeitem,     feecategory: r.feecategory,
          amount:      safeNum(r.amount), status: r.status
        }))
      });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 9. approve_mfees
  //    Mirrors approveMFees — advances the approval workflow
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "approve_mfees",
    "Approve a mfees fee record. Advances the approval workflow to the next level. " +
    "When all levels approve, status becomes 'Active'. " +
    "Get _id from get_mfees_for_approval or list_mfees.",
    {
      id:      z.string().min(1).describe("Fee record _id to approve"),
      colid:   z.number().optional().describe("College ID (from session)"),
      role:    z.string().min(1).describe("Approver role name e.g. HOD, Finance"),
      remarks: z.string().optional().describe("Approval remarks / notes")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid       = resolveColid(params.colid);
      const user        = resolveUser();
      const currentRole = cleanStr(params.role);

      const fee = await FeesConfig.findById(params.id);
      if (!fee || fee.colid !== colid) return text({ success: false, error: "Fee record not found" });

      const roles        = await getApprovalRoles(colid);
      if (!roles.length)  return text({ success: false, error: "Fee approval roles are not configured" });

      const currentIndex = roles.findIndex((r) => r.toLowerCase() === currentRole.toLowerCase());
      if (currentIndex === -1) return text({ success: false, error: `Role '${currentRole}' is not configured for fee approval` });

      const expectedStatus  = currentIndex === 0 ? "Added"  : `${roles[currentIndex]}_PENDING`;
      const altExpected     = `${roles[currentIndex]}_PENDING`;
      if (fee.status !== expectedStatus && fee.status !== altExpected) {
        return text({ success: false, error: `Fee is at status '${fee.status}', not pending for '${currentRole}'` });
      }

      const nextRole   = roles[currentIndex + 1];
      const nextStatus = nextRole ? `${nextRole}_PENDING` : "Active";

      const history = Array.isArray(fee.approvalhistory) ? fee.approvalhistory : [];
      history.push({
        role:       roles[currentIndex],
        action:     "Approved",
        remarks:    cleanStr(params.remarks),
        user,
        date:       new Date(),
        fromstatus: fee.status,
        tostatus:   nextStatus
      });

      const data = await FeesConfig.findByIdAndUpdate(
        params.id,
        { status: nextStatus, approvalhistory: history },
        { new: true }
      ).lean();

      return text({
        success:    true,
        message:    nextRole ? `Approved. Now pending with '${nextRole}'` : "Fully approved — status is Active",
        _id:        params.id,
        fromstatus: fee.status,
        tostatus:   nextStatus,
        roles
      });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 10. reject_mfees
  //     Mirrors rejectMFees
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "reject_mfees",
    "Reject a mfees fee record. Sets status to 'Rejected' and records the rejection in history.",
    {
      id:      z.string().min(1).describe("Fee record _id to reject"),
      colid:   z.number().optional().describe("College ID (from session)"),
      role:    z.string().min(1).describe("Rejecting role name"),
      remarks: z.string().min(1).describe("Rejection reason / remarks")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);
      const user  = resolveUser();

      const fee = await FeesConfig.findById(params.id);
      if (!fee || fee.colid !== colid) return text({ success: false, error: "Fee record not found" });

      const history = Array.isArray(fee.approvalhistory) ? fee.approvalhistory : [];
      history.push({
        role:       cleanStr(params.role),
        action:     "Rejected",
        remarks:    cleanStr(params.remarks),
        user,
        date:       new Date(),
        fromstatus: fee.status,
        tostatus:   "Rejected"
      });

      await FeesConfig.findByIdAndUpdate(params.id, { status: "Rejected", approvalhistory: history });
      return text({ success: true, message: "Fee record rejected", _id: params.id, fromstatus: fee.status });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 11. get_excel_template_mfees
  //     Sample Excel columns and rows — mirrors handleBulkUpload alias mapping
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "get_excel_template_mfees",
    "Return the expected column names and sample rows for the mfees bulk upload Excel template.",
    {},
    async () => {
      requireAuth();
      return text({
        success:  true,
        filename: "mfees_config_template.xlsx",
        columns:  [
          "academicyear","feebook","cashbook","program","programcode",
          "regulation","major","minor","feegroup","semester",
          "feeeitem","feecategory","studtype","domicile","feetype",
          "classdate","amount","status"
        ],
        aliases: {
          academicyear: ["academicyear","Academic Year"],
          feebook:      ["feebook","Fee Book"],
          cashbook:     ["cashbook","Cash Book"],
          program:      ["program","Program"],
          programcode:  ["programcode","Program Code"],
          regulation:   ["regulation","Regulation"],
          major:        ["major","Major"],
          minor:        ["minor","Minor"],
          feegroup:     ["feegroup","Fee Group"],
          semester:     ["semester","Semester"],
          feeeitem:     ["feeeitem","feeitem","Fee Item"],
          feecategory:  ["feecategory","Fee Category"],
          studtype:     ["studtype","Student Type"],
          domicile:     ["domicile","Domicile"],
          feetype:      ["feetype","Fee Type"],
          classdate:    ["classdate","Due Date"],
          amount:       ["amount","Amount"],
          status:       ["status"]
        },
        sampleRows: [
          { academicyear:"2026-27", feebook:"Main", cashbook:"Cash",
            program:"Bachelor of Technology", programcode:"BTECH-CSE",
            regulation:"R2021", major:"", minor:"",
            feegroup:"Tuition Fee", semester:"1",
            feeeitem:"Tuition Fee Sem 1", feecategory:"General",
            studtype:"", domicile:"", feetype:"",
            classdate:"2026-07-01", amount:50000, status:"Added" },
          { academicyear:"2026-27", feebook:"Main", cashbook:"Cash",
            program:"Bachelor of Technology", programcode:"BTECH-CSE",
            regulation:"R2021", major:"", minor:"",
            feegroup:"Tuition Fee", semester:"1",
            feeeitem:"Tuition Fee Sem 1", feecategory:"SC",
            studtype:"", domicile:"", feetype:"",
            classdate:"2026-07-01", amount:25000, status:"Added" }
        ],
        requiredFields: ["academicyear","programcode","feegroup","semester","feeeitem","feecategory","amount"]
      });
    }
  );
}
