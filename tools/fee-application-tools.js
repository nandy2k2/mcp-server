/**
 * fee-application-tools.js
 *
 * Two features covered:
 *
 * ── A: Application Fee Configuration (applicationfeectlrds.js) ──────────────
 *   Manages application fee amounts per program / academic year.
 *   Collection: applicationfeeds
 *
 *   Tools:
 *     get_application_fee_options          – programs + academic years for dropdowns
 *     list_application_fees                – list configured fees with filters
 *     add_application_fee                  – create a new fee record
 *     update_application_fee               – update an existing record
 *     bulk_upload_application_fees         – insert multiple records from JSON
 *     get_excel_template_application_fees  – sample Excel template rows
 *
 * ── B: Fee Application Workflow (feeapplicationctlrds.js) ───────────────────
 *   Search enrolled students + fee structures from the Fees master,
 *   then bulk-create Ledgerstud entries (applies fees to students).
 *
 *   Tools:
 *     get_fee_application_options      – distinct field values for student + fee filters
 *     search_fee_application_students  – find students matching filter criteria
 *     search_fee_application_fees      – find fee structures matching filter criteria
 *     apply_fees_to_students           – ⚠️ WRITE: create ledger entries
 */

import mongoose from "mongoose";
import { z } from "zod";

// ─── Schemas ──────────────────────────────────────────────────────────────────

// A: applicationfeeds collection
const applicationFeeSchema = new mongoose.Schema(
  {
    academicyear: { type: String, required: true },
    program:      { type: String, required: true },
    programcode:  { type: String, required: true },
    amount:       { type: Number, required: true },
    active:       { type: String, enum: ["Yes", "No"], default: "Yes" },
    user:         { type: String },
    colid:        { type: Number, required: true }
  },
  { strict: false, timestamps: true, collection: "applicationfees" }
);

// B: mprograms (for program dropdown)
const mprogramsSchema = new mongoose.Schema(
  { program: String, programcode: String, name: String, colid: Number },
  { strict: false }
);

// B: fees collection (fee structures master)
const feesSchema = new mongoose.Schema(
  {
    name: String, user: String, programcode: String, program: String,
    regulation: String, major: String, minor: String, IDC: String,
    gender: String, feebook: String, cashbook: String,
    feegroup: String, semester: String, feeeitem: String,
    academicyear: String, feecategory: String,
    studtype: String, domicile: String, feetype: String,
    classdate: Date, amount: Number, colid: Number, status: String
  },
  { strict: false, collection: "fees" }
);

// B: users (students)
const studentSchema = new mongoose.Schema(
  {
    email: String, name: String, phone: String, regno: String,
    program: String, programcode: String, admissionyear: String,
    academicyear: String, semester: String, section: String,
    gender: String, department: String, category: String,
    address: String, regulation: String,
    Major: String, Minor: String, IDC: String,
    institution: String, role: String, colid: Number, status: Number
  },
  { strict: false }
);

// B: ledgerstuds (created by applyFeesToStudents)
const ledgerstudSchema = new mongoose.Schema(
  {
    name: String, user: String, feegroup: String, regno: String,
    student: String, feeitem: String,
    amount: Number, paid: Number, concession: Number, balance: Number,
    cash: Number, upi: Number, cheque: Number, card: Number, pg: Number, neft: Number,
    feebook: String, feecounter: String, paymode: String, paydetails: String,
    feecategory: String, semester: String, cashbook: String,
    institution: String, type: String, installment: String, comments: String,
    academicyear: String, colid: Number,
    classdate: Date, duedate: Date, paiddate: Date,
    status: String, programcode: String, regulation: String,
    major: String, minor: String, feeid: String, admissionyear: String,
    approvalhistory: Array
  },
  { strict: false, collection: "ledgerstuds" }
);

// ── Guarded model registrations ────────────────────────────────────────────
const ApplicationFeeModel = mongoose.models.ApplicationFeeConfig
  || mongoose.model("ApplicationFeeConfig", applicationFeeSchema, "applicationfees");

const MProgramsFee = mongoose.models.MProgramsFeeApp
  || mongoose.model("MProgramsFeeApp", mprogramsSchema, "mprograms");

const FeesModel = mongoose.models.FeesMasterApp
  || mongoose.model("FeesMasterApp", feesSchema, "fees");

const StudentModelFeeApp = mongoose.models.StudentFeeApp
  || mongoose.model("StudentFeeApp", studentSchema, "users");

const LedgerstudFeeApp = mongoose.models.LedgerstudFeeApp
  || mongoose.model("LedgerstudFeeApp", ledgerstudSchema, "ledgerstuds");

// ─── Helpers ──────────────────────────────────────────────────────────────────
function safeNum(v)  { const n = Number(v ?? 0); return Number.isNaN(n) ? 0 : n; }
function cleanStr(v) { return String(v ?? "").trim(); }
function makeRegex(v){ return new RegExp(cleanStr(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); }

async function distinctSorted(Model, field, query) {
  const values = await Model.distinct(field, query);
  return values.filter(Boolean).sort((a, b) => String(a).localeCompare(String(b)));
}

const FIXED_ACADEMIC_YEARS = [
  "2023-24","2024-25","2025-26","2026-27",
  "2027-28","2028-29","2029-30","2030-31"
];

// ─── Tool registration ────────────────────────────────────────────────────────
export function registerFeeApplicationTools(server, { requireAuth, resolveColid, resolveUser, connectDB }) {
  const text = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });

  // ══════════════════════════════════════════════════════════════════════════
  // ── A: APPLICATION FEE CONFIGURATION ─────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // ── A1. get_application_fee_options ──────────────────────────────────────
  server.tool(
    "get_application_fee_options",
    "Get dropdown options for the Application Fee form: list of programs and academic years. " +
    "Call this before add_application_fee or list_application_fees to know valid values.",
    { colid: z.number().optional().describe("College ID (from session)") },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);
      const [programs, years] = await Promise.all([
        MProgramsFee.find({ colid }).sort({ program: 1, programcode: 1 }).lean(),
        ApplicationFeeModel.distinct("academicyear", { colid })
      ]);
      const academicYears = [...new Set([...FIXED_ACADEMIC_YEARS, ...(years || [])])].sort((a,b) => a.localeCompare(b));
      return text({
        success: true,
        academicYears,
        programs: programs.map((p) => ({
          _id: String(p._id),
          program: p.program || p.name || "",
          programcode: p.programcode || ""
        })).filter((p) => p.program || p.programcode),
        activeOptions: ["Yes", "No"]
      });
    }
  );

  // ── A2. list_application_fees ─────────────────────────────────────────────
  server.tool(
    "list_application_fees",
    "List configured application fee amounts by program and academic year. " +
    "Filter by academicyear, programcode, active status.",
    {
      colid:        z.number().optional().describe("College ID (from session)"),
      academicyear: z.string().optional().describe("Academic year e.g. 2026-27"),
      programcode:  z.string().optional().describe("Program code"),
      program:      z.string().optional().describe("Program name (partial match)"),
      active:       z.enum(["Yes", "No"]).optional().describe("Active status")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);
      const query = { colid };
      if (params.academicyear) query.academicyear = params.academicyear;
      if (params.programcode)  query.programcode  = params.programcode;
      if (params.active)       query.active       = params.active;
      if (params.program)      query.program      = makeRegex(params.program);

      const data = await ApplicationFeeModel.find(query)
        .sort({ academicyear: -1, program: 1, programcode: 1 })
        .lean();

      return text({
        success: true,
        count:   data.length,
        data:    data.map((r) => ({
          _id:         String(r._id),
          academicyear:r.academicyear,
          program:     r.program,
          programcode: r.programcode,
          amount:      safeNum(r.amount),
          active:      r.active,
          user:        r.user || ""
        }))
      });
    }
  );

  // ── A3. add_application_fee ───────────────────────────────────────────────
  server.tool(
    "add_application_fee",
    "Create a new application fee record for a program and academic year.",
    {
      colid:        z.number().optional().describe("College ID (from session)"),
      academicyear: z.string().min(1).describe("Academic year e.g. 2026-27"),
      program:      z.string().min(1).describe("Program name"),
      programcode:  z.string().min(1).describe("Program code"),
      amount:       z.number().positive().describe("Application fee amount in INR"),
      active:       z.enum(["Yes", "No"]).default("Yes").describe("Whether this fee is active")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);
      const user  = resolveUser();
      const data  = await ApplicationFeeModel.create({
        academicyear: params.academicyear,
        program:      params.program,
        programcode:  params.programcode,
        amount:       params.amount,
        active:       params.active ?? "Yes",
        user,
        colid
      });
      return text({ success: true, data: { _id: String(data._id), ...data.toObject() } });
    }
  );

  // ── A4. update_application_fee ────────────────────────────────────────────
  server.tool(
    "update_application_fee",
    "Update an existing application fee record. Get _id from list_application_fees.",
    {
      id:           z.string().min(1).describe("Record _id from list_application_fees"),
      colid:        z.number().optional().describe("College ID (from session)"),
      academicyear: z.string().optional().describe("Academic year"),
      program:      z.string().optional().describe("Program name"),
      programcode:  z.string().optional().describe("Program code"),
      amount:       z.number().positive().optional().describe("New amount"),
      active:       z.enum(["Yes", "No"]).optional().describe("Active status")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid   = resolveColid(params.colid);
      const user    = resolveUser();
      const updates = {};
      if (params.academicyear) updates.academicyear = params.academicyear;
      if (params.program)      updates.program      = params.program;
      if (params.programcode)  updates.programcode  = params.programcode;
      if (params.amount)       updates.amount       = params.amount;
      if (params.active)       updates.active       = params.active;
      updates.user = user;

      const data = await ApplicationFeeModel.findOneAndUpdate(
        { _id: params.id, colid },
        updates,
        { new: true, runValidators: true }
      );
      if (!data) return text({ success: false, error: "Application fee not found" });
      return text({ success: true, data: { _id: String(data._id), ...data.toObject() } });
    }
  );

  // ── A5. bulk_upload_application_fees ─────────────────────────────────────
  server.tool(
    "bulk_upload_application_fees",
    "Bulk insert application fee records from a JSON array. " +
    "Each row must have: academicyear, program, programcode, amount. " +
    "active defaults to 'Yes' if omitted.",
    {
      colid: z.number().optional().describe("College ID (from session)"),
      rows:  z.array(z.object({
        academicyear: z.string().describe("Academic year e.g. 2026-27"),
        program:      z.string().describe("Program name"),
        programcode:  z.string().describe("Program code"),
        amount:       z.union([z.number(), z.string()]).describe("Fee amount"),
        active:       z.string().optional().describe("Yes or No (default Yes)")
      })).min(1).max(500).describe("Rows to insert (max 500)")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);
      const user  = resolveUser();
      const errors = [];
      const docs   = [];

      params.rows.forEach((row, idx) => {
        const academicyear = cleanStr(row.academicyear);
        const program      = cleanStr(row.program);
        const programcode  = cleanStr(row.programcode);
        const amount       = safeNum(row.amount);
        const active       = cleanStr(row.active) === "No" ? "No" : "Yes";
        if (!academicyear || !program || !programcode || !amount) {
          errors.push({ row: idx + 2, message: "academicyear, program, programcode and amount are required" });
          return;
        }
        docs.push({ academicyear, program, programcode, amount, active, user, colid });
      });

      const inserted = docs.length
        ? await ApplicationFeeModel.insertMany(docs, { ordered: false })
        : [];

      return text({
        success:  true,
        inserted: inserted.length,
        errors,
        errorCount: errors.length
      });
    }
  );

  // ── A7. get_excel_template_application_fees ───────────────────────────────
  server.tool(
    "get_excel_template_application_fees",
    "Return sample rows for the Application Fee Excel template. " +
    "Shows the required columns and an example row.",
    {},
    async () => {
      requireAuth();
      return text({
        success:   true,
        filename:  "Application_Fee_Template.xlsx",
        columns:   ["academicyear", "program", "programcode", "amount", "active"],
        sampleRows: [
          { academicyear: "2026-27", program: "Bachelor of Technology", programcode: "BTECH-CSE", amount: 500, active: "Yes" },
          { academicyear: "2026-27", program: "Bachelor of Commerce",   programcode: "BCOM",       amount: 300, active: "Yes" }
        ],
        notes: "amount must be a positive number. active must be Yes or No."
      });
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // ── B: FEE APPLICATION WORKFLOW ───────────────────────────────────────────
  //    Search students + fee structures, then apply (create ledger entries)
  // ══════════════════════════════════════════════════════════════════════════

  // ── B1. get_fee_application_options ──────────────────────────────────────
  server.tool(
    "get_fee_application_options",
    "Get filter option values for the fee application workflow from mfees (fees collection). " +
    "Mirrors mfeesconfigctlrds.js → getMFeesOptions. Returns distinct values for all mfees " +
    "filter fields — use these as input to search_fee_application_fees and " +
    "search_fee_application_students (both use the same mfees field names).",
    { colid: z.number().optional().describe("College ID (from session)") },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid    = resolveColid(params.colid);
      const feeQuery = { colid };

      // All distinct values sourced from mfees (fees collection) —
      // mirrors mfeesconfigctlrds.js → getMFeesOptions → feeFilterOptions
      const [
        academicYears, programcodes, programs,
        regulations, majors, minors, idcs,
        genders, semesters, feebooks, cashbooks,
        feeGroups, feeItems, feeCategories, feeStatuses
      ] = await Promise.all([
        distinctSorted(FeesModel, "academicyear",  feeQuery),
        distinctSorted(FeesModel, "programcode",   feeQuery),
        distinctSorted(FeesModel, "program",       feeQuery),
        distinctSorted(FeesModel, "regulation",    feeQuery),
        distinctSorted(FeesModel, "major",         feeQuery),
        distinctSorted(FeesModel, "minor",         feeQuery),
        distinctSorted(FeesModel, "IDC",           feeQuery),
        distinctSorted(FeesModel, "gender",        feeQuery),
        distinctSorted(FeesModel, "semester",      feeQuery),
        distinctSorted(FeesModel, "feebook",       feeQuery),
        distinctSorted(FeesModel, "cashbook",      feeQuery),
        distinctSorted(FeesModel, "feegroup",      feeQuery),
        distinctSorted(FeesModel, "feeeitem",      feeQuery),
        distinctSorted(FeesModel, "feecategory",   feeQuery),
        distinctSorted(FeesModel, "status",        feeQuery)
      ]);

      return text({
        success: true,
        note: "All values sourced from mfees. Use these as filter params for search_fee_application_fees and search_fee_application_students.",
        options: {
          academicyear: academicYears,
          programcode:  programcodes,
          program:      programs,
          regulation:   regulations,
          major:        majors,
          minor:        minors,
          IDC:          idcs,
          gender:       genders,
          semester:     semesters,
          feebook:      feebooks,
          cashbook:     cashbooks,
          feegroup:     feeGroups,
          feeitem:      feeItems,
          feecategory:  feeCategories,
          status:       feeStatuses
        }
      });
    }
  );

  // ── B2. search_fee_application_students ───────────────────────────────────
  // Uses the same named mfees filter params as search_fee_application_fees so
  // you can pass identical criteria to both tools (e.g. same programcode,
  // semester, regulation) to find the matching students and fee structures.
  server.tool(
    "search_fee_application_students",
    "Search enrolled students for fee application using the same filter fields as mfees. " +
    "Pass the same programcode, academicyear, regulation, semester, major, minor, IDC, gender " +
    "that you used in search_fee_application_fees to find the matching student cohort. " +
    "Returns student list with _id values needed for apply_fees_to_students. " +
    "At least one filter is required.",
    {
      colid:        z.number().optional().describe("College ID (from session)"),
      academicyear: z.string().optional().describe("Academic year / admission year e.g. 2024-25 — matches both academicyear and admissionyear on student"),
      programcode:  z.string().optional().describe("Program code e.g. BTECH-CSE"),
      regulation:   z.string().optional().describe("Regulation e.g. R2021"),
      major:        z.string().optional().describe("Major subject (maps to Major field on student)"),
      minor:        z.string().optional().describe("Minor subject (maps to Minor field on student)"),
      IDC:          z.string().optional().describe("IDC subject"),
      gender:       z.string().optional().describe("Gender e.g. Male, Female"),
      semester:     z.string().optional().describe("Semester e.g. 1, 2, 3"),
      section:      z.string().optional().describe("Section"),
      category:     z.string().optional().describe("Fee category / student category"),
      limit:        z.number().int().min(1).max(1000).optional().default(200)
        .describe("Max students to return (default 200)")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);

      // Must provide at least one filter
      const hasFilter = ["academicyear","programcode","regulation","major","minor","IDC","gender","semester","section","category"]
        .some((k) => params[k]);
      if (!hasFilter) {
        return text({ success: false, error: "Provide at least one filter (programcode, academicyear, regulation, semester, etc.) to avoid fetching all students." });
      }

      const query = { colid, role: /^Student$/i };

      // academicyear matches both academicyear and admissionyear on the User document
      if (params.academicyear) query.$or = [{ academicyear: params.academicyear }, { admissionyear: params.academicyear }];
      if (params.programcode)  query.programcode = params.programcode;
      if (params.regulation)   query.regulation  = params.regulation;
      // mfees uses lowercase major/minor/IDC; Users stores as Major/Minor/IDC
      if (params.major)        query.Major       = params.major;
      if (params.minor)        query.Minor       = params.minor;
      if (params.IDC)          query.IDC         = params.IDC;
      if (params.gender)       query.gender      = params.gender;
      if (params.semester)     query.semester    = params.semester;
      if (params.section)      query.section     = params.section;
      if (params.category)     query.category    = params.category;

      const data = await StudentModelFeeApp.find(query)
        .select("name email phone regno academicyear admissionyear program programcode department regulation Major Minor IDC semester section category gender colid")
        .sort({ academicyear: -1, admissionyear: -1, programcode: 1, name: 1 })
        .limit(params.limit ?? 200)
        .lean();

      return text({
        success: true,
        count:   data.length,
        hint:    "Use _id values in apply_fees_to_students > studentIds",
        data:    data.map((s) => ({
          _id:          String(s._id),
          name:         s.name,
          regno:        s.regno,
          email:        s.email,
          programcode:  s.programcode,
          program:      s.program,
          academicyear: s.academicyear || s.admissionyear,
          admissionyear:s.admissionyear,
          regulation:   s.regulation,
          semester:     s.semester,
          section:      s.section,
          major:        s.Major,
          minor:        s.Minor,
          IDC:          s.IDC,
          gender:       s.gender,
          category:     s.category
        }))
      });
    }
  );

  // ── B3. search_fee_application_fees ───────────────────────────────────────
  // Mirrors mfeesconfigctlrds.js → getMFees / buildQuery.
  // Queries the fees (mfees) collection with the exact same filter fields
  // that mfeesconfigctlrds.js uses.
  server.tool(
    "search_fee_application_fees",
    "Search mfees (fee master) records to select for fee application. " +
    "Queries the fees collection exactly as the mfees config controller does. " +
    "Returns fee items with _id (feeid) needed for apply_fees_to_students. " +
    "All filters are exact match. Use get_fee_application_options to see valid values.",
    {
      colid:        z.number().optional().describe("College ID (from session)"),
      academicyear: z.string().optional().describe("Academic year e.g. 2024-25"),
      programcode:  z.string().optional().describe("Program code e.g. BTECH-CSE"),
      regulation:   z.string().optional().describe("Regulation e.g. R2021"),
      major:        z.string().optional().describe("Major subject"),
      minor:        z.string().optional().describe("Minor subject"),
      IDC:          z.string().optional().describe("IDC subject"),
      gender:       z.string().optional().describe("Gender e.g. Male, Female"),
      semester:     z.string().optional().describe("Semester e.g. 1, 2, 3"),
      feebook:      z.string().optional().describe("Fee book"),
      cashbook:     z.string().optional().describe("Cash book"),
      status:       z.string().optional().describe("Fee status e.g. Active, Added"),
      limit:        z.number().int().min(1).max(1000).optional().default(200)
        .describe("Max records to return (default 200)")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);

      // Mirrors mfeesconfigctlrds.js buildQuery exactly
      const query = { colid };
      const EXACT_FIELDS = ["academicyear", "programcode", "regulation", "major", "minor", "IDC", "gender", "semester", "feebook", "cashbook", "status"];
      EXACT_FIELDS.forEach((key) => {
        if (params[key]) query[key] = cleanStr(params[key]);
      });

      const data = await FeesModel.find(query)
        .select("program programcode regulation major minor IDC gender feegroup semester feeeitem academicyear feecategory feebook cashbook classdate amount colid status")
        .sort({ academicyear: -1, programcode: 1, semester: 1, feegroup: 1, feeeitem: 1 })
        .limit(params.limit ?? 200)
        .lean();

      return text({
        success: true,
        count:   data.length,
        hint:    "Use _id as feeid in apply_fees_to_students > feeItems",
        data:    data.map((f) => ({
          _id:         String(f._id),
          feeid:       String(f._id),
          programcode: f.programcode,
          program:     f.program,
          regulation:  f.regulation,
          major:       f.major,
          minor:       f.minor,
          IDC:         f.IDC,
          gender:      f.gender,
          feegroup:    f.feegroup,
          semester:    f.semester,
          feeitem:     f.feeeitem,
          academicyear:f.academicyear,
          feecategory: f.feecategory,
          feebook:     f.feebook,
          cashbook:    f.cashbook,
          duedate:     f.classdate ? new Date(f.classdate).toISOString().slice(0, 10) : "",
          amount:      safeNum(f.amount),
          status:      f.status
        }))
      });
    }
  );

  // ── B4. apply_fees_to_students  ⚠️ WRITE ─────────────────────────────────
  server.tool(
    "apply_fees_to_students",
    "⚠️ WRITE — Apply selected fee structures to selected students by creating " +
    "Ledgerstud ledger entries. One entry is created per student × fee item combination. " +
    "Get studentIds from search_fee_application_students and feeIds from search_fee_application_fees. " +
    "Optionally specify a concession amount per fee item. " +
    "balance = amount - concession. status = 'Added' if concession > 0, else 'Active'.",
    {
      colid:      z.number().optional().describe("College ID (from session)"),
      studentIds: z.array(z.string()).min(1).max(500)
        .describe("Student _id values from search_fee_application_students (max 500)"),
      feeItems:   z.array(z.object({
        feeid:      z.string().describe("Fee _id from search_fee_application_fees"),
        concession: z.number().min(0).optional().default(0)
          .describe("Concession amount for this fee item (default 0)")
      })).min(1).max(100).describe("Fee items to apply, optionally with concession (max 100)")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);
      const user  = resolveUser();

      const feeIds = params.feeItems.map((item) => item.feeid).filter(Boolean);
      const concessionMap = new Map(params.feeItems.map((item) => [item.feeid, Math.max(0, safeNum(item.concession))]));

      const [students, fees] = await Promise.all([
        StudentModelFeeApp.find({ _id: { $in: params.studentIds }, colid, role: /^Student$/i }).lean(),
        FeesModel.find({ _id: { $in: feeIds }, colid }).lean()
      ]);

      if (!students.length) return text({ success: false, error: "No matching students found for the given IDs" });
      if (!fees.length)    return text({ success: false, error: "No matching fee structures found for the given IDs" });

      const feeMap = new Map(fees.map((f) => [String(f._id), f]));
      const entries = [];

      students.forEach((student) => {
        feeIds.forEach((feeid) => {
          const fee = feeMap.get(String(feeid));
          if (!fee) return;
          const amount     = safeNum(fee.amount);
          const concession = concessionMap.get(String(feeid)) || 0;
          const balance    = Math.max(0, amount - concession);
          entries.push({
            name:         cleanStr(user),
            user:         cleanStr(user),
            feegroup:     fee.feegroup    || "NA",
            regno:        student.regno   || "NA",
            student:      student.name    || "NA",
            feeitem:      fee.feeeitem    || "NA",
            amount,
            paid:         0,
            concession,
            balance,
            cash: 0, upi: 0, cheque: 0, card: 0, pg: 0, neft: 0,
            feebook:      fee.feebook     || "",
            feecounter:   "",
            paymode:      "",
            paydetails:   "",
            feecategory:  fee.feecategory || student.category || "",
            semester:     fee.semester    || student.semester || "",
            cashbook:     fee.cashbook    || "",
            institution:  student.institution || "",
            type:         "positive",
            installment:  "",
            comments:     "Fee application bulk entry",
            academicyear: fee.academicyear || student.academicyear || student.admissionyear || "",
            colid,
            classdate:    new Date(),
            duedate:      fee.classdate || new Date(),
            status:       concession > 0 ? "Added" : "Active",
            programcode:  fee.programcode || student.programcode || "",
            admissionyear:student.admissionyear || fee.academicyear || "",
            regulation:   fee.regulation  || student.regulation || "",
            major:        fee.major       || student.Major     || "",
            minor:        fee.minor       || student.Minor     || "",
            feeid:        String(fee._id),
            approvalhistory: []
          });
        });
      });

      if (!entries.length) return text({ success: false, error: "No ledger entries could be created (students/fees not found or mismatched)" });

      const inserted = await LedgerstudFeeApp.insertMany(entries, { ordered: false });

      return text({
        success:       true,
        inserted:      inserted.length,
        studentCount:  students.length,
        feeCount:      fees.length,
        expectedEntries: students.length * fees.length,
        message:       `${inserted.length} ledger item(s) created for ${students.length} student(s) across ${fees.length} fee item(s)`,
        studentNames:  students.map((s) => `${s.name} (${s.regno})`),
        feeItems:      fees.map((f) => `${f.feegroup} - ${f.feeeitem} (₹${safeNum(f.amount)})`)
      });
    }
  );
}
