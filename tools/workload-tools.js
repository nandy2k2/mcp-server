/**
 * Workload Assignment tools — shared between index.js (stdio) and server.js (HTTP)
 *
 * Models  : workloadassignmentds (primary)
 *           regulationcoursemapds (course lookup)
 *           regulationsubjectds   (subject lookup)
 *           Users                 (faculty lookup, role=Faculty)
 *
 * Tools registered (14 total):
 *   CRUD     : list_workload_assignments, get_workload_options,
 *              add_workload_assignment, update_workload_assignment,
 *              delete_workload_assignment
 *   Bulk     : bulk_upload_workload_from_json, bulk_upload_workload_from_excel,
 *              get_excel_template_workload
 *   Reports  : report_workload_by_faculty, report_workload_by_department,
 *              report_workload_by_program, report_workload_by_semester,
 *              report_workload_summary, report_workload_unassigned_courses
 *
 * Usage:
 *   registerWorkloadTools(server, { requireAuth, resolveColid, resolveUser, connectDB })
 */

import { z } from "zod";
import mongoose from "mongoose";
import * as XLSX from "xlsx";
import * as fs from "fs";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const workloadAssignmentSchema = new mongoose.Schema({
  academicyear:      { type: String, trim: true, required: true },
  regulation:        { type: String, trim: true, required: true },
  program:           { type: String, trim: true, required: true },
  programcode:       { type: String, trim: true, required: true },
  type:              { type: String, trim: true, required: true },
  subject:           { type: String, trim: true, required: true },
  semester:          { type: String, trim: true, required: true },
  course:            { type: String, trim: true, required: true },
  coursecode:        { type: String, trim: true, required: true },
  facultyname:       { type: String, trim: true, required: true },
  facultyemail:      { type: String, trim: true, required: true },
  facultydepartment: { type: String, trim: true },
  status:            { type: String, trim: true, default: "Active" },
  colid:             { type: Number, required: true },
  user:              { type: String, trim: true }
}, { timestamps: true });

const regulationCourseMapSchema = new mongoose.Schema({
  academicyear: { type: String, trim: true },
  regulation:   { type: String, trim: true },
  subject:      { type: String, trim: true },
  type:         { type: String, trim: true },
  semester:     { type: String, trim: true },
  program:      { type: String, trim: true },
  programcode:  { type: String, trim: true },
  course:       { type: String, trim: true },
  coursecode:   { type: String, trim: true },
  credit:       { type: Number, default: 0 },
  status:       { type: String, trim: true },
  colid:        { type: Number }
}, { timestamps: true });

const regulationSubjectSchema = new mongoose.Schema({
  regulation:   { type: String, trim: true },
  academicyear: { type: String, trim: true },
  program:      { type: String, trim: true },
  programcode:  { type: String, trim: true },
  subject:      { type: String, trim: true },
  type:         { type: String, trim: true },
  status:       { type: String, trim: true },
  colid:        { type: Number }
}, { timestamps: true });

const facultyLookupSchema = new mongoose.Schema({
  name:       { type: String },
  email:      { type: String },
  department: { type: String },
  role:       { type: String },
  colid:      { type: Number },
  status:     { type: Number }
});

export const WorkloadAssignment = mongoose.models.workloadassignmentds
  || mongoose.model("workloadassignmentds", workloadAssignmentSchema);

export const RegulationCourseMap = mongoose.models.regulationcoursemapds
  || mongoose.model("regulationcoursemapds", regulationCourseMapSchema);

export const RegulationSubject = mongoose.models.regulationsubjectds
  || mongoose.model("regulationsubjectds", regulationSubjectSchema);

// Use a unique model name (with explicit collection) so we don't shadow the
// "Users" model that index.js/server.js registers for login authentication.
export const FacultyUser = mongoose.models.FacultyLookupUsers
  || mongoose.model("FacultyLookupUsers", facultyLookupSchema, "users");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const clean    = (v) => String(v ?? "").trim();
const toNum    = (v) => { const n = Number(v); return Number.isNaN(n) ? undefined : n; };
const uniq     = (arr) => [...new Set(arr.map(clean).filter(Boolean))].sort((a, b) => a.localeCompare(b));

function workloadPayload(input = {}, colid, user) {
  return {
    academicyear:      clean(input.academicyear || input.academicYear),
    regulation:        clean(input.regulation),
    program:           clean(input.program),
    programcode:       clean(input.programcode || input["program code"] || input["programCode"]),
    type:              clean(input.type),
    subject:           clean(input.subject),
    semester:          clean(input.semester),
    course:            clean(input.course),
    coursecode:        clean(input.coursecode || input["course code"] || input["courseCode"]),
    facultyname:       clean(input.facultyname  || input.facultyName  || input["faculty name"]),
    facultyemail:      clean(input.facultyemail || input.facultyEmail || input["faculty email"]),
    facultydepartment: clean(input.facultydepartment || input.department || input.facultyDepartment || input["faculty department"]),
    status:            clean(input.status) || "Active",
    colid:             toNum(input.colid || colid),
    user:              clean(input.user  || user)
  };
}

function validatePayload(p) {
  if (!p.academicyear)  return "Academic year is required";
  if (!p.regulation)    return "Regulation is required";
  if (!p.program)       return "Program is required";
  if (!p.programcode)   return "Program code is required";
  if (!p.type)          return "Type is required";
  if (!p.subject)       return "Subject is required";
  if (!p.semester)      return "Semester is required";
  if (!p.course)        return "Course is required";
  if (!p.coursecode)    return "Course code is required";
  if (!p.facultyname)   return "Faculty name is required";
  if (!p.facultyemail)  return "Faculty email is required";
  if (p.colid === undefined) return "colid is required";
  return "";
}

function serializeAssignment(d) {
  const doc = d.toObject ? d.toObject() : d;
  return {
    id:                String(doc._id),
    academicyear:      doc.academicyear,
    regulation:        doc.regulation,
    program:           doc.program,
    programcode:       doc.programcode,
    type:              doc.type,
    subject:           doc.subject,
    semester:          doc.semester,
    course:            doc.course,
    coursecode:        doc.coursecode,
    facultyname:       doc.facultyname,
    facultyemail:      doc.facultyemail,
    facultydepartment: doc.facultydepartment,
    status:            doc.status,
    colid:             doc.colid,
    user:              doc.user,
    createdAt:         doc.createdAt,
    updatedAt:         doc.updatedAt
  };
}

// Excel normalizer — mirrors the frontend normalizeHeader logic
const normalizeHeader = (v) => String(v || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const excelColumnMap = {
  academicyear:      ["academicyear", "academic year", "acadyear", "year"],
  regulation:        ["regulation"],
  program:           ["program", "programme"],
  programcode:       ["programcode", "program code", "progcode"],
  type:              ["type"],
  subject:           ["subject", "major", "subject major"],
  semester:          ["semester", "sem"],
  course:            ["course", "coursename", "course name"],
  coursecode:        ["coursecode", "course code", "courseno"],
  facultyname:       ["facultyname", "faculty name", "faculty", "name"],
  facultyemail:      ["facultyemail", "faculty email", "email"],
  facultydepartment: ["facultydepartment", "faculty department", "department", "dept"],
  status:            ["status"]
};

function excelRowToWorkloadBody(row) {
  const normalized = {};
  for (const [k, v] of Object.entries(row)) normalized[normalizeHeader(k)] = v;
  const body = {};
  for (const [field, aliases] of Object.entries(excelColumnMap)) {
    for (const alias of aliases) {
      if (normalized[alias] !== undefined) { body[field] = normalized[alias]; break; }
    }
  }
  return body;
}

// ─── Tool registrar ───────────────────────────────────────────────────────────
/**
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server
 * @param {{ requireAuth, resolveColid, resolveUser, connectDB }} helpers
 */
export function registerWorkloadTools(server, { requireAuth, resolveColid, resolveUser, connectDB }) {
  const text = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });

  // ════════════════════════════════════════════════════════════════════════════
  // CRUD TOOLS
  // ════════════════════════════════════════════════════════════════════════════

  // ── list_workload_assignments ─────────────────────────────────────────────
  server.tool(
    "list_workload_assignments",
    "List workload assignments for your college. Filter by any combination of academic year, regulation, program, type, subject, semester, faculty, department or status.",
    {
      academicyear:      z.string().optional().describe("Academic year e.g. 2026-27"),
      regulation:        z.string().optional().describe("Regulation e.g. 2019, NEP2020"),
      program:           z.string().optional().describe("Program name e.g. B.Com"),
      programcode:       z.string().optional().describe("Program code e.g. BCOM"),
      type:              z.string().optional().describe("Type: Major / Minor / AEC / SEC / VAC / IDC"),
      subject:           z.string().optional().describe("Subject / major name"),
      semester:          z.string().optional().describe("Semester e.g. 1, 2, 3"),
      course:            z.string().optional().describe("Course name partial match"),
      coursecode:        z.string().optional().describe("Course code"),
      facultyname:       z.string().optional().describe("Faculty name partial match"),
      facultyemail:      z.string().optional().describe("Faculty email exact match"),
      facultydepartment: z.string().optional().describe("Faculty department"),
      status:            z.enum(["Active","Inactive"]).optional().describe("Status filter"),
      limit:             z.number().int().optional().default(200).describe("Max results (default 200)")
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const filter = { colid };
      const exactFields = ["academicyear","regulation","program","programcode","type","subject","semester","coursecode","status"];
      for (const f of exactFields) { if (args[f]) filter[f] = args[f]; }
      // Partial match for names
      if (args.course)       filter.course       = new RegExp(args.course.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (args.facultyname)  filter.facultyname  = new RegExp(args.facultyname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (args.facultyemail) filter.facultyemail = { $regex: `^${args.facultyemail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" };
      if (args.facultydepartment) filter.facultydepartment = args.facultydepartment;
      const maxLimit = Math.min(Math.max(args.limit || 200, 1), 1000);
      const data = await WorkloadAssignment.find(filter)
        .sort({ facultyname: 1, academicyear: 1, regulation: 1, programcode: 1, subject: 1, semester: 1, course: 1 })
        .limit(maxLimit).lean();
      return text({ success: true, total: data.length, colid, assignments: data.map(serializeAssignment) });
    }
  );

  // ── get_workload_options ──────────────────────────────────────────────────
  server.tool(
    "get_workload_options",
    "Get dropdown options for workload assignment: academic years, regulations, programs, types, subjects, semesters, courses, departments, and faculty list. Optionally narrow courses by filtering fields.",
    {
      academicyear: z.string().optional().describe("Filter courses by academic year"),
      regulation:   z.string().optional().describe("Filter courses by regulation"),
      programcode:  z.string().optional().describe("Filter courses by program code"),
      type:         z.string().optional().describe("Filter courses by type"),
      subject:      z.string().optional().describe("Filter courses by subject"),
      semester:     z.string().optional().describe("Filter courses by semester"),
      department:   z.string().optional().describe("Filter faculty by department")
    },
    async ({ academicyear, regulation, programcode, type, subject, semester, department }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);

      // Build queries for each source
      const courseQuery = { colid };
      if (academicyear) courseQuery.academicyear = academicyear;
      if (regulation)   courseQuery.regulation   = regulation;
      if (programcode)  courseQuery.programcode  = programcode;
      if (type)         courseQuery.type         = type;
      if (subject)      courseQuery.subject      = subject;
      if (semester)     courseQuery.semester     = semester;

      const subjectQuery = { colid };
      if (academicyear) subjectQuery.academicyear = academicyear;
      if (regulation)   subjectQuery.regulation   = regulation;
      if (programcode)  subjectQuery.programcode  = programcode;
      if (type)         subjectQuery.type         = type;

      const facultyQuery = { colid, role: "Faculty" };
      if (department)   facultyQuery.department = department;

      const [courseMaps, regulationSubjects, facultyList, assignments] = await Promise.all([
        RegulationCourseMap.find(courseQuery).sort({ academicyear: 1, regulation: 1, program: 1, type: 1, subject: 1, semester: 1, course: 1 }).lean(),
        RegulationSubject.find(subjectQuery).sort({ subject: 1 }).lean(),
        FacultyUser.find(facultyQuery).select("name email department").sort({ name: 1 }).lean(),
        WorkloadAssignment.find({ colid }).lean()
      ]);

      const allRows = [...courseMaps, ...assignments];
      const programMap = new Map();
      allRows.forEach((item) => {
        if (item.programcode) programMap.set(item.programcode, { programcode: item.programcode, program: item.program || "" });
      });
      const courseMap = new Map();
      courseMaps.forEach((item) => {
        if (item.coursecode) courseMap.set(item.coursecode, {
          academicyear: item.academicyear, regulation: item.regulation, program: item.program,
          programcode: item.programcode, type: item.type, subject: item.subject,
          semester: item.semester, course: item.course, coursecode: item.coursecode, credit: item.credit
        });
      });

      const fallbackYears = ["2026-27","2027-28","2028-29","2029-30","2030-31"];

      return text({
        success: true, colid,
        academicyears: uniq([...fallbackYears, ...allRows.map(r => r.academicyear)]),
        regulations:   uniq(allRows.map(r => r.regulation)),
        programs:      [...programMap.values()].sort((a, b) => a.programcode.localeCompare(b.programcode)),
        types:         uniq([...allRows.map(r => r.type), "Major", "Minor", "AEC", "SEC", "VAC", "IDC"]),
        subjects:      uniq(regulationSubjects.map(r => r.subject)),
        semesters:     uniq(allRows.map(r => r.semester)),
        courses:       [...courseMap.values()].sort((a, b) => (a.course || "").localeCompare(b.course || "")),
        departments:   uniq([...facultyList.map(f => f.department), ...assignments.map(a => a.facultydepartment)]),
        faculty:       facultyList.map(f => ({ name: f.name || "", email: f.email || "", department: f.department || "" }))
      });
    }
  );

  // ── add_workload_assignment ───────────────────────────────────────────────
  server.tool(
    "add_workload_assignment",
    "Add a single workload assignment (one faculty + one course). All fields are required. Use get_workload_options to browse valid values.",
    {
      academicyear:      z.string().min(1).describe("Academic year e.g. 2026-27"),
      regulation:        z.string().min(1).describe("Regulation e.g. 2019, NEP2020"),
      program:           z.string().min(1).describe("Program name e.g. B.Com"),
      programcode:       z.string().min(1).describe("Program code e.g. BCOM"),
      type:              z.string().min(1).describe("Type: Major / Minor / AEC / SEC / VAC / IDC"),
      subject:           z.string().min(1).describe("Subject / major name"),
      semester:          z.string().min(1).describe("Semester e.g. 1, 2, 3"),
      course:            z.string().min(1).describe("Course name"),
      coursecode:        z.string().min(1).describe("Course code"),
      facultyname:       z.string().min(1).describe("Faculty full name"),
      facultyemail:      z.string().email().describe("Faculty email — use list_users_for_crm or get_workload_options to find valid emails"),
      facultydepartment: z.string().optional().default("").describe("Faculty department"),
      status:            z.enum(["Active","Inactive"]).optional().default("Active")
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid   = resolveColid(undefined);
      const user    = resolveUser(undefined);
      const payload = workloadPayload(args, colid, user);
      const err     = validatePayload(payload);
      if (err) return text({ error: err });
      try {
        const doc = await WorkloadAssignment.create(payload);
        return text({ success: true, message: "Workload assignment created", assignment: serializeAssignment(doc) });
      } catch (e) {
        return text({ error: e.message });
      }
    }
  );

  // ── update_workload_assignment ────────────────────────────────────────────
  server.tool(
    "update_workload_assignment",
    "Update an existing workload assignment by its MongoDB _id. Get the id from list_workload_assignments.",
    {
      id:                z.string().describe("Assignment _id from list_workload_assignments"),
      academicyear:      z.string().optional(),
      regulation:        z.string().optional(),
      program:           z.string().optional(),
      programcode:       z.string().optional(),
      type:              z.string().optional(),
      subject:           z.string().optional(),
      semester:          z.string().optional(),
      course:            z.string().optional(),
      coursecode:        z.string().optional(),
      facultyname:       z.string().optional(),
      facultyemail:      z.string().optional(),
      facultydepartment: z.string().optional(),
      status:            z.enum(["Active","Inactive"]).optional()
    },
    async ({ id, ...args }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const user  = resolveUser(undefined);
      try {
        // Merge existing + updates then re-validate
        const existing = await WorkloadAssignment.findOne({ _id: id, colid });
        if (!existing) return text({ error: "Assignment not found or does not belong to your college" });
        const merged  = workloadPayload({ ...existing.toObject(), ...args }, colid, user);
        const err     = validatePayload(merged);
        if (err) return text({ error: err });
        const doc = await WorkloadAssignment.findByIdAndUpdate(id, merged, { new: true, runValidators: true });
        return text({ success: true, message: "Assignment updated", assignment: serializeAssignment(doc) });
      } catch (e) {
        return text({ error: e.message });
      }
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // BULK TOOLS
  // ════════════════════════════════════════════════════════════════════════════

  // ── bulk_upload_workload_from_json ────────────────────────────────────────
  server.tool(
    "bulk_upload_workload_from_json",
    "Bulk insert workload assignments from a JSON array. All 11 required fields must be present in each object. colid and user taken from session.",
    {
      assignments: z.array(z.object({
        academicyear:      z.string(),
        regulation:        z.string(),
        program:           z.string(),
        programcode:       z.string(),
        type:              z.string(),
        subject:           z.string(),
        semester:          z.string(),
        course:            z.string(),
        coursecode:        z.string(),
        facultyname:       z.string(),
        facultyemail:      z.string(),
        facultydepartment: z.string().optional(),
        status:            z.string().optional()
      })).min(1).describe("Array of assignment objects — all required fields must be present"),
      skip_duplicates: z.boolean().optional().default(false)
        .describe("If true, silently skip rows where coursecode+facultyemail+colid already exists (upsert not supported — use update_workload_assignment to edit)")
    },
    async ({ assignments, skip_duplicates }) => {
      requireAuth();
      await connectDB();
      const colid  = resolveColid(undefined);
      const user   = resolveUser(undefined);
      const errors = [];
      const valid  = [];

      for (let i = 0; i < assignments.length; i++) {
        const payload = workloadPayload(assignments[i], colid, user);
        const err     = validatePayload(payload);
        if (err) { errors.push({ row: i + 1, message: err }); continue; }
        if (skip_duplicates) {
          const exists = await WorkloadAssignment.exists({ colid, coursecode: payload.coursecode, facultyemail: payload.facultyemail });
          if (exists) { errors.push({ row: i + 1, message: `Duplicate skipped: ${payload.coursecode} / ${payload.facultyemail}` }); continue; }
        }
        valid.push(payload);
      }

      let inserted = 0;
      if (valid.length) {
        try {
          const result = await WorkloadAssignment.insertMany(valid, { ordered: false });
          inserted = result.length;
        } catch (e) {
          if (e.insertedDocs) inserted = e.insertedDocs.length;
          errors.push({ row: "batch", message: e.message });
        }
      }
      return text({ success: true, colid, total: assignments.length, inserted, skipped: assignments.length - inserted - errors.filter(e => e.row !== "batch").length, error_count: errors.length, errors: errors.slice(0, 20) });
    }
  );

  // ── bulk_upload_workload_from_excel ───────────────────────────────────────
  server.tool(
    "bulk_upload_workload_from_excel",
    "Upload workload assignments from an Excel file (.xlsx/.xls). First row must be headers. Required columns: Academic Year, Regulation, Program, Program Code, Type, Subject, Semester, Course, Course Code, Faculty Name, Faculty Email.",
    {
      file_path:       z.string().describe("Absolute path to the Excel file on disk"),
      skip_duplicates: z.boolean().optional().default(false)
        .describe("Skip rows where coursecode+facultyemail+colid already exists")
    },
    async ({ file_path, skip_duplicates }) => {
      requireAuth();
      await connectDB();
      if (!fs.existsSync(file_path)) return text({ error: `File not found: ${file_path}` });
      let workbook;
      try { workbook = XLSX.readFile(file_path); }
      catch (e) { return text({ error: `Cannot read Excel file: ${e.message}` }); }

      const sheet     = workbook.Sheets[workbook.SheetNames[0]];
      const excelRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      if (!excelRows.length) return text({ error: "No data rows found in the file" });

      const colid  = resolveColid(undefined);
      const user   = resolveUser(undefined);
      const errors = [];
      const valid  = [];

      for (let i = 0; i < excelRows.length; i++) {
        const rowNum  = i + 2;
        const body    = excelRowToWorkloadBody(excelRows[i]);
        const payload = workloadPayload(body, colid, user);
        const err     = validatePayload(payload);
        if (err) { errors.push({ row: rowNum, message: err }); continue; }
        if (skip_duplicates) {
          const exists = await WorkloadAssignment.exists({ colid, coursecode: payload.coursecode, facultyemail: payload.facultyemail });
          if (exists) { errors.push({ row: rowNum, message: `Duplicate skipped: ${payload.coursecode} / ${payload.facultyemail}` }); continue; }
        }
        valid.push(payload);
      }

      let inserted = 0;
      if (valid.length) {
        try {
          const result = await WorkloadAssignment.insertMany(valid, { ordered: false });
          inserted = result.length;
        } catch (e) {
          if (e.insertedDocs) inserted = e.insertedDocs.length;
          errors.push({ row: "batch", message: e.message });
        }
      }
      return text({ success: true, colid, total_rows: excelRows.length, inserted, error_count: errors.length, errors: errors.slice(0, 20) });
    }
  );

  // ── get_excel_template_workload ───────────────────────────────────────────
  server.tool(
    "get_excel_template_workload",
    "Generate a sample Excel template for bulk workload assignment upload with all column headers and one example row.",
    {
      output_path: z.string().describe("Absolute path where the .xlsx template should be saved e.g. /tmp/workload_template.xlsx")
    },
    async ({ output_path }) => {
      const sample = [{
        "Academic Year":      "2026-27",
        "Regulation":         "NEP2020",
        "Program":            "B.Com",
        "Program Code":       "BCOM",
        "Type":               "Major",
        "Subject":            "Commerce",
        "Semester":           "1",
        "Course":             "Financial Accounting",
        "Course Code":        "BCOM101",
        "Faculty Name":       "Dr. Ravi Kumar",
        "Faculty Email":      "ravi.kumar@college.edu",
        "Faculty Department": "Commerce",
        "Status":             "Active"
      }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sample), "Workload Assignment");
      XLSX.writeFile(wb, output_path);
      return text({
        success: true, path: output_path,
        columns: Object.keys(sample[0]),
        required_columns: ["Academic Year","Regulation","Program","Program Code","Type","Subject","Semester","Course","Course Code","Faculty Name","Faculty Email"],
        note: "Fill from row 2. All columns marked required must have values in every row."
      });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // REPORT TOOLS
  // ════════════════════════════════════════════════════════════════════════════

  // ── report_workload_by_faculty ────────────────────────────────────────────
  server.tool(
    "report_workload_by_faculty",
    "Faculty-wise workload report: lists each faculty member with all their assigned courses grouped together. Mirrors the print-ready report on the WorkloadDynamicReportPage.",
    {
      academicyear:      z.string().optional().describe("Filter by academic year e.g. 2026-27"),
      regulation:        z.string().optional().describe("Filter by regulation"),
      programcode:       z.string().optional().describe("Filter by program code"),
      type:              z.string().optional().describe("Filter by type: Major / Minor / AEC / SEC / VAC / IDC"),
      subject:           z.string().optional().describe("Filter by subject"),
      semester:          z.string().optional().describe("Filter by semester"),
      facultydepartment: z.string().optional().describe("Filter by faculty department"),
      status:            z.enum(["Active","Inactive"]).optional().describe("Status filter")
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid  = resolveColid(undefined);
      const filter = { colid };
      for (const f of ["academicyear","regulation","programcode","type","subject","semester","status"]) {
        if (args[f]) filter[f] = args[f];
      }
      if (args.facultydepartment) filter.facultydepartment = args.facultydepartment;

      const data = await WorkloadAssignment.find(filter)
        .sort({ facultyname: 1, academicyear: 1, regulation: 1, programcode: 1, subject: 1, semester: 1, course: 1 })
        .lean();

      // Group by faculty
      const facultyMap = new Map();
      for (const row of data) {
        const key = (row.facultyemail || row.facultyname || "Unassigned").toLowerCase();
        if (!facultyMap.has(key)) {
          facultyMap.set(key, {
            facultyname:       row.facultyname || "Unassigned",
            facultyemail:      row.facultyemail || "",
            facultydepartment: row.facultydepartment || "",
            course_count:      0,
            courses:           []
          });
        }
        const entry = facultyMap.get(key);
        entry.course_count++;
        entry.courses.push({
          academicyear: row.academicyear, regulation: row.regulation,
          programcode:  row.programcode,  program: row.program,
          type:         row.type,         subject:  row.subject,
          semester:     row.semester,     course:   row.course,
          coursecode:   row.coursecode,   status:   row.status,
          id:           String(row._id)
        });
      }

      const facultyList = [...facultyMap.values()].sort((a, b) => a.facultyname.localeCompare(b.facultyname));
      const summary = {
        total_assignments: data.length,
        total_faculty:     facultyList.length,
        total_departments: uniq(data.map(r => r.facultydepartment)).length
      };
      return text({ success: true, colid, filters: args, summary, faculty: facultyList });
    }
  );

  // ── report_workload_by_department ─────────────────────────────────────────
  server.tool(
    "report_workload_by_department",
    "Department-wise workload summary: total courses and faculty count per department.",
    {
      academicyear: z.string().optional().describe("Filter by academic year e.g. 2026-27"),
      regulation:   z.string().optional().describe("Filter by regulation"),
      status:       z.enum(["Active","Inactive"]).optional()
    },
    async ({ academicyear, regulation, status }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const match = { colid };
      if (academicyear) match.academicyear = academicyear;
      if (regulation)   match.regulation   = regulation;
      if (status)       match.status       = status;

      const rows = await WorkloadAssignment.aggregate([
        { $match: match },
        { $group: {
          _id:          "$facultydepartment",
          course_count: { $sum: 1 },
          faculty:      { $addToSet: "$facultyemail" },
          programs:     { $addToSet: "$programcode" }
        }},
        { $project: {
          _id: 0,
          department:    "$_id",
          course_count:  1,
          faculty_count: { $size: "$faculty" },
          program_count: { $size: "$programs" },
          faculty:       1
        }},
        { $sort: { department: 1 } }
      ]);

      const total = rows.reduce((s, r) => s + r.course_count, 0);
      return text({ success: true, colid, academicyear, regulation, grand_total_courses: total, departments: rows });
    }
  );

  // ── report_workload_by_program ────────────────────────────────────────────
  server.tool(
    "report_workload_by_program",
    "Program-wise workload summary: count of assigned courses and faculty per program.",
    {
      academicyear:      z.string().optional().describe("Filter by academic year e.g. 2026-27"),
      regulation:        z.string().optional().describe("Filter by regulation"),
      facultydepartment: z.string().optional().describe("Filter by faculty department"),
      status:            z.enum(["Active","Inactive"]).optional()
    },
    async ({ academicyear, regulation, facultydepartment, status }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const match = { colid };
      if (academicyear)      match.academicyear      = academicyear;
      if (regulation)        match.regulation        = regulation;
      if (facultydepartment) match.facultydepartment = facultydepartment;
      if (status)            match.status            = status;

      const rows = await WorkloadAssignment.aggregate([
        { $match: match },
        { $group: {
          _id:          { programcode: "$programcode", program: "$program" },
          course_count: { $sum: 1 },
          faculty:      { $addToSet: "$facultyemail" },
          semesters:    { $addToSet: "$semester" },
          types:        { $addToSet: "$type" }
        }},
        { $project: {
          _id:           0,
          programcode:   "$_id.programcode",
          program:       "$_id.program",
          course_count:  1,
          faculty_count: { $size: "$faculty" },
          semesters:     1,
          types:         1
        }},
        { $sort: { programcode: 1 } }
      ]);

      return text({ success: true, colid, academicyear, regulation, programs: rows });
    }
  );

  // ── report_workload_by_semester ───────────────────────────────────────────
  server.tool(
    "report_workload_by_semester",
    "Semester-wise workload report: count of courses and faculty per semester, optionally scoped to a program.",
    {
      academicyear: z.string().optional().describe("Filter by academic year e.g. 2026-27"),
      regulation:   z.string().optional().describe("Filter by regulation"),
      programcode:  z.string().optional().describe("Filter by program code"),
      type:         z.string().optional().describe("Filter by type: Major / Minor / AEC / SEC / VAC / IDC"),
      status:       z.enum(["Active","Inactive"]).optional()
    },
    async ({ academicyear, regulation, programcode, type, status }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const match = { colid };
      if (academicyear) match.academicyear = academicyear;
      if (regulation)   match.regulation   = regulation;
      if (programcode)  match.programcode  = programcode;
      if (type)         match.type         = type;
      if (status)       match.status       = status;

      const rows = await WorkloadAssignment.aggregate([
        { $match: match },
        { $group: {
          _id:          "$semester",
          course_count: { $sum: 1 },
          faculty:      { $addToSet: "$facultyemail" },
          courses:      { $addToSet: { coursecode: "$coursecode", course: "$course" } }
        }},
        { $project: {
          _id:           0,
          semester:      "$_id",
          course_count:  1,
          faculty_count: { $size: "$faculty" },
          courses:       1
        }},
        { $sort: { semester: 1 } }
      ]);

      return text({ success: true, colid, academicyear, regulation, programcode, type, semesters: rows });
    }
  );

  // ── report_workload_summary ───────────────────────────────────────────────
  server.tool(
    "report_workload_summary",
    "Overall workload dashboard: total assignments, unique faculty, departments, programs, courses, and a breakdown by type (Major/Minor/AEC etc.).",
    {
      academicyear: z.string().optional().describe("Scope to this academic year e.g. 2026-27"),
      regulation:   z.string().optional().describe("Scope to this regulation")
    },
    async ({ academicyear, regulation }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const match = { colid };
      if (academicyear) match.academicyear = academicyear;
      if (regulation)   match.regulation   = regulation;

      const [total, byType, byAcademicYear] = await Promise.all([
        WorkloadAssignment.countDocuments(match),
        WorkloadAssignment.aggregate([
          { $match: match },
          { $group: {
            _id:          "$type",
            course_count: { $sum: 1 },
            faculty:      { $addToSet: "$facultyemail" }
          }},
          { $project: { _id: 0, type: "$_id", course_count: 1, faculty_count: { $size: "$faculty" } } },
          { $sort: { course_count: -1 } }
        ]),
        WorkloadAssignment.aggregate([
          { $match: { colid } },         // no year/reg filter — show all years
          { $group: {
            _id:          "$academicyear",
            course_count: { $sum: 1 },
            faculty:      { $addToSet: "$facultyemail" }
          }},
          { $project: { _id: 0, academicyear: "$_id", course_count: 1, faculty_count: { $size: "$faculty" } } },
          { $sort: { academicyear: -1 } }
        ])
      ]);

      // Unique counts via distinct
      const [faculty, departments, programs, courses] = await Promise.all([
        WorkloadAssignment.distinct("facultyemail",      match),
        WorkloadAssignment.distinct("facultydepartment", match),
        WorkloadAssignment.distinct("programcode",       match),
        WorkloadAssignment.distinct("coursecode",        match)
      ]);

      return text({
        success: true, colid, academicyear, regulation,
        summary: {
          total_assignments:   total,
          unique_faculty:      faculty.filter(Boolean).length,
          unique_departments:  departments.filter(Boolean).length,
          unique_programs:     programs.filter(Boolean).length,
          unique_courses:      courses.filter(Boolean).length
        },
        by_type:          byType,
        by_academic_year: byAcademicYear
      });
    }
  );

  // ── report_workload_unassigned_courses ────────────────────────────────────
  server.tool(
    "report_workload_unassigned_courses",
    "Find courses from the course map that have NOT been assigned to any faculty yet. Useful to spot gaps in the workload assignment.",
    {
      academicyear: z.string().min(1).describe("Academic year e.g. 2026-27 (required for this report)"),
      regulation:   z.string().optional().describe("Filter by regulation"),
      programcode:  z.string().optional().describe("Filter by program code"),
      type:         z.string().optional().describe("Filter by type: Major / Minor / AEC / SEC / VAC / IDC"),
      semester:     z.string().optional().describe("Filter by semester")
    },
    async ({ academicyear, regulation, programcode, type, semester }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);

      const courseQuery = { colid, academicyear };
      if (regulation)  courseQuery.regulation  = regulation;
      if (programcode) courseQuery.programcode = programcode;
      if (type)        courseQuery.type        = type;
      if (semester)    courseQuery.semester    = semester;

      const [allCourses, assignedCoursecodes] = await Promise.all([
        RegulationCourseMap.find(courseQuery).lean(),
        WorkloadAssignment.distinct("coursecode", { colid, academicyear })
      ]);

      const assignedSet = new Set(assignedCoursecodes);
      const unassigned  = allCourses.filter(c => !assignedSet.has(c.coursecode));

      return text({
        success: true, colid, academicyear, regulation, programcode, type,
        total_mapped:     allCourses.length,
        total_assigned:   allCourses.length - unassigned.length,
        total_unassigned: unassigned.length,
        unassigned_courses: unassigned.map(c => ({
          academicyear: c.academicyear, regulation: c.regulation, program: c.program,
          programcode:  c.programcode,  type: c.type, subject: c.subject,
          semester:     c.semester,     course: c.course, coursecode: c.coursecode
        }))
      });
    }
  );
}
