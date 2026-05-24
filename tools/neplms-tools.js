/**
 * NEP-LMS Course Workspace Tools
 *
 * Covers all tabs of NepLmsCourseWorkspacePage and related pages:
 *   • Resources  — Lesson Plans, Assignments, Course Material  (neplmsresourceds)
 *   • Timetable  — Class diary entries                         (neplmstimetableds)
 *   • Submissions — Assignment submissions + grading           (neplmsassignmentsubmissionds)
 *   • Quiz       — MCQ quizzes, sections, questions            (neplmsquizds)
 *   • Quiz Attempts                                            (neplmsquizattemptds)
 *   • Attendance                                               (NepLmsAttendance)
 *   • Remedial   — Remedial content assignments               (neplmsremedialds)
 *   • Assessment Marks                                         (neplmsassessmentmarksds)
 *   • Component Marks                                          (neplmscomponentmarksds)
 *   • CO Attainment                                            (neplmscoattainmentds)
 *   • Final Marks                                              (neplmsfinalmarksds)
 *   • Reports (cross-cutting)
 */

import { z } from "zod";
import mongoose from "mongoose";
import * as XLSX from "xlsx";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const nepLmsResourceSchema = new mongoose.Schema(
  {
    resourcetype: { type: String, trim: true, required: true },
    academicyear: { type: String, trim: true },
    regulation: { type: String, trim: true },
    program: { type: String, trim: true },
    programcode: { type: String, trim: true },
    type: { type: String, trim: true },
    major: { type: String, trim: true },
    semester: { type: String, trim: true },
    course: { type: String, trim: true },
    coursecode: { type: String, trim: true },
    faculty: { type: String, trim: true },
    facultyemail: { type: String, trim: true },
    title: { type: String, trim: true },
    module: { type: String, trim: true },
    topic: { type: String, trim: true },
    description: { type: String, trim: true },
    duedate: { type: String, trim: true },
    fullmarks: { type: Number, default: 0 },
    filename: { type: String, trim: true },
    originalname: { type: String, trim: true },
    url: { type: String, trim: true },
    status: { type: String, trim: true, default: "Active" },
    colid: { type: Number, required: true, index: true },
    user: { type: String, trim: true }
  },
  { timestamps: true }
);

const nepLmsTimetableSchema = new mongoose.Schema(
  {
    academicyear: { type: String, trim: true },
    regulation: { type: String, trim: true },
    program: { type: String, trim: true },
    programcode: { type: String, trim: true },
    faculty: { type: String, trim: true },
    facultyemail: { type: String, trim: true },
    major: { type: String, trim: true },
    semester: { type: String, trim: true },
    course: { type: String, trim: true },
    coursecode: { type: String, trim: true },
    classdate: { type: String, trim: true },
    classtime: { type: String, trim: true },
    period: { type: String, trim: true },
    durationminutes: { type: Number, default: 0 },
    module: { type: String, trim: true },
    topic: { type: String, trim: true },
    workcompleted: { type: String, trim: true, default: "" },
    status: { type: String, trim: true, default: "Active" },
    colid: { type: Number, required: true, index: true },
    user: { type: String, trim: true }
  },
  { timestamps: true }
);

const nepLmsAssignmentSubmissionSchema = new mongoose.Schema(
  {
    assignmentid: { type: mongoose.Schema.Types.ObjectId },
    academicyear: { type: String, trim: true },
    regulation: { type: String, trim: true },
    program: { type: String, trim: true },
    programcode: { type: String, trim: true },
    type: { type: String, trim: true },
    major: { type: String, trim: true },
    semester: { type: String, trim: true },
    course: { type: String, trim: true },
    coursecode: { type: String, trim: true },
    assignmenttitle: { type: String, trim: true },
    student: { type: String, trim: true },
    regno: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    comments: { type: String, trim: true },
    fullmarks: { type: Number, default: 0 },
    marks: { type: Number, default: 0 },
    facultycomments: { type: String, trim: true },
    gradedby: { type: String, trim: true },
    gradeddate: { type: Date },
    submitteddate: { type: Date, default: Date.now },
    originalname: { type: String, trim: true },
    url: { type: String, trim: true },
    status: { type: String, trim: true, default: "Submitted" },
    colid: { type: Number, required: true, index: true },
    user: { type: String, trim: true }
  },
  { timestamps: true }
);

const optionSchema = new mongoose.Schema({ text: { type: String, trim: true }, iscorrect: { type: Boolean, default: false } }, { _id: false });
const questionSchema = new mongoose.Schema({ question: { type: String, trim: true }, options: [optionSchema], score: { type: Number, default: 1 } }, { timestamps: true });
const sectionSchema = new mongoose.Schema({ title: { type: String, trim: true }, questions: [questionSchema] }, { timestamps: true });

const nepLmsQuizSchema = new mongoose.Schema(
  {
    academicyear: { type: String, trim: true },
    regulation: { type: String, trim: true },
    program: { type: String, trim: true },
    programcode: { type: String, trim: true },
    type: { type: String, trim: true },
    major: { type: String, trim: true },
    semester: { type: String, trim: true },
    course: { type: String, trim: true },
    coursecode: { type: String, trim: true },
    faculty: { type: String, trim: true },
    facultyemail: { type: String, trim: true },
    title: { type: String, trim: true, required: true },
    module: { type: String, trim: true },
    topic: { type: String, trim: true },
    startdatetime: { type: Date, required: true },
    enddatetime: { type: Date, required: true },
    sections: [sectionSchema],
    status: { type: String, trim: true, default: "Active" },
    colid: { type: Number, required: true, index: true },
    user: { type: String, trim: true }
  },
  { timestamps: true }
);

const answerSchema = new mongoose.Schema(
  { questionid: { type: String, trim: true }, selectedoptions: [{ type: String, trim: true }], score: { type: Number, default: 0 }, maxscore: { type: Number, default: 0 } },
  { _id: false }
);

const nepLmsQuizAttemptSchema = new mongoose.Schema(
  {
    quizid: { type: mongoose.Schema.Types.ObjectId },
    quiztitle: { type: String, trim: true },
    academicyear: { type: String, trim: true },
    regulation: { type: String, trim: true },
    program: { type: String, trim: true },
    programcode: { type: String, trim: true },
    type: { type: String, trim: true },
    major: { type: String, trim: true },
    semester: { type: String, trim: true },
    course: { type: String, trim: true },
    coursecode: { type: String, trim: true },
    faculty: { type: String, trim: true },
    facultyemail: { type: String, trim: true },
    student: { type: String, trim: true },
    regno: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    answers: [answerSchema],
    totalmarks: { type: Number, default: 0 },
    obtainedmarks: { type: Number, default: 0 },
    submitteddate: { type: Date, default: Date.now },
    status: { type: String, trim: true, default: "Submitted" },
    colid: { type: Number, required: true, index: true },
    user: { type: String, trim: true }
  },
  { timestamps: true }
);

const nepLmsAttendanceSchema = new mongoose.Schema(
  {
    classid: { type: mongoose.Schema.Types.ObjectId },
    studentid: { type: mongoose.Schema.Types.ObjectId },
    student: { type: String },
    studentemail: { type: String },
    studentphone: { type: String },
    regno: { type: String },
    program: { type: String },
    programcode: { type: String },
    academicyear: { type: String },
    semester: { type: String },
    major: { type: String },
    faculty: { type: String },
    facultyemail: { type: String },
    course: { type: String },
    coursecode: { type: String },
    classdate: { type: String },
    classtime: { type: String },
    attendance: { type: Number, enum: [0, 1], default: 1 },
    type: { type: String, default: "Regular" },
    comments: { type: String },
    colid: { type: Number, required: true },
    user: { type: String }
  },
  { timestamps: true }
);

const nepLmsRemedialSchema = new mongoose.Schema(
  {
    assessmentid: { type: String, trim: true },
    assessmenttitle: { type: String, trim: true },
    questionid: { type: String, trim: true },
    question: { type: String, trim: true },
    academicyear: { type: String, trim: true },
    regulation: { type: String, trim: true },
    program: { type: String, trim: true },
    programcode: { type: String, trim: true },
    course: { type: String, trim: true },
    coursecode: { type: String, trim: true },
    topic: { type: String, trim: true },
    student: { type: String, trim: true },
    regno: { type: String, trim: true },
    contenttype: { type: String, trim: true, default: "Video" },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    link: { type: String, trim: true },
    provider: { type: String, trim: true },
    marks: { type: Number, default: 0 },
    maxmarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    status: { type: String, trim: true, default: "Active" },
    colid: { type: Number, required: true, index: true },
    user: { type: String, trim: true }
  },
  { timestamps: true }
);

const nepLmsAssessmentMarksSchema = new mongoose.Schema(
  {
    academicyear: { type: String, trim: true, required: true },
    regulation: { type: String, trim: true },
    program: { type: String, trim: true },
    programcode: { type: String, trim: true },
    type: { type: String, trim: true },
    subject: { type: String, trim: true },
    semester: { type: String, trim: true, required: true },
    course: { type: String, trim: true },
    coursecode: { type: String, trim: true, required: true },
    assessmentcomponent: { type: String, trim: true, required: true },
    assessmentgroup: { type: String, trim: true },
    grouptype: { type: String, trim: true },
    scoretype: { type: String, trim: true },
    totalmarks: { type: Number, default: 0 },
    weightage: { type: Number, default: 0 },
    marksobtained: { type: Number, default: 0 },
    effectivemarks: { type: Number, default: 0 },
    student: { type: String, trim: true },
    regno: { type: String, trim: true, required: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    faculty: { type: String, trim: true },
    facultyemail: { type: String, trim: true },
    status: { type: String, trim: true, default: "Added" },
    colid: { type: Number, required: true, index: true },
    user: { type: String, trim: true }
  },
  { timestamps: true }
);

const nepLmsComponentMarksSchema = new mongoose.Schema(
  {
    academicyear: { type: String, trim: true, required: true },
    semester: { type: String, trim: true, required: true },
    programcode: { type: String, trim: true },
    course: { type: String, trim: true },
    coursecode: { type: String, trim: true, required: true },
    major: { type: String, trim: true },
    subject: { type: String, trim: true },
    student: { type: String, trim: true },
    regno: { type: String, trim: true, required: true },
    assessmentgroup: { type: String, trim: true, required: true },
    grouptype: { type: String, trim: true },
    scoretype: { type: String, trim: true },
    marks: { type: Number, default: 0 },
    passmarks: { type: Number, default: 0 },
    credits: { type: Number, default: 0 },
    passstatus: { type: String, enum: ["Pass", "Fail"], default: "Fail" },
    colid: { type: Number, required: true, index: true },
    user: { type: String, trim: true }
  },
  { timestamps: true }
);

const levelCriterionSchema2 = new mongoose.Schema(
  { level: { type: String, trim: true }, fromvalue: { type: Number, default: 0 }, tovalue: { type: Number, default: 0 } },
  { _id: false }
);

const nepLmsCoAttainmentSchema = new mongoose.Schema(
  {
    assessmentid: { type: mongoose.Schema.Types.ObjectId },
    assessmenttitle: { type: String, trim: true },
    academicyear: { type: String, trim: true },
    regulation: { type: String, trim: true },
    program: { type: String, trim: true },
    programcode: { type: String, trim: true },
    course: { type: String, trim: true },
    coursecode: { type: String, trim: true },
    semester: { type: String, trim: true },
    co: { type: String, trim: true },
    conumber: { type: String, trim: true },
    level: { type: String, trim: true },
    threshold: { type: Number, default: 0 },
    attainmentpercentage: { type: Number, default: 0 },
    studentsabove: { type: Number, default: 0 },
    totalstudents: { type: Number, default: 0 },
    levelcriteria: [levelCriterionSchema2],
    facultyname: { type: String, trim: true },
    facultyemail: { type: String, trim: true },
    colid: { type: Number, required: true, index: true },
    user: { type: String, trim: true }
  },
  { timestamps: true }
);

const nepLmsFinalMarksSchema = new mongoose.Schema(
  {
    academicyear: { type: String, trim: true, required: true },
    semester: { type: String, trim: true, required: true },
    program: { type: String, trim: true },
    programcode: { type: String, trim: true },
    regulation: { type: String, trim: true },
    course: { type: String, trim: true },
    coursecode: { type: String, trim: true, required: true },
    major: { type: String, trim: true },
    subject: { type: String, trim: true },
    student: { type: String, trim: true },
    regno: { type: String, trim: true, required: true },
    internalmarks: { type: Number, default: 0 },
    externalmarks: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    grade: { type: String, trim: true },
    gradepoint: { type: Number, default: 0 },
    credits: { type: Number, default: 0 },
    gpa: { type: Number, default: 0 },
    passstatus: { type: String, enum: ["Pass", "Fail"], default: "Fail" },
    attempt: { type: Number, default: 1 },
    failmode: { type: String, trim: true },
    grademode: { type: String, trim: true },
    colid: { type: Number, required: true, index: true },
    user: { type: String, trim: true }
  },
  { timestamps: true }
);

// ─── Models (with guard) ──────────────────────────────────────────────────────
export const NepLmsResource          = mongoose.models.neplmsresourceds              || mongoose.model("neplmsresourceds",              nepLmsResourceSchema);
export const NepLmsTimetable         = mongoose.models.neplmstimetableds             || mongoose.model("neplmstimetableds",             nepLmsTimetableSchema);
export const NepLmsSubmission        = mongoose.models.neplmsassignmentsubmissionds  || mongoose.model("neplmsassignmentsubmissionds",  nepLmsAssignmentSubmissionSchema);
export const NepLmsQuiz              = mongoose.models.neplmsquizds                  || mongoose.model("neplmsquizds",                  nepLmsQuizSchema);
export const NepLmsQuizAttempt       = mongoose.models.neplmsquizattemptds           || mongoose.model("neplmsquizattemptds",           nepLmsQuizAttemptSchema);
export const NepLmsAttendance        = mongoose.models.NepLmsAttendance              || mongoose.model("NepLmsAttendance",              nepLmsAttendanceSchema);
export const NepLmsRemedial          = mongoose.models.neplmsremedialds              || mongoose.model("neplmsremedialds",              nepLmsRemedialSchema);
export const NepLmsAssessmentMarks   = mongoose.models.neplmsassessmentmarksds       || mongoose.model("neplmsassessmentmarksds",       nepLmsAssessmentMarksSchema);
export const NepLmsComponentMarks    = mongoose.models.neplmscomponentmarksds        || mongoose.model("neplmscomponentmarksds",        nepLmsComponentMarksSchema);
export const NepLmsCoAttainment      = mongoose.models.neplmscoattainmentds          || mongoose.model("neplmscoattainmentds",          nepLmsCoAttainmentSchema);
export const NepLmsFinalMarks        = mongoose.models.neplmsfinalmarksds            || mongoose.model("neplmsfinalmarksds",            nepLmsFinalMarksSchema);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const normalizeHeader = (v) => String(v || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");

function applyFilters(query, filters = {}) {
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      query[key] = { $regex: String(value).trim(), $options: "i" };
    }
  }
  return query;
}

function parseLmsDate(v) {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

// ─── Registrar ───────────────────────────────────────────────────────────────
export function registerNepLmsTools(server, { requireAuth, resolveColid, resolveUser, connectDB }) {

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1 — RESOURCES (Lesson Plan / Assignment / Course Material)
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_lms_resources",
    "List LMS resources (Assignments, Lesson Plans, Course Material) with optional filters.",
    {
      resourcetype: z.string().optional().describe("Filter: Assignment | Lesson Plan | Course Material"),
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      facultyemail: z.string().optional(),
      module: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().int().min(1).max(500).default(100).optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { resourcetype, limit = 100, ...rest } = args;
      const query = applyFilters({ colid }, rest);
      if (resourcetype) query.resourcetype = resourcetype;
      const docs = await NepLmsResource.find(query).sort({ createdAt: -1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "add_lms_resource",
    "Add a Lesson Plan, Assignment, or Course Material entry (metadata only — no file upload).",
    {
      resourcetype: z.enum(["Assignment", "Lesson Plan", "Course Material"]).describe("Type of resource"),
      academicyear: z.string().min(1),
      regulation: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      type: z.string().optional(),
      major: z.string().optional(),
      semester: z.string().min(1),
      course: z.string().optional(),
      coursecode: z.string().min(1),
      faculty: z.string().optional(),
      facultyemail: z.string().optional(),
      title: z.string().min(1),
      module: z.string().optional(),
      topic: z.string().optional(),
      description: z.string().optional(),
      duedate: z.string().optional().describe("YYYY-MM-DD — required for Assignment"),
      fullmarks: z.number().optional().describe("Required for Assignment"),
      url: z.string().optional().describe("External URL / file link if applicable")
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const user = resolveUser();
      const doc = await NepLmsResource.create({ ...args, colid, user });
      return { content: [{ type: "text", text: `Resource created: ${doc._id}` }] };
    }
  );

  server.tool(
    "update_lms_resource",
    "Update an existing LMS resource by ID.",
    {
      id: z.string().min(1),
      title: z.string().optional(),
      module: z.string().optional(),
      topic: z.string().optional(),
      description: z.string().optional(),
      duedate: z.string().optional(),
      fullmarks: z.number().optional(),
      status: z.string().optional(),
      url: z.string().optional()
    },
    async ({ id, ...rest }) => {
      requireAuth();
      await connectDB();
      const updates = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
      const doc = await NepLmsResource.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
      if (!doc) return { content: [{ type: "text", text: "Resource not found" }] };
      return { content: [{ type: "text", text: `Resource updated: ${doc._id}` }] };
    }
  );

  server.tool(
    "delete_lms_resource",
    "Delete an LMS resource by ID.",
    { id: z.string().min(1) },
    async ({ id }) => {
      requireAuth();
      await connectDB();
      await NepLmsResource.findByIdAndDelete(id);
      return { content: [{ type: "text", text: `Resource deleted: ${id}` }] };
    }
  );

  server.tool(
    "bulk_upload_lms_resources_from_json",
    "Bulk upload LMS resources (Assignments, Lesson Plans, Course Materials) from a JSON array.",
    {
      records: z.array(z.object({
        resourcetype: z.string(),
        academicyear: z.string(),
        semester: z.string(),
        coursecode: z.string(),
        title: z.string(),
        module: z.string().optional(),
        topic: z.string().optional(),
        description: z.string().optional(),
        duedate: z.string().optional(),
        fullmarks: z.number().optional(),
        facultyemail: z.string().optional(),
        url: z.string().optional()
      })).min(1).max(500)
    },
    async ({ records }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const user = resolveUser();
      const docs = records.map((r) => ({ ...r, colid, user }));
      const result = await NepLmsResource.insertMany(docs, { ordered: false });
      return { content: [{ type: "text", text: `Inserted ${result.length} of ${records.length} resources.` }] };
    }
  );

  server.tool(
    "bulk_upload_lms_resources_from_excel",
    "Bulk upload LMS resources from an Excel file (.xlsx). Columns: Resource Type, Academic Year, Semester, Course Code, Title, Module, Topic, Description, Due Date, Full Marks, Faculty Email, URL.",
    { file_path: z.string().min(1).describe("Absolute path to the .xlsx file") },
    async ({ file_path }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const user = resolveUser();
      const wb = XLSX.readFile(file_path);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const aliasMap = {
        resourcetype: ["resourcetype", "resource type", "type"],
        academicyear: ["academicyear", "academic year", "year"],
        regulation: ["regulation"],
        program: ["program", "programme"],
        programcode: ["programcode", "program code", "programme code"],
        semester: ["semester", "sem"],
        course: ["course"],
        coursecode: ["coursecode", "course code"],
        faculty: ["faculty", "faculty name"],
        facultyemail: ["facultyemail", "faculty email", "email"],
        title: ["title"],
        module: ["module"],
        topic: ["topic"],
        description: ["description", "desc"],
        duedate: ["duedate", "due date"],
        fullmarks: ["fullmarks", "full marks", "marks"],
        url: ["url", "link"]
      };
      const numFields = new Set(["fullmarks"]);
      const errors = [];
      const docs = [];
      raw.forEach((row, idx) => {
        const normalized = {};
        for (const [k, v] of Object.entries(row)) normalized[normalizeHeader(k)] = v;
        const mapped = {};
        for (const [field, aliases] of Object.entries(aliasMap)) {
          for (const alias of aliases) {
            const key = normalizeHeader(alias);
            if (normalized[key] !== undefined) { mapped[field] = normalized[key]; break; }
          }
        }
        if (!mapped.resourcetype) { errors.push(`Row ${idx + 2}: resourcetype missing`); return; }
        if (!mapped.academicyear) { errors.push(`Row ${idx + 2}: academicyear missing`); return; }
        if (!mapped.semester) { errors.push(`Row ${idx + 2}: semester missing`); return; }
        if (!mapped.coursecode) { errors.push(`Row ${idx + 2}: coursecode missing`); return; }
        if (!mapped.title) { errors.push(`Row ${idx + 2}: title missing`); return; }
        for (const f of numFields) if (mapped[f] !== undefined) mapped[f] = Number(mapped[f]) || 0;
        docs.push({ ...mapped, colid, user });
      });
      if (!docs.length) return { content: [{ type: "text", text: `No valid rows found.\n${errors.join("\n")}` }] };
      const result = await NepLmsResource.insertMany(docs, { ordered: false });
      return { content: [{ type: "text", text: `Inserted ${result.length} of ${raw.length} rows.\n${errors.join("\n")}` }] };
    }
  );

  server.tool(
    "get_excel_template_lms_resources",
    "Download an Excel template for bulk-uploading LMS resources.",
    { file_path: z.string().min(1).describe("Where to save the .xlsx template") },
    async ({ file_path }) => {
      const ws = XLSX.utils.aoa_to_sheet([
        ["Resource Type", "Academic Year", "Regulation", "Program", "Program Code", "Semester", "Course", "Course Code", "Faculty", "Faculty Email", "Title", "Module", "Topic", "Description", "Due Date", "Full Marks", "URL"],
        ["Assignment", "2026-27", "NEP2020", "B.Sc Computer Science", "BSCS", "I", "Data Structures", "CS101", "Dr. Smith", "smith@college.edu", "Unit 1 Assignment", "Module 1", "Arrays", "Solve array problems", "2026-09-10", 20, ""]
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Resources");
      XLSX.writeFile(wb, file_path);
      return { content: [{ type: "text", text: `Template saved: ${file_path}` }] };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2 — TIMETABLE (Class Diary)
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_lms_timetable",
    "List class diary entries (timetable) with optional filters.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      facultyemail: z.string().optional(),
      classdate: z.string().optional().describe("Filter by exact date YYYY-MM-DD"),
      from_date: z.string().optional().describe("Filter from date YYYY-MM-DD"),
      to_date: z.string().optional().describe("Filter to date YYYY-MM-DD"),
      module: z.string().optional(),
      limit: z.number().int().min(1).max(1000).default(200).optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { from_date, to_date, classdate, limit = 200, ...rest } = args;
      const query = applyFilters({ colid }, rest);
      if (classdate) query.classdate = classdate;
      else if (from_date || to_date) {
        query.classdate = {};
        if (from_date) query.classdate.$gte = from_date;
        if (to_date) query.classdate.$lte = to_date;
      }
      const docs = await NepLmsTimetable.find(query).sort({ classdate: -1, classtime: 1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "add_lms_class",
    "Add a class entry to the course timetable / diary.",
    {
      academicyear: z.string().min(1),
      regulation: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      faculty: z.string().optional(),
      facultyemail: z.string().optional(),
      major: z.string().optional(),
      semester: z.string().min(1),
      course: z.string().optional(),
      coursecode: z.string().min(1),
      classdate: z.string().min(1).describe("YYYY-MM-DD"),
      classtime: z.string().optional().describe("HH:MM"),
      period: z.string().optional(),
      durationminutes: z.number().optional(),
      module: z.string().optional(),
      topic: z.string().optional(),
      workcompleted: z.string().optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const user = resolveUser();
      const doc = await NepLmsTimetable.create({ ...args, colid, user });
      return { content: [{ type: "text", text: `Class added: ${doc._id}` }] };
    }
  );

  server.tool(
    "update_lms_class",
    "Update an existing class entry by ID.",
    {
      id: z.string().min(1),
      classdate: z.string().optional(),
      classtime: z.string().optional(),
      period: z.string().optional(),
      durationminutes: z.number().optional(),
      module: z.string().optional(),
      topic: z.string().optional(),
      workcompleted: z.string().optional(),
      status: z.string().optional()
    },
    async ({ id, ...rest }) => {
      requireAuth();
      await connectDB();
      const updates = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
      const doc = await NepLmsTimetable.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
      if (!doc) return { content: [{ type: "text", text: "Class not found" }] };
      return { content: [{ type: "text", text: `Class updated: ${doc._id}` }] };
    }
  );

  server.tool(
    "delete_lms_class",
    "Delete a class entry by ID.",
    { id: z.string().min(1) },
    async ({ id }) => {
      requireAuth();
      await connectDB();
      await NepLmsTimetable.findByIdAndDelete(id);
      return { content: [{ type: "text", text: `Class deleted: ${id}` }] };
    }
  );

  server.tool(
    "bulk_upload_lms_timetable_from_json",
    "Bulk upload class diary entries from a JSON array.",
    {
      records: z.array(z.object({
        academicyear: z.string(),
        semester: z.string(),
        coursecode: z.string(),
        classdate: z.string(),
        classtime: z.string().optional(),
        period: z.string().optional(),
        durationminutes: z.number().optional(),
        module: z.string().optional(),
        topic: z.string().optional(),
        workcompleted: z.string().optional(),
        facultyemail: z.string().optional()
      })).min(1).max(1000)
    },
    async ({ records }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const user = resolveUser();
      const docs = records.map((r) => ({ ...r, colid, user }));
      const result = await NepLmsTimetable.insertMany(docs, { ordered: false });
      return { content: [{ type: "text", text: `Inserted ${result.length} of ${records.length} class entries.` }] };
    }
  );

  server.tool(
    "bulk_upload_lms_timetable_from_excel",
    "Bulk upload class diary entries from an Excel file. Columns: Academic Year, Semester, Course Code, Class Date, Class Time, Period, Duration Minutes, Module, Topic, Work Completed, Faculty Email.",
    { file_path: z.string().min(1) },
    async ({ file_path }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const user = resolveUser();
      const wb = XLSX.readFile(file_path);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const aliasMap = {
        academicyear: ["academicyear", "academic year", "year"],
        regulation: ["regulation"],
        program: ["program"],
        programcode: ["programcode", "program code"],
        faculty: ["faculty", "faculty name"],
        facultyemail: ["facultyemail", "faculty email"],
        major: ["major", "subject"],
        semester: ["semester", "sem"],
        course: ["course"],
        coursecode: ["coursecode", "course code"],
        classdate: ["classdate", "class date", "date"],
        classtime: ["classtime", "class time", "time"],
        period: ["period"],
        durationminutes: ["durationminutes", "duration minutes", "duration"],
        module: ["module"],
        topic: ["topic"],
        workcompleted: ["workcompleted", "work completed", "work done"]
      };
      const numFields = new Set(["durationminutes"]);
      const errors = [];
      const docs = [];
      raw.forEach((row, idx) => {
        const normalized = {};
        for (const [k, v] of Object.entries(row)) normalized[normalizeHeader(k)] = v;
        const mapped = {};
        for (const [field, aliases] of Object.entries(aliasMap)) {
          for (const alias of aliases) {
            const key = normalizeHeader(alias);
            if (normalized[key] !== undefined) { mapped[field] = normalized[key]; break; }
          }
        }
        if (!mapped.academicyear) { errors.push(`Row ${idx + 2}: academicyear missing`); return; }
        if (!mapped.semester) { errors.push(`Row ${idx + 2}: semester missing`); return; }
        if (!mapped.coursecode) { errors.push(`Row ${idx + 2}: coursecode missing`); return; }
        if (!mapped.classdate) { errors.push(`Row ${idx + 2}: classdate missing`); return; }
        for (const f of numFields) if (mapped[f] !== undefined) mapped[f] = Number(mapped[f]) || 0;
        docs.push({ ...mapped, colid, user });
      });
      if (!docs.length) return { content: [{ type: "text", text: `No valid rows.\n${errors.join("\n")}` }] };
      const result = await NepLmsTimetable.insertMany(docs, { ordered: false });
      return { content: [{ type: "text", text: `Inserted ${result.length} of ${raw.length} rows.\n${errors.join("\n")}` }] };
    }
  );

  server.tool(
    "get_excel_template_lms_timetable",
    "Download an Excel template for bulk-uploading class diary entries.",
    { file_path: z.string().min(1) },
    async ({ file_path }) => {
      const ws = XLSX.utils.aoa_to_sheet([
        ["Academic Year", "Regulation", "Program", "Program Code", "Faculty", "Faculty Email", "Major", "Semester", "Course", "Course Code", "Class Date", "Class Time", "Period", "Duration Minutes", "Module", "Topic", "Work Completed"],
        ["2026-27", "NEP2020", "B.Sc Computer Science", "BSCS", "Dr. Smith", "smith@college.edu", "Computer Science", "I", "Data Structures", "CS101", "2026-08-10", "09:00", "1", 60, "Module 1", "Arrays and Pointers", "Introduced arrays, covered indexing and traversal"]
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Timetable");
      XLSX.writeFile(wb, file_path);
      return { content: [{ type: "text", text: `Template saved: ${file_path}` }] };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3 — ASSIGNMENT SUBMISSIONS
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_lms_submissions",
    "List student assignment submissions for a course with optional filters.",
    {
      coursecode: z.string().optional(),
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      assignmentid: z.string().optional(),
      regno: z.string().optional(),
      status: z.string().optional().describe("Submitted | Graded"),
      limit: z.number().int().min(1).max(500).default(100).optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 100, assignmentid, ...rest } = args;
      const query = applyFilters({ colid }, rest);
      if (assignmentid) query.assignmentid = mongoose.Types.ObjectId.isValid(assignmentid) ? new mongoose.Types.ObjectId(assignmentid) : assignmentid;
      const docs = await NepLmsSubmission.find(query).sort({ submitteddate: -1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "grade_lms_submission",
    "Grade a student assignment submission (add marks and faculty comments).",
    {
      id: z.string().min(1).describe("Submission _id"),
      fullmarks: z.number().optional(),
      marks: z.number().min(0),
      facultycomments: z.string().optional(),
      gradedby: z.string().optional()
    },
    async ({ id, fullmarks, marks, facultycomments, gradedby }) => {
      requireAuth();
      await connectDB();
      const user = resolveUser();
      const updates = {
        marks,
        facultycomments: facultycomments || "",
        gradedby: gradedby || user,
        gradeddate: new Date(),
        status: "Graded"
      };
      if (fullmarks !== undefined) updates.fullmarks = fullmarks;
      const doc = await NepLmsSubmission.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
      if (!doc) return { content: [{ type: "text", text: "Submission not found" }] };
      return { content: [{ type: "text", text: `Submission graded: ${doc._id} — ${marks}/${doc.fullmarks}` }] };
    }
  );

  server.tool(
    "report_lms_submissions",
    "Report: assignment submission summary per assignment or per student for a course.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      group_by: z.enum(["assignment", "student"]).default("assignment").optional()
    },
    async ({ academicyear, semester, coursecode, group_by = "assignment" }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const match = { colid };
      if (academicyear) match.academicyear = academicyear;
      if (semester) match.semester = semester;
      if (coursecode) match.coursecode = coursecode;
      const groupField = group_by === "student" ? "$regno" : "$assignmenttitle";
      const pipeline = [
        { $match: match },
        {
          $group: {
            _id: groupField,
            label: { $first: group_by === "student" ? "$student" : "$assignmenttitle" },
            totalSubmissions: { $sum: 1 },
            graded: { $sum: { $cond: [{ $eq: ["$status", "Graded"] }, 1, 0] } },
            avgMarks: { $avg: "$marks" },
            avgFullMarks: { $avg: "$fullmarks" }
          }
        },
        { $sort: { _id: 1 } }
      ];
      const data = await NepLmsSubmission.aggregate(pipeline);
      return { content: [{ type: "text", text: JSON.stringify({ count: data.length, data }, null, 2) }] };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4 — QUIZ
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_lms_quizzes",
    "List MCQ quizzes for a course.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      facultyemail: z.string().optional(),
      status: z.string().optional().describe("Active | Inactive"),
      limit: z.number().int().min(1).max(200).default(50).optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 50, ...rest } = args;
      const query = applyFilters({ colid }, rest);
      const docs = await NepLmsQuiz.find(query).sort({ createdAt: -1 }).limit(limit).lean();
      const summarized = docs.map((q) => ({
        _id: q._id,
        title: q.title,
        coursecode: q.coursecode,
        semester: q.semester,
        academicyear: q.academicyear,
        module: q.module,
        topic: q.topic,
        status: q.status,
        startdatetime: q.startdatetime,
        enddatetime: q.enddatetime,
        sectionsCount: (q.sections || []).length,
        questionsCount: (q.sections || []).reduce((sum, s) => sum + (s.questions || []).length, 0)
      }));
      return { content: [{ type: "text", text: JSON.stringify({ count: summarized.length, data: summarized }, null, 2) }] };
    }
  );

  server.tool(
    "get_lms_quiz_details",
    "Get full quiz details including all sections and questions.",
    { quiz_id: z.string().min(1) },
    async ({ quiz_id }) => {
      requireAuth();
      await connectDB();
      const doc = await NepLmsQuiz.findById(quiz_id).lean();
      if (!doc) return { content: [{ type: "text", text: "Quiz not found" }] };
      return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
    }
  );

  server.tool(
    "add_lms_quiz",
    "Create a new MCQ quiz for a course.",
    {
      academicyear: z.string().min(1),
      regulation: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      type: z.string().optional(),
      major: z.string().optional(),
      semester: z.string().min(1),
      course: z.string().optional(),
      coursecode: z.string().min(1),
      faculty: z.string().optional(),
      facultyemail: z.string().optional(),
      title: z.string().min(1),
      module: z.string().optional(),
      topic: z.string().optional(),
      startdatetime: z.string().min(1).describe("ISO datetime string e.g. 2026-09-01T09:00"),
      enddatetime: z.string().min(1).describe("ISO datetime string e.g. 2026-09-01T10:00"),
      status: z.enum(["Active", "Inactive"]).default("Active").optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const user = resolveUser();
      const startdatetime = parseLmsDate(args.startdatetime);
      const enddatetime = parseLmsDate(args.enddatetime);
      if (!startdatetime || !enddatetime) return { content: [{ type: "text", text: "Invalid start or end datetime" }] };
      const doc = await NepLmsQuiz.create({ ...args, startdatetime, enddatetime, colid, user });
      return { content: [{ type: "text", text: `Quiz created: ${doc._id}` }] };
    }
  );

  server.tool(
    "update_lms_quiz",
    "Update an existing quiz.",
    {
      id: z.string().min(1),
      title: z.string().optional(),
      module: z.string().optional(),
      topic: z.string().optional(),
      startdatetime: z.string().optional(),
      enddatetime: z.string().optional(),
      status: z.enum(["Active", "Inactive"]).optional()
    },
    async ({ id, startdatetime, enddatetime, ...rest }) => {
      requireAuth();
      await connectDB();
      const updates = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
      if (startdatetime) { const d = parseLmsDate(startdatetime); if (d) updates.startdatetime = d; }
      if (enddatetime) { const d = parseLmsDate(enddatetime); if (d) updates.enddatetime = d; }
      const doc = await NepLmsQuiz.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
      if (!doc) return { content: [{ type: "text", text: "Quiz not found" }] };
      return { content: [{ type: "text", text: `Quiz updated: ${doc._id}` }] };
    }
  );

  server.tool(
    "delete_lms_quiz",
    "Delete a quiz and all its sections/questions.",
    { id: z.string().min(1) },
    async ({ id }) => {
      requireAuth();
      await connectDB();
      await NepLmsQuiz.findByIdAndDelete(id);
      await NepLmsQuizAttempt.deleteMany({ quizid: id });
      return { content: [{ type: "text", text: `Quiz and attempts deleted: ${id}` }] };
    }
  );

  server.tool(
    "add_lms_quiz_section",
    "Add a section to an existing quiz.",
    {
      quiz_id: z.string().min(1),
      title: z.string().min(1).describe("Section title")
    },
    async ({ quiz_id, title }) => {
      requireAuth();
      await connectDB();
      const doc = await NepLmsQuiz.findByIdAndUpdate(
        quiz_id,
        { $push: { sections: { title } } },
        { new: true }
      ).lean();
      if (!doc) return { content: [{ type: "text", text: "Quiz not found" }] };
      const added = doc.sections[doc.sections.length - 1];
      return { content: [{ type: "text", text: `Section added: ${added._id} — "${title}"` }] };
    }
  );

  server.tool(
    "add_lms_quiz_question",
    "Add an MCQ question to a quiz section.",
    {
      quiz_id: z.string().min(1),
      section_id: z.string().min(1),
      question: z.string().min(1),
      score: z.number().default(1).optional(),
      options: z.array(z.object({
        text: z.string(),
        iscorrect: z.boolean().default(false)
      })).min(2).max(6)
    },
    async ({ quiz_id, section_id, question, score = 1, options }) => {
      requireAuth();
      await connectDB();
      const doc = await NepLmsQuiz.findOneAndUpdate(
        { _id: quiz_id, "sections._id": section_id },
        { $push: { "sections.$.questions": { question, score, options } } },
        { new: true }
      ).lean();
      if (!doc) return { content: [{ type: "text", text: "Quiz or section not found" }] };
      return { content: [{ type: "text", text: `Question added to section ${section_id}` }] };
    }
  );

  server.tool(
    "delete_lms_quiz_question",
    "Delete a question from a quiz section.",
    {
      quiz_id: z.string().min(1),
      section_id: z.string().min(1),
      question_id: z.string().min(1)
    },
    async ({ quiz_id, section_id, question_id }) => {
      requireAuth();
      await connectDB();
      await NepLmsQuiz.findOneAndUpdate(
        { _id: quiz_id, "sections._id": section_id },
        { $pull: { "sections.$.questions": { _id: question_id } } }
      );
      return { content: [{ type: "text", text: `Question deleted: ${question_id}` }] };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5 — QUIZ ATTEMPTS
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_lms_quiz_attempts",
    "List quiz attempts for a quiz or a course.",
    {
      quizid: z.string().optional(),
      coursecode: z.string().optional(),
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      regno: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().int().min(1).max(500).default(100).optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 100, quizid, ...rest } = args;
      const query = applyFilters({ colid }, rest);
      if (quizid) query.quizid = mongoose.Types.ObjectId.isValid(quizid) ? new mongoose.Types.ObjectId(quizid) : quizid;
      const docs = await NepLmsQuizAttempt.find(query).sort({ submitteddate: -1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "report_lms_quiz_attempts",
    "Report: average score per quiz for a course.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional()
    },
    async ({ academicyear, semester, coursecode }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const match = { colid };
      if (academicyear) match.academicyear = academicyear;
      if (semester) match.semester = semester;
      if (coursecode) match.coursecode = coursecode;
      const data = await NepLmsQuizAttempt.aggregate([
        { $match: match },
        {
          $group: {
            _id: { quizid: "$quizid", quiztitle: "$quiztitle" },
            attempts: { $sum: 1 },
            avgObtained: { $avg: "$obtainedmarks" },
            avgTotal: { $avg: "$totalmarks" },
            maxObtained: { $max: "$obtainedmarks" },
            minObtained: { $min: "$obtainedmarks" }
          }
        },
        { $sort: { "_id.quiztitle": 1 } }
      ]);
      return { content: [{ type: "text", text: JSON.stringify({ count: data.length, data }, null, 2) }] };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 6 — ATTENDANCE
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_lms_attendance",
    "List attendance records with optional filters.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      classdate: z.string().optional(),
      from_date: z.string().optional(),
      to_date: z.string().optional(),
      regno: z.string().optional(),
      attendance: z.number().int().optional().describe("1=Present, 0=Absent"),
      limit: z.number().int().min(1).max(2000).default(500).optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { from_date, to_date, classdate, limit = 500, ...rest } = args;
      const query = applyFilters({ colid }, rest);
      if (classdate) query.classdate = classdate;
      else if (from_date || to_date) {
        query.classdate = {};
        if (from_date) query.classdate.$gte = from_date;
        if (to_date) query.classdate.$lte = to_date;
      }
      const docs = await NepLmsAttendance.find(query).sort({ classdate: -1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "report_lms_attendance",
    "Report: student-wise attendance summary (present, absent, percentage) for a course.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      facultyemail: z.string().optional(),
      from_date: z.string().optional(),
      to_date: z.string().optional()
    },
    async ({ academicyear, semester, coursecode, facultyemail, from_date, to_date }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const match = { colid };
      if (academicyear) match.academicyear = academicyear;
      if (semester) match.semester = semester;
      if (coursecode) match.coursecode = coursecode;
      if (facultyemail) match.facultyemail = { $regex: facultyemail, $options: "i" };
      if (from_date || to_date) {
        match.classdate = {};
        if (from_date) match.classdate.$gte = from_date;
        if (to_date) match.classdate.$lte = to_date;
      }
      const data = await NepLmsAttendance.aggregate([
        { $match: match },
        {
          $group: {
            _id: { regno: "$regno", coursecode: "$coursecode" },
            student: { $first: "$student" },
            course: { $first: "$course" },
            totalClasses: { $sum: 1 },
            present: { $sum: "$attendance" },
            absent: { $sum: { $subtract: [1, "$attendance"] } }
          }
        },
        {
          $addFields: {
            percentage: {
              $cond: [
                { $gt: ["$totalClasses", 0] },
                { $multiply: [{ $divide: ["$present", "$totalClasses"] }, 100] },
                0
              ]
            },
            lowAttendance: {
              $lt: [
                { $cond: [{ $gt: ["$totalClasses", 0] }, { $multiply: [{ $divide: ["$present", "$totalClasses"] }, 100] }, 0] },
                75
              ]
            }
          }
        },
        { $sort: { "_id.coursecode": 1, percentage: 1 } }
      ]);
      return { content: [{ type: "text", text: JSON.stringify({ count: data.length, data }, null, 2) }] };
    }
  );

  server.tool(
    "report_lms_low_attendance",
    "Report: students with attendance below a threshold (default 75%).",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      threshold: z.number().default(75).optional().describe("Percentage threshold (default 75)")
    },
    async ({ academicyear, semester, coursecode, threshold = 75 }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const match = { colid };
      if (academicyear) match.academicyear = academicyear;
      if (semester) match.semester = semester;
      if (coursecode) match.coursecode = coursecode;
      const data = await NepLmsAttendance.aggregate([
        { $match: match },
        {
          $group: {
            _id: { regno: "$regno", coursecode: "$coursecode" },
            student: { $first: "$student" },
            studentemail: { $first: "$studentemail" },
            course: { $first: "$course" },
            semester: { $first: "$semester" },
            academicyear: { $first: "$academicyear" },
            totalClasses: { $sum: 1 },
            present: { $sum: "$attendance" }
          }
        },
        {
          $addFields: {
            percentage: {
              $cond: [{ $gt: ["$totalClasses", 0] }, { $multiply: [{ $divide: ["$present", "$totalClasses"] }, 100] }, 0]
            }
          }
        },
        { $match: { percentage: { $lt: threshold } } },
        { $sort: { percentage: 1 } }
      ]);
      return { content: [{ type: "text", text: JSON.stringify({ count: data.length, threshold, data }, null, 2) }] };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 7 — REMEDIAL CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_lms_remedial",
    "List remedial content assignments for students.",
    {
      academicyear: z.string().optional(),
      coursecode: z.string().optional(),
      regno: z.string().optional(),
      topic: z.string().optional(),
      contenttype: z.string().optional().describe("Video | Document | Link"),
      status: z.string().optional(),
      limit: z.number().int().min(1).max(500).default(100).optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 100, ...rest } = args;
      const query = applyFilters({ colid }, rest);
      const docs = await NepLmsRemedial.find(query).sort({ createdAt: -1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "add_lms_remedial",
    "Assign remedial content to a student for a specific topic/question.",
    {
      academicyear: z.string().min(1),
      regulation: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      course: z.string().optional(),
      coursecode: z.string().min(1),
      topic: z.string().optional(),
      student: z.string().optional(),
      regno: z.string().min(1),
      assessmentid: z.string().optional(),
      assessmenttitle: z.string().optional(),
      questionid: z.string().optional(),
      question: z.string().optional(),
      contenttype: z.enum(["Video", "Document", "Link", "Notes"]).default("Video").optional(),
      title: z.string().min(1),
      description: z.string().optional(),
      link: z.string().optional(),
      provider: z.string().optional(),
      marks: z.number().optional(),
      maxmarks: z.number().optional(),
      percentage: z.number().optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const user = resolveUser();
      const doc = await NepLmsRemedial.create({ ...args, colid, user });
      return { content: [{ type: "text", text: `Remedial content assigned: ${doc._id}` }] };
    }
  );

  server.tool(
    "update_lms_remedial",
    "Update a remedial content entry.",
    {
      id: z.string().min(1),
      contenttype: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      link: z.string().optional(),
      provider: z.string().optional(),
      marks: z.number().optional(),
      maxmarks: z.number().optional(),
      percentage: z.number().optional(),
      status: z.string().optional()
    },
    async ({ id, ...rest }) => {
      requireAuth();
      await connectDB();
      const updates = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
      const doc = await NepLmsRemedial.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
      if (!doc) return { content: [{ type: "text", text: "Remedial entry not found" }] };
      return { content: [{ type: "text", text: `Remedial entry updated: ${doc._id}` }] };
    }
  );

  server.tool(
    "delete_lms_remedial",
    "Delete a remedial content entry.",
    { id: z.string().min(1) },
    async ({ id }) => {
      requireAuth();
      await connectDB();
      await NepLmsRemedial.findByIdAndDelete(id);
      return { content: [{ type: "text", text: `Remedial entry deleted: ${id}` }] };
    }
  );

  server.tool(
    "bulk_upload_lms_remedial_from_json",
    "Bulk assign remedial content from a JSON array.",
    {
      records: z.array(z.object({
        academicyear: z.string(),
        coursecode: z.string(),
        regno: z.string(),
        title: z.string(),
        contenttype: z.string().optional(),
        link: z.string().optional(),
        topic: z.string().optional(),
        description: z.string().optional(),
        provider: z.string().optional()
      })).min(1).max(500)
    },
    async ({ records }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const user = resolveUser();
      const docs = records.map((r) => ({ ...r, colid, user }));
      const result = await NepLmsRemedial.insertMany(docs, { ordered: false });
      return { content: [{ type: "text", text: `Inserted ${result.length} of ${records.length} remedial entries.` }] };
    }
  );

  server.tool(
    "bulk_upload_lms_remedial_from_excel",
    "Bulk assign remedial content from Excel. Columns: Academic Year, Course Code, Reg No, Student, Content Type, Title, Description, Link, Provider, Topic.",
    { file_path: z.string().min(1) },
    async ({ file_path }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const user = resolveUser();
      const wb = XLSX.readFile(file_path);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const aliasMap = {
        academicyear: ["academicyear", "academic year", "year"],
        regulation: ["regulation"],
        program: ["program"],
        programcode: ["programcode", "program code"],
        course: ["course"],
        coursecode: ["coursecode", "course code"],
        topic: ["topic"],
        student: ["student", "student name"],
        regno: ["regno", "reg no", "registration no", "roll no"],
        contenttype: ["contenttype", "content type", "type"],
        title: ["title"],
        description: ["description", "desc"],
        link: ["link", "url"],
        provider: ["provider"],
        marks: ["marks"],
        maxmarks: ["maxmarks", "max marks"],
        percentage: ["percentage"]
      };
      const numFields = new Set(["marks", "maxmarks", "percentage"]);
      const errors = [];
      const docs = [];
      raw.forEach((row, idx) => {
        const normalized = {};
        for (const [k, v] of Object.entries(row)) normalized[normalizeHeader(k)] = v;
        const mapped = {};
        for (const [field, aliases] of Object.entries(aliasMap)) {
          for (const alias of aliases) {
            const key = normalizeHeader(alias);
            if (normalized[key] !== undefined) { mapped[field] = normalized[key]; break; }
          }
        }
        if (!mapped.academicyear) { errors.push(`Row ${idx + 2}: academicyear missing`); return; }
        if (!mapped.coursecode) { errors.push(`Row ${idx + 2}: coursecode missing`); return; }
        if (!mapped.regno) { errors.push(`Row ${idx + 2}: regno missing`); return; }
        if (!mapped.title) { errors.push(`Row ${idx + 2}: title missing`); return; }
        for (const f of numFields) if (mapped[f] !== undefined) mapped[f] = Number(mapped[f]) || 0;
        docs.push({ ...mapped, colid, user });
      });
      if (!docs.length) return { content: [{ type: "text", text: `No valid rows.\n${errors.join("\n")}` }] };
      const result = await NepLmsRemedial.insertMany(docs, { ordered: false });
      return { content: [{ type: "text", text: `Inserted ${result.length} of ${raw.length} rows.\n${errors.join("\n")}` }] };
    }
  );

  server.tool(
    "get_excel_template_lms_remedial",
    "Download an Excel template for bulk-uploading remedial content.",
    { file_path: z.string().min(1) },
    async ({ file_path }) => {
      const ws = XLSX.utils.aoa_to_sheet([
        ["Academic Year", "Course Code", "Reg No", "Student", "Content Type", "Title", "Description", "Link", "Provider", "Topic"],
        ["2026-27", "CS101", "23CS001", "Alice Rajan", "Video", "Arrays Explained", "Watch this video to understand arrays", "https://youtube.com/...", "YouTube", "Arrays"]
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Remedial");
      XLSX.writeFile(wb, file_path);
      return { content: [{ type: "text", text: `Template saved: ${file_path}` }] };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 8 — ASSESSMENT MARKS
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_lms_assessment_marks",
    "List assessment marks for a course.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      assessmentcomponent: z.string().optional(),
      assessmentgroup: z.string().optional(),
      regno: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().int().min(1).max(2000).default(500).optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 500, ...rest } = args;
      const query = applyFilters({ colid }, rest);
      const docs = await NepLmsAssessmentMarks.find(query).sort({ coursecode: 1, regno: 1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "bulk_upload_lms_assessment_marks_from_json",
    "Bulk upload assessment marks from a JSON array.",
    {
      records: z.array(z.object({
        academicyear: z.string(),
        semester: z.string(),
        coursecode: z.string(),
        assessmentcomponent: z.string(),
        assessmentgroup: z.string().optional(),
        regno: z.string(),
        student: z.string().optional(),
        totalmarks: z.number().optional(),
        marksobtained: z.number(),
        weightage: z.number().optional(),
        effectivemarks: z.number().optional(),
        facultyemail: z.string().optional()
      })).min(1).max(2000)
    },
    async ({ records }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const user = resolveUser();
      const docs = records.map((r) => ({ ...r, colid, user }));
      const result = await NepLmsAssessmentMarks.insertMany(docs, { ordered: false });
      return { content: [{ type: "text", text: `Inserted ${result.length} of ${records.length} assessment mark entries.` }] };
    }
  );

  server.tool(
    "bulk_upload_lms_assessment_marks_from_excel",
    "Bulk upload assessment marks from Excel. Columns: Academic Year, Semester, Course Code, Assessment Component, Assessment Group, Reg No, Student, Total Marks, Marks Obtained, Weightage, Effective Marks, Faculty Email.",
    { file_path: z.string().min(1) },
    async ({ file_path }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const user = resolveUser();
      const wb = XLSX.readFile(file_path);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const aliasMap = {
        academicyear: ["academicyear", "academic year", "year"],
        regulation: ["regulation"],
        program: ["program"],
        programcode: ["programcode", "program code"],
        type: ["type"],
        subject: ["subject", "major"],
        semester: ["semester", "sem"],
        course: ["course"],
        coursecode: ["coursecode", "course code"],
        assessmentcomponent: ["assessmentcomponent", "assessment component", "component"],
        assessmentgroup: ["assessmentgroup", "assessment group", "group"],
        grouptype: ["grouptype", "group type"],
        scoretype: ["scoretype", "score type"],
        totalmarks: ["totalmarks", "total marks"],
        weightage: ["weightage"],
        marksobtained: ["marksobtained", "marks obtained", "marks"],
        effectivemarks: ["effectivemarks", "effective marks"],
        student: ["student", "student name"],
        regno: ["regno", "reg no", "registration no"],
        email: ["email"],
        phone: ["phone"],
        faculty: ["faculty"],
        facultyemail: ["facultyemail", "faculty email"]
      };
      const numFields = new Set(["totalmarks", "weightage", "marksobtained", "effectivemarks"]);
      const errors = [];
      const docs = [];
      raw.forEach((row, idx) => {
        const normalized = {};
        for (const [k, v] of Object.entries(row)) normalized[normalizeHeader(k)] = v;
        const mapped = {};
        for (const [field, aliases] of Object.entries(aliasMap)) {
          for (const alias of aliases) {
            const key = normalizeHeader(alias);
            if (normalized[key] !== undefined) { mapped[field] = normalized[key]; break; }
          }
        }
        if (!mapped.academicyear) { errors.push(`Row ${idx + 2}: academicyear missing`); return; }
        if (!mapped.semester) { errors.push(`Row ${idx + 2}: semester missing`); return; }
        if (!mapped.coursecode) { errors.push(`Row ${idx + 2}: coursecode missing`); return; }
        if (!mapped.assessmentcomponent) { errors.push(`Row ${idx + 2}: assessmentcomponent missing`); return; }
        if (!mapped.regno) { errors.push(`Row ${idx + 2}: regno missing`); return; }
        if (mapped.marksobtained === undefined) { errors.push(`Row ${idx + 2}: marksobtained missing`); return; }
        for (const f of numFields) if (mapped[f] !== undefined) mapped[f] = Number(mapped[f]) || 0;
        docs.push({ ...mapped, colid, user });
      });
      if (!docs.length) return { content: [{ type: "text", text: `No valid rows.\n${errors.join("\n")}` }] };
      const result = await NepLmsAssessmentMarks.insertMany(docs, { ordered: false });
      return { content: [{ type: "text", text: `Inserted ${result.length} of ${raw.length} rows.\n${errors.join("\n")}` }] };
    }
  );

  server.tool(
    "get_excel_template_lms_assessment_marks",
    "Download an Excel template for bulk-uploading assessment marks.",
    { file_path: z.string().min(1) },
    async ({ file_path }) => {
      const ws = XLSX.utils.aoa_to_sheet([
        ["Academic Year", "Semester", "Course Code", "Assessment Component", "Assessment Group", "Reg No", "Student", "Total Marks", "Marks Obtained", "Weightage", "Effective Marks", "Faculty Email"],
        ["2026-27", "I", "CS101", "Internal Assessment 1", "IA", "23CS001", "Alice Rajan", 20, 17, 100, 17, "smith@college.edu"]
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "AssessmentMarks");
      XLSX.writeFile(wb, file_path);
      return { content: [{ type: "text", text: `Template saved: ${file_path}` }] };
    }
  );

  server.tool(
    "report_lms_assessment_marks",
    "Report: average marks per assessment component for a course.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional()
    },
    async ({ academicyear, semester, coursecode }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const match = { colid };
      if (academicyear) match.academicyear = academicyear;
      if (semester) match.semester = semester;
      if (coursecode) match.coursecode = coursecode;
      const data = await NepLmsAssessmentMarks.aggregate([
        { $match: match },
        {
          $group: {
            _id: { coursecode: "$coursecode", assessmentcomponent: "$assessmentcomponent", assessmentgroup: "$assessmentgroup" },
            students: { $sum: 1 },
            avgMarks: { $avg: "$marksobtained" },
            avgTotal: { $avg: "$totalmarks" },
            maxMarks: { $max: "$marksobtained" },
            minMarks: { $min: "$marksobtained" }
          }
        },
        { $sort: { "_id.coursecode": 1, "_id.assessmentcomponent": 1 } }
      ]);
      return { content: [{ type: "text", text: JSON.stringify({ count: data.length, data }, null, 2) }] };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 9 — COMPONENT MARKS
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_lms_component_marks",
    "List component marks (consolidated internal/external) for a course.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      assessmentgroup: z.string().optional(),
      regno: z.string().optional(),
      passstatus: z.enum(["Pass", "Fail"]).optional(),
      limit: z.number().int().min(1).max(2000).default(500).optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 500, ...rest } = args;
      const query = applyFilters({ colid }, rest);
      const docs = await NepLmsComponentMarks.find(query).sort({ coursecode: 1, regno: 1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "report_lms_component_marks",
    "Report: pass/fail count and average marks per course component.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional()
    },
    async ({ academicyear, semester, coursecode }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const match = { colid };
      if (academicyear) match.academicyear = academicyear;
      if (semester) match.semester = semester;
      if (coursecode) match.coursecode = coursecode;
      const data = await NepLmsComponentMarks.aggregate([
        { $match: match },
        {
          $group: {
            _id: { coursecode: "$coursecode", assessmentgroup: "$assessmentgroup" },
            totalStudents: { $sum: 1 },
            passed: { $sum: { $cond: [{ $eq: ["$passstatus", "Pass"] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ["$passstatus", "Fail"] }, 1, 0] } },
            avgMarks: { $avg: "$marks" },
            avgCredits: { $avg: "$credits" }
          }
        },
        { $sort: { "_id.coursecode": 1, "_id.assessmentgroup": 1 } }
      ]);
      return { content: [{ type: "text", text: JSON.stringify({ count: data.length, data }, null, 2) }] };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 10 — CO ATTAINMENT
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_lms_co_attainment",
    "List CO attainment records.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      conumber: z.string().optional(),
      limit: z.number().int().min(1).max(500).default(100).optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 100, ...rest } = args;
      const query = applyFilters({ colid }, rest);
      const docs = await NepLmsCoAttainment.find(query).sort({ coursecode: 1, conumber: 1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "report_lms_co_attainment",
    "Report: CO attainment summary (average attainment % per CO per course).",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      programcode: z.string().optional()
    },
    async ({ academicyear, semester, coursecode, programcode }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const match = { colid };
      if (academicyear) match.academicyear = academicyear;
      if (semester) match.semester = semester;
      if (coursecode) match.coursecode = coursecode;
      if (programcode) match.programcode = programcode;
      const data = await NepLmsCoAttainment.aggregate([
        { $match: match },
        {
          $group: {
            _id: { coursecode: "$coursecode", conumber: "$conumber" },
            course: { $first: "$course" },
            co: { $first: "$co" },
            avgAttainmentPercentage: { $avg: "$attainmentpercentage" },
            avgStudentsAbove: { $avg: "$studentsabove" },
            avgTotalStudents: { $avg: "$totalstudents" },
            level: { $first: "$level" }
          }
        },
        { $sort: { "_id.coursecode": 1, "_id.conumber": 1 } }
      ]);
      return { content: [{ type: "text", text: JSON.stringify({ count: data.length, data }, null, 2) }] };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 11 — FINAL MARKS
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_lms_final_marks",
    "List final marks (grades, GPA) for students.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      programcode: z.string().optional(),
      regno: z.string().optional(),
      grade: z.string().optional(),
      passstatus: z.enum(["Pass", "Fail"]).optional(),
      limit: z.number().int().min(1).max(2000).default(500).optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 500, ...rest } = args;
      const query = applyFilters({ colid }, rest);
      const docs = await NepLmsFinalMarks.find(query).sort({ coursecode: 1, regno: 1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "report_lms_final_marks",
    "Report: grade distribution, pass/fail ratio, and average GPA per course.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      programcode: z.string().optional()
    },
    async ({ academicyear, semester, coursecode, programcode }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const match = { colid };
      if (academicyear) match.academicyear = academicyear;
      if (semester) match.semester = semester;
      if (coursecode) match.coursecode = coursecode;
      if (programcode) match.programcode = programcode;
      const data = await NepLmsFinalMarks.aggregate([
        { $match: match },
        {
          $group: {
            _id: { coursecode: "$coursecode", semester: "$semester" },
            course: { $first: "$course" },
            totalStudents: { $sum: 1 },
            passed: { $sum: { $cond: [{ $eq: ["$passstatus", "Pass"] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ["$passstatus", "Fail"] }, 1, 0] } },
            avgTotal: { $avg: "$total" },
            avgGPA: { $avg: "$gpa" },
            avgInternal: { $avg: "$internalmarks" },
            avgExternal: { $avg: "$externalmarks" }
          }
        },
        { $sort: { "_id.coursecode": 1 } }
      ]);
      // grade distribution separately
      const gradeData = await NepLmsFinalMarks.aggregate([
        { $match: match },
        {
          $group: {
            _id: { coursecode: "$coursecode", grade: "$grade" },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.grade": 1 } }
      ]);
      return { content: [{ type: "text", text: JSON.stringify({ summary: data, gradeDistribution: gradeData }, null, 2) }] };
    }
  );

  server.tool(
    "bulk_upload_lms_final_marks_from_json",
    "Bulk upload final marks from a JSON array.",
    {
      records: z.array(z.object({
        academicyear: z.string(),
        semester: z.string(),
        coursecode: z.string(),
        regno: z.string(),
        student: z.string().optional(),
        programcode: z.string().optional(),
        internalmarks: z.number().optional(),
        externalmarks: z.number().optional(),
        total: z.number().optional(),
        grade: z.string().optional(),
        gradepoint: z.number().optional(),
        credits: z.number().optional(),
        gpa: z.number().optional(),
        passstatus: z.enum(["Pass", "Fail"]).optional()
      })).min(1).max(2000)
    },
    async ({ records }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const user = resolveUser();
      const docs = records.map((r) => ({ ...r, colid, user }));
      const result = await NepLmsFinalMarks.insertMany(docs, { ordered: false });
      return { content: [{ type: "text", text: `Inserted ${result.length} of ${records.length} final mark entries.` }] };
    }
  );

  server.tool(
    "bulk_upload_lms_final_marks_from_excel",
    "Bulk upload final marks from Excel. Columns: Academic Year, Semester, Course Code, Reg No, Student, Program Code, Internal Marks, External Marks, Total, Grade, Grade Point, Credits, GPA, Pass Status.",
    { file_path: z.string().min(1) },
    async ({ file_path }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const user = resolveUser();
      const wb = XLSX.readFile(file_path);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const aliasMap = {
        academicyear: ["academicyear", "academic year", "year"],
        semester: ["semester", "sem"],
        programcode: ["programcode", "program code"],
        regulation: ["regulation"],
        course: ["course"],
        coursecode: ["coursecode", "course code"],
        major: ["major", "subject"],
        student: ["student", "student name"],
        regno: ["regno", "reg no", "registration no"],
        internalmarks: ["internalmarks", "internal marks", "internal"],
        externalmarks: ["externalmarks", "external marks", "external"],
        total: ["total", "total marks"],
        grade: ["grade"],
        gradepoint: ["gradepoint", "grade point"],
        credits: ["credits"],
        gpa: ["gpa"],
        passstatus: ["passstatus", "pass status", "result"],
        attempt: ["attempt"],
        failmode: ["failmode", "fail mode"],
        grademode: ["grademode", "grade mode"]
      };
      const numFields = new Set(["internalmarks", "externalmarks", "total", "gradepoint", "credits", "gpa", "attempt"]);
      const errors = [];
      const docs = [];
      raw.forEach((row, idx) => {
        const normalized = {};
        for (const [k, v] of Object.entries(row)) normalized[normalizeHeader(k)] = v;
        const mapped = {};
        for (const [field, aliases] of Object.entries(aliasMap)) {
          for (const alias of aliases) {
            const key = normalizeHeader(alias);
            if (normalized[key] !== undefined) { mapped[field] = normalized[key]; break; }
          }
        }
        if (!mapped.academicyear) { errors.push(`Row ${idx + 2}: academicyear missing`); return; }
        if (!mapped.semester) { errors.push(`Row ${idx + 2}: semester missing`); return; }
        if (!mapped.coursecode) { errors.push(`Row ${idx + 2}: coursecode missing`); return; }
        if (!mapped.regno) { errors.push(`Row ${idx + 2}: regno missing`); return; }
        for (const f of numFields) if (mapped[f] !== undefined) mapped[f] = Number(mapped[f]) || 0;
        docs.push({ ...mapped, colid, user });
      });
      if (!docs.length) return { content: [{ type: "text", text: `No valid rows.\n${errors.join("\n")}` }] };
      const result = await NepLmsFinalMarks.insertMany(docs, { ordered: false });
      return { content: [{ type: "text", text: `Inserted ${result.length} of ${raw.length} rows.\n${errors.join("\n")}` }] };
    }
  );

  server.tool(
    "get_excel_template_lms_final_marks",
    "Download an Excel template for bulk-uploading final marks.",
    { file_path: z.string().min(1) },
    async ({ file_path }) => {
      const ws = XLSX.utils.aoa_to_sheet([
        ["Academic Year", "Semester", "Course Code", "Reg No", "Student", "Program Code", "Internal Marks", "External Marks", "Total", "Grade", "Grade Point", "Credits", "GPA", "Pass Status"],
        ["2026-27", "I", "CS101", "23CS001", "Alice Rajan", "BSCS", 35, 52, 87, "O", 10, 4, 10, "Pass"]
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "FinalMarks");
      XLSX.writeFile(wb, file_path);
      return { content: [{ type: "text", text: `Template saved: ${file_path}` }] };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 12 — CROSS-CUTTING REPORTS
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "report_lms_course_coverage",
    "Report: course coverage analysis — number of classes held, modules covered, and topics covered per course vs planned syllabus.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      facultyemail: z.string().optional()
    },
    async ({ academicyear, semester, coursecode, facultyemail }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const match = { colid };
      if (academicyear) match.academicyear = academicyear;
      if (semester) match.semester = semester;
      if (coursecode) match.coursecode = coursecode;
      if (facultyemail) match.facultyemail = { $regex: facultyemail, $options: "i" };
      const data = await NepLmsTimetable.aggregate([
        { $match: match },
        {
          $group: {
            _id: { coursecode: "$coursecode", semester: "$semester", academicyear: "$academicyear" },
            course: { $first: "$course" },
            faculty: { $first: "$faculty" },
            facultyemail: { $first: "$facultyemail" },
            totalClasses: { $sum: 1 },
            totalMinutes: { $sum: "$durationminutes" },
            modulesCount: { $addToSet: "$module" },
            topicsCount: { $addToSet: "$topic" },
            firstClass: { $min: "$classdate" },
            lastClass: { $max: "$classdate" }
          }
        },
        {
          $addFields: {
            modulesCount: { $size: { $filter: { input: "$modulesCount", cond: { $ne: ["$$this", ""] } } } },
            topicsCount: { $size: { $filter: { input: "$topicsCount", cond: { $ne: ["$$this", ""] } } } }
          }
        },
        { $sort: { "_id.academicyear": -1, "_id.coursecode": 1 } }
      ]);
      return { content: [{ type: "text", text: JSON.stringify({ count: data.length, data }, null, 2) }] };
    }
  );

  server.tool(
    "report_lms_assignment_summary",
    "Report: per-course summary of assignments created vs submissions received.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional()
    },
    async ({ academicyear, semester, coursecode }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const matchBase = { colid };
      if (academicyear) matchBase.academicyear = academicyear;
      if (semester) matchBase.semester = semester;
      if (coursecode) matchBase.coursecode = coursecode;

      const [assignments, submissions] = await Promise.all([
        NepLmsResource.aggregate([
          { $match: { ...matchBase, resourcetype: "Assignment" } },
          { $group: { _id: "$coursecode", course: { $first: "$course" }, assignments: { $sum: 1 } } }
        ]),
        NepLmsSubmission.aggregate([
          { $match: matchBase },
          { $group: { _id: "$coursecode", submissions: { $sum: 1 }, graded: { $sum: { $cond: [{ $eq: ["$status", "Graded"] }, 1, 0] } } } }
        ])
      ]);

      const submissionMap = {};
      for (const s of submissions) submissionMap[s._id] = s;

      const result = assignments.map((a) => ({
        coursecode: a._id,
        course: a.course,
        assignments: a.assignments,
        submissions: submissionMap[a._id]?.submissions || 0,
        graded: submissionMap[a._id]?.graded || 0
      }));

      return { content: [{ type: "text", text: JSON.stringify({ count: result.length, data: result }, null, 2) }] };
    }
  );

  server.tool(
    "report_lms_faculty_dashboard",
    "Report: faculty-wise LMS activity summary — classes held, assignments, quizzes, submissions for a semester.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      facultyemail: z.string().optional()
    },
    async ({ academicyear, semester, facultyemail }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const matchBase = { colid };
      if (academicyear) matchBase.academicyear = academicyear;
      if (semester) matchBase.semester = semester;
      if (facultyemail) matchBase.facultyemail = { $regex: facultyemail, $options: "i" };

      const [classes, resources, quizzes] = await Promise.all([
        NepLmsTimetable.aggregate([
          { $match: matchBase },
          {
            $group: {
              _id: { facultyemail: "$facultyemail", coursecode: "$coursecode" },
              faculty: { $first: "$faculty" },
              course: { $first: "$course" },
              semester: { $first: "$semester" },
              academicyear: { $first: "$academicyear" },
              classesHeld: { $sum: 1 },
              totalMinutes: { $sum: "$durationminutes" }
            }
          }
        ]),
        NepLmsResource.aggregate([
          { $match: { ...matchBase, resourcetype: { $in: ["Assignment", "Lesson Plan", "Course Material"] } } },
          {
            $group: {
              _id: { facultyemail: "$facultyemail", coursecode: "$coursecode", resourcetype: "$resourcetype" },
              count: { $sum: 1 }
            }
          }
        ]),
        NepLmsQuiz.aggregate([
          { $match: matchBase },
          { $group: { _id: { facultyemail: "$facultyemail", coursecode: "$coursecode" }, quizzes: { $sum: 1 } } }
        ])
      ]);

      return { content: [{ type: "text", text: JSON.stringify({ classes, resources, quizzes }, null, 2) }] };
    }
  );

  server.tool(
    "report_lms_student_performance",
    "Report: student-level performance — attendance %, assessment marks, and final grade for a course.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      programcode: z.string().optional()
    },
    async ({ academicyear, semester, coursecode, programcode }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const match = { colid };
      if (academicyear) match.academicyear = academicyear;
      if (semester) match.semester = semester;
      if (coursecode) match.coursecode = coursecode;
      if (programcode) match.programcode = programcode;

      const [attendance, finalMarks] = await Promise.all([
        NepLmsAttendance.aggregate([
          { $match: match },
          {
            $group: {
              _id: { regno: "$regno", coursecode: "$coursecode" },
              student: { $first: "$student" },
              totalClasses: { $sum: 1 },
              present: { $sum: "$attendance" }
            }
          },
          {
            $addFields: {
              attendancePercent: {
                $cond: [{ $gt: ["$totalClasses", 0] }, { $multiply: [{ $divide: ["$present", "$totalClasses"] }, 100] }, 0]
              }
            }
          }
        ]),
        NepLmsFinalMarks.find(match).lean()
      ]);

      const attendanceMap = {};
      for (const a of attendance) attendanceMap[`${a._id.regno}::${a._id.coursecode}`] = a;

      const result = finalMarks.map((f) => ({
        regno: f.regno,
        student: f.student,
        coursecode: f.coursecode,
        course: f.course,
        internalmarks: f.internalmarks,
        externalmarks: f.externalmarks,
        total: f.total,
        grade: f.grade,
        gradepoint: f.gradepoint,
        credits: f.credits,
        gpa: f.gpa,
        passstatus: f.passstatus,
        attendancePercent: attendanceMap[`${f.regno}::${f.coursecode}`]?.attendancePercent ?? null,
        totalClasses: attendanceMap[`${f.regno}::${f.coursecode}`]?.totalClasses ?? null,
        presentClasses: attendanceMap[`${f.regno}::${f.coursecode}`]?.present ?? null
      }));

      return { content: [{ type: "text", text: JSON.stringify({ count: result.length, data: result }, null, 2) }] };
    }
  );
}
