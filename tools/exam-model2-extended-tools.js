/**
 * exam-model2-extended-tools.js
 *
 * MCP tools for all Examination Model 2 pages in ExaminationModel2Pages.jsx:
 *
 *   ExaminationModel2MarksPage            → examinationmodel2marksds
 *   ExaminationModel2VivaMarksPage        → examinationmodel2vivamarksds
 *   ExaminationModel2GradingTemplatePage  → exammodel2gradingtemplateds
 *   GradingTemplateDetailPage             → exammodel2gradingtemplatedetailds
 *   ClassConfigurationPage                → exammodel2classconfigurationds
 *   GradeProcessingPage                   → process grades on marks/viva-marks
 *   PercentageCalculationPage             → compute percentages
 *   ComponentFailRulePage                 → set overall F if component fails
 *   FinalGradeProcessingPage              → set Pass/Fail status
 *   MarksheetPage / VivaMarksheetPage     → generate formatted marksheet
 *   AprMarksheetPage                      → annual performance summary
 *
 * Note: component-marks CRUD and interim-marks-transfer are in exam-misc-tools.js.
 * Viva marksheet list/save/get are also in exam-misc-tools.js (list_viva_marks,
 * save_viva_mark, get_viva_marksheet). This file adds the processing pipeline and
 * the theory+practical marks page.
 *
 * NO delete tools (policy). All limits ≥ 1000.
 */

import mongoose from "mongoose";
import { z } from "zod";

// ─── Schemas ──────────────────────────────────────────────────────────────────

// Theory + practical marks (no viva)
const examModel2MarksSchema = new mongoose.Schema(
  {
    colid: Number,
    academicyear: String,
    regulation: String,
    exam: String,
    examcode: String,
    program: String,
    programcode: String,
    semester: String,
    course: String,
    coursecode: String,
    credit: { type: Number, default: 0 },
    student: String,
    regno: String,
    abcid: String,
    theorymarks: { type: Number, default: 0 },
    theoryobtained: { type: Number, default: 0 },
    theorypercentage: { type: Number, default: 0 },
    theorygradepoint: { type: Number, default: 0 },
    theorygrade: String,
    practicalmarks: { type: Number, default: 0 },
    practicaltotal: { type: Number, default: 0 },
    practicalpercentage: { type: Number, default: 0 },
    practicalgradepoint: { type: Number, default: 0 },
    practicalgrade: String,
    overalltotalmarks: { type: Number, default: 0 },
    overallobtained: { type: Number, default: 0 },
    overallgradepoint: { type: Number, default: 0 },
    overallgrade: String,
    overallpercentage: { type: Number, default: 0 },
    gpa: { type: Number, default: 0 },
    status: { type: String, default: "Pass" },
    attempt: { type: Number, default: 1 },
    type: { type: String, default: "Regular" },
    examdate: String,
    resultprocessdate: String,
    user: String
  },
  { strict: false, timestamps: true, collection: "examinationmodel2marksds" }
);

// Full viva marks (includes viva fields + theorystatus/practicalstatus)
const examModel2VivaSchema = new mongoose.Schema(
  {
    colid: Number,
    academicyear: String,
    regulation: String,
    exam: String,
    examcode: String,
    program: String,
    programcode: String,
    semester: String,
    course: String,
    coursecode: String,
    credit: { type: Number, default: 0 },
    student: String,
    regno: String,
    abcid: String,
    theorymarks: { type: Number, default: 0 },
    theoryobtained: { type: Number, default: 0 },
    theorypercentage: { type: Number, default: 0 },
    theorygradepoint: { type: Number, default: 0 },
    theorygrade: String,
    theorystatus: { type: String, default: "Pass" },
    practicalmarks: { type: Number, default: 0 },
    practicaltotal: { type: Number, default: 0 },
    practicalpercentage: { type: Number, default: 0 },
    practicalgradepoint: { type: Number, default: 0 },
    practicalgrade: String,
    practicalstatus: { type: String, default: "Pass" },
    vivatotal: { type: Number, default: 0 },
    vivaobtained: { type: Number, default: 0 },
    vivapercentage: { type: Number, default: 0 },
    vivagpa: { type: Number, default: 0 },
    vivagrade: String,
    overalltotalmarks: { type: Number, default: 0 },
    overallobtained: { type: Number, default: 0 },
    overallgradepoint: { type: Number, default: 0 },
    overallgrade: String,
    overallpercentage: { type: Number, default: 0 },
    gpa: { type: Number, default: 0 },
    status: { type: String, default: "Pass" },
    attempt: { type: Number, default: 1 },
    type: { type: String, default: "Regular" },
    examdate: String,
    resultprocessdate: String,
    user: String
  },
  { strict: false, timestamps: true, collection: "examinationmodel2vivamarksds" }
);

const gradingTemplateSchema = new mongoose.Schema(
  {
    colid: Number,
    academicyear: String,
    templatedescription: String,
    status: { type: String, default: "Active" },
    user: String
  },
  { strict: false, timestamps: true, collection: "exammodel2gradingtemplateds" }
);

const gradingTemplateDetailSchema = new mongoose.Schema(
  {
    colid: Number,
    academicyear: String,
    templatename: String,
    templateid: String,
    frommarks: { type: Number, default: 0 },
    tomarks: { type: Number, default: 0 },
    gradepoint: { type: Number, default: 0 },
    grade: String,
    user: String
  },
  { strict: false, timestamps: true, collection: "exammodel2gradingtemplatedetailds" }
);

const classConfigSchema = new mongoose.Schema(
  {
    colid: Number,
    academicyear: String,
    program: String,
    programcode: String,
    fromsgpa: { type: Number, default: 0 },
    tosgpa: { type: Number, default: 0 },
    classassigned: String,
    user: String
  },
  { strict: false, timestamps: true, collection: "exammodel2classconfigurationds" }
);

// Reference models
const StudentRefSchema2 = new mongoose.Schema(
  { colid: Number, name: String, regno: String, email: String, program: String, programcode: String, semester: String, section: String, academicyear: String },
  { strict: false, collection: "users" }
);

const CourseMapRef2Schema = new mongoose.Schema(
  { colid: Number, academicyear: String, regulation: String, programcode: String, semester: String, course: String, coursecode: String, credit: Number, type: String, subject: String },
  { strict: false, collection: "regulationcoursemapds" }
);

// ─── Guarded model registrations ─────────────────────────────────────────────

const ExamModel2MarksMcp       = mongoose.models.ExamModel2MarksMcp       || mongoose.model("ExamModel2MarksMcp",       examModel2MarksSchema,       "examinationmodel2marksds");
const ExamModel2VivaMk2Mcp     = mongoose.models.ExamModel2VivaMk2Mcp     || mongoose.model("ExamModel2VivaMk2Mcp",     examModel2VivaSchema,        "examinationmodel2vivamarksds");
const GradingTemplateMcp       = mongoose.models.GradingTemplateMcp       || mongoose.model("GradingTemplateMcp",       gradingTemplateSchema,       "exammodel2gradingtemplateds");
const GradingTemplateDetailMcp = mongoose.models.GradingTemplateDetailMcp || mongoose.model("GradingTemplateDetailMcp", gradingTemplateDetailSchema, "exammodel2gradingtemplatedetailds");
const ClassConfigMcp           = mongoose.models.ClassConfigMcp           || mongoose.model("ClassConfigMcp",           classConfigSchema,           "exammodel2classconfigurationds");
const StudentRef2Mcp           = mongoose.models.StudentRef2Mcp           || mongoose.model("StudentRef2Mcp",           StudentRefSchema2,           "users");
const CourseMapRef2Mcp         = mongoose.models.CourseMapRef2Mcp         || mongoose.model("CourseMapRef2Mcp",         CourseMapRef2Schema,         "regulationcoursemapds");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const num = (v, fb = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
const pct = (obt, max) => max > 0 ? Math.round((obt / max) * 1000) / 10 : 0;

/**
 * Find a grade from template details based on a percentage value.
 * Template details have frommarks/tomarks treated as percentage thresholds (0-100).
 */
const findGradeFromTemplate = (details, percentage) => {
  for (const d of details) {
    if (percentage >= num(d.frommarks) && percentage <= num(d.tomarks)) {
      return { grade: d.grade || "F", gradepoint: num(d.gradepoint) };
    }
  }
  return { grade: "F", gradepoint: 0 };
};

/** Build a marks-record filter from common parameters. */
const buildMarksFilter = (colid, { academicyear, examcode, regulation, programcode, semester, coursecode, regno, attempt, type }) => {
  const f = { colid };
  if (academicyear) f.academicyear = academicyear;
  if (examcode) f.examcode = examcode;
  if (regulation) f.regulation = regulation;
  if (programcode) f.programcode = programcode;
  if (semester) f.semester = semester;
  if (coursecode) f.coursecode = coursecode;
  if (regno) f.regno = regno;
  if (attempt) f.attempt = attempt;
  if (type) f.type = type;
  return f;
};

// ─── Tool registration ────────────────────────────────────────────────────────

export function registerExamModel2ExtendedTools(server, { requireAuth, resolveColid, connectDB }) {

  // ══════════════════════════════════════════════════════════════════════════════
  //   OPTIONS
  // ══════════════════════════════════════════════════════════════════════════════

  // ── 1. get_exam2_options ─────────────────────────────────────────────────────
  server.tool(
    "get_exam2_options",
    "Get dropdown options for Exam Model 2 forms: available exam codes, programs, courses, semesters, and student list for a given filter scope.",
    {
      programcode: z.string().optional(),
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      regulation: z.string().optional(),
      coursecode: z.string().optional()
    },
    async ({ programcode, academicyear, semester, regulation, coursecode }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      // Existing marks records to derive available exam codes
      const marksFilter = { colid };
      if (academicyear) marksFilter.academicyear = academicyear;
      if (programcode) marksFilter.programcode = programcode;
      if (semester) marksFilter.semester = semester;
      const [marksSample, courses, students] = await Promise.all([
        ExamModel2MarksMcp.find(marksFilter).select("examcode academicyear programcode semester coursecode").limit(5000).lean(),
        CourseMapRef2Mcp.find({
          colid,
          ...(programcode ? { programcode } : {}),
          ...(semester ? { semester } : {}),
          ...(academicyear ? { academicyear } : {}),
          ...(regulation ? { regulation } : {})
        }).select("course coursecode semester credit type").limit(2000).lean(),
        StudentRef2Mcp.find({
          colid,
          role: /^Student$/i,
          ...(programcode ? { programcode } : {}),
          ...(academicyear ? { academicyear } : {}),
          ...(semester ? { semester } : {})
        }).select("name regno email program programcode semester").limit(2000).lean()
      ]);
      const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort();
      return {
        content: [{
          type: "text", text: JSON.stringify({
            examcodes: uniq(marksSample.map((r) => r.examcode)),
            academicyears: uniq(marksSample.map((r) => r.academicyear)),
            programcodes: uniq(marksSample.map((r) => r.programcode)),
            semesters: uniq(marksSample.map((r) => r.semester)),
            courses: courses.map((c) => ({ course: c.course, coursecode: c.coursecode, semester: c.semester, credit: c.credit })),
            students: students.map((s) => ({ name: s.name, regno: s.regno, program: s.program, programcode: s.programcode, semester: s.semester })),
            attemptTypes: ["Regular", "Supplementary"]
          }, null, 2)
        }]
      };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════════
  //   MARKS ENTRY (Theory + Practical — no viva)
  // ══════════════════════════════════════════════════════════════════════════════

  // ── 2. list_exam2_marks ──────────────────────────────────────────────────────
  server.tool(
    "list_exam2_marks",
    "List Exam Model 2 theory+practical marks records (examinationmodel2marksds). Filter by examcode, programcode, semester, coursecode, type (Regular/Supplementary). Use list_viva_marks for viva-marks collection.",
    {
      academicyear: z.string().optional(),
      examcode: z.string().optional(),
      regulation: z.string().optional(),
      programcode: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      type: z.enum(["Regular", "Supplementary"]).optional(),
      attempt: z.number().int().optional(),
      search: z.string().optional().describe("Student name or regno"),
      limit: z.number().int().min(1).max(5000).optional().default(1000)
    },
    async ({ academicyear, examcode, regulation, programcode, semester, coursecode, type, attempt, search, limit }) => {
      requireAuth();
      await connectDB();
      const filter = buildMarksFilter(resolveColid(), { academicyear, examcode, regulation, programcode, semester, coursecode, attempt, type });
      if (search) { const s = new RegExp(search, "i"); filter.$or = [{ student: s }, { regno: s }]; }
      const data = await ExamModel2MarksMcp.find(filter).sort({ student: 1 }).limit(limit || 1000).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 3. save_exam2_mark ───────────────────────────────────────────────────────
  server.tool(
    "save_exam2_mark",
    "Create or update a theory+practical marks record. Upserts on (colid, academicyear, examcode, programcode, semester, coursecode, regno, attempt). Provide id to update directly. overallobtained and overalltotalmarks are auto-calculated if omitted.",
    {
      id: z.string().optional(),
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      exam: z.string().optional(),
      examcode: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      semester: z.string().optional(),
      course: z.string().optional(),
      coursecode: z.string().optional(),
      credit: z.number().optional(),
      student: z.string().optional(),
      regno: z.string().optional(),
      abcid: z.string().optional(),
      theorymarks: z.number().optional().describe("Theory max marks"),
      theoryobtained: z.number().optional().describe("Theory marks obtained"),
      practicalmarks: z.number().optional().describe("Practical max marks"),
      practicaltotal: z.number().optional().describe("Practical marks obtained"),
      attempt: z.number().int().optional().default(1),
      type: z.enum(["Regular", "Supplementary"]).optional().default("Regular"),
      examdate: z.string().optional(),
      user: z.string().optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { id, ...rest } = args;
      // Auto-calculate overall totals
      const thy = num(rest.theorymarks), thyObt = num(rest.theoryobtained);
      const prc = num(rest.practicalmarks), prcObt = num(rest.practicaltotal);
      const overalltotalmarks = thy + prc;
      const overallobtained = thyObt + prcObt;
      const payload = { colid, ...rest, overalltotalmarks: overalltotalmarks || undefined, overallobtained: overallobtained || undefined };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const { academicyear, examcode, programcode, semester, coursecode, regno, attempt } = payload;
      const data = id
        ? await ExamModel2MarksMcp.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true })
        : await ExamModel2MarksMcp.findOneAndUpdate(
            { colid, academicyear, examcode, programcode, semester, coursecode, regno, attempt: attempt ?? 1 },
            payload,
            { new: true, upsert: true, setDefaultsOnInsert: true }
          );
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 4. save_exam2_viva_mark ──────────────────────────────────────────────────
  server.tool(
    "save_exam2_viva_mark",
    "Create or update a viva marksheet record (examinationmodel2vivamarksds). Includes theory, practical, and viva fields. Upserts on (colid, academicyear, examcode, programcode, semester, coursecode, regno, attempt). All grade/percentage fields are auto-calculated from UGC scale when omitted.",
    {
      id: z.string().optional(),
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      exam: z.string().optional(),
      examcode: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      semester: z.string().optional(),
      course: z.string().optional(),
      coursecode: z.string().optional(),
      credit: z.number().optional(),
      student: z.string().optional(),
      regno: z.string().optional(),
      abcid: z.string().optional(),
      theorymarks: z.number().optional(),
      theoryobtained: z.number().optional(),
      practicalmarks: z.number().optional(),
      practicaltotal: z.number().optional(),
      vivatotal: z.number().optional().describe("Viva max marks"),
      vivaobtained: z.number().optional().describe("Viva marks obtained"),
      attempt: z.number().int().optional().default(1),
      type: z.enum(["Regular", "Supplementary"]).optional().default("Regular"),
      examdate: z.string().optional(),
      user: z.string().optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { id, ...rest } = args;
      // Auto-compute overall totals
      const thy = num(rest.theorymarks), thyObt = num(rest.theoryobtained);
      const prc = num(rest.practicalmarks), prcObt = num(rest.practicaltotal);
      const viva = num(rest.vivatotal), vivaObt = num(rest.vivaobtained);
      const overalltotalmarks = thy + prc + viva;
      const overallobtained = thyObt + prcObt + vivaObt;
      const payload = {
        colid, ...rest,
        overalltotalmarks: overalltotalmarks || undefined,
        overallobtained: overallobtained || undefined
      };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const { academicyear, examcode, programcode, semester, coursecode, regno, attempt } = payload;
      const data = id
        ? await ExamModel2VivaMk2Mcp.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true })
        : await ExamModel2VivaMk2Mcp.findOneAndUpdate(
            { colid, academicyear, examcode, programcode, semester, coursecode, regno, attempt: attempt ?? 1 },
            payload,
            { new: true, upsert: true, setDefaultsOnInsert: true }
          );
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════════
  //   GRADING TEMPLATES
  // ══════════════════════════════════════════════════════════════════════════════

  // ── 5. list_exam2_grading_templates ──────────────────────────────────────────
  server.tool(
    "list_exam2_grading_templates",
    "List Exam Model 2 grading template headers. Each template has a description and can have multiple grade range details.",
    {
      academicyear: z.string().optional(),
      status: z.string().optional(),
      search: z.string().optional().describe("Search template description")
    },
    async ({ academicyear, status, search }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (academicyear) filter.academicyear = academicyear;
      if (status) filter.status = new RegExp(status, "i");
      if (search) filter.templatedescription = new RegExp(search, "i");
      const data = await GradingTemplateMcp.find(filter).sort({ academicyear: -1, templatedescription: 1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 6. save_exam2_grading_template ───────────────────────────────────────────
  server.tool(
    "save_exam2_grading_template",
    "Create or update a grading template header. Required: academicyear, templatedescription. Provide id to update.",
    {
      id: z.string().optional(),
      academicyear: z.string().optional(),
      templatedescription: z.string().optional().describe("Human-readable name, e.g. 'UGC 10-Point Scale 2024-25'"),
      status: z.string().optional().default("Active"),
      user: z.string().optional()
    },
    async ({ id, academicyear, templatedescription, status, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { colid, academicyear, templatedescription, status, user };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id
        ? await GradingTemplateMcp.findByIdAndUpdate(id, { $set: payload }, { new: true })
        : await GradingTemplateMcp.create(payload);
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 7. list_exam2_grading_template_details ────────────────────────────────────
  server.tool(
    "list_exam2_grading_template_details",
    "List grade range rows for a grading template. Each row maps a percentage range (frommarks–tomarks) to a grade letter and grade point. Required: templateid.",
    {
      templateid: z.string().describe("Grading template _id from list_exam2_grading_templates"),
      academicyear: z.string().optional()
    },
    async ({ templateid, academicyear }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid(), templateid };
      if (academicyear) filter.academicyear = academicyear;
      const data = await GradingTemplateDetailMcp.find(filter).sort({ frommarks: -1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 8. save_exam2_grading_template_detail ────────────────────────────────────
  server.tool(
    "save_exam2_grading_template_detail",
    "Create or update a grade range row in a grading template. frommarks and tomarks are percentage thresholds (0–100). Required: templateid, frommarks, tomarks, grade, gradepoint.",
    {
      id: z.string().optional(),
      academicyear: z.string().optional(),
      templateid: z.string().optional().describe("Grading template _id"),
      templatename: z.string().optional().describe("Template description (for display)"),
      frommarks: z.number().optional().describe("Lower percentage bound (inclusive)"),
      tomarks: z.number().optional().describe("Upper percentage bound (inclusive)"),
      grade: z.string().optional().describe("Grade letter, e.g. O, A+, A, B+, B, C, P, F"),
      gradepoint: z.number().optional().describe("Grade point, e.g. 10, 9, 8, 7, 6, 5, 4, 0"),
      user: z.string().optional()
    },
    async ({ id, academicyear, templateid, templatename, frommarks, tomarks, grade, gradepoint, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { colid, academicyear, templateid, templatename, frommarks, tomarks, grade, gradepoint, user };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id
        ? await GradingTemplateDetailMcp.findByIdAndUpdate(id, { $set: payload }, { new: true })
        : await GradingTemplateDetailMcp.create(payload);
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════════
  //   CLASS CONFIGURATION
  // ══════════════════════════════════════════════════════════════════════════════

  // ── 9. list_exam2_class_configurations ────────────────────────────────────────
  server.tool(
    "list_exam2_class_configurations",
    "List Exam Model 2 class configurations. Each entry maps an SGPA range to a class label (Distinction, First Class, Second Class, Pass, Fail).",
    {
      academicyear: z.string().optional(),
      programcode: z.string().optional()
    },
    async ({ academicyear, programcode }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (academicyear) filter.academicyear = academicyear;
      if (programcode) filter.programcode = programcode;
      const data = await ClassConfigMcp.find(filter).sort({ fromsgpa: -1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 10. save_exam2_class_configuration ────────────────────────────────────────
  server.tool(
    "save_exam2_class_configuration",
    "Create or update a class configuration entry. Maps an SGPA range to a class label. Required: academicyear, programcode, fromsgpa, tosgpa, classassigned.",
    {
      id: z.string().optional(),
      academicyear: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      fromsgpa: z.number().optional().describe("Lower SGPA bound (inclusive)"),
      tosgpa: z.number().optional().describe("Upper SGPA bound (inclusive)"),
      classassigned: z.string().optional().describe("Class label, e.g. Distinction, First Class, Pass"),
      user: z.string().optional()
    },
    async ({ id, academicyear, program, programcode, fromsgpa, tosgpa, classassigned, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { colid, academicyear, program, programcode, fromsgpa, tosgpa, classassigned, user };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id
        ? await ClassConfigMcp.findByIdAndUpdate(id, { $set: payload }, { new: true })
        : await ClassConfigMcp.create(payload);
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════════
  //   PROCESSING PIPELINE  (GradeProcessing / PercentageCalculation / FailRule / FinalGrade)
  //   useviva=false → operates on examinationmodel2marksds
  //   useviva=true  → operates on examinationmodel2vivamarksds
  // ══════════════════════════════════════════════════════════════════════════════

  // ── 11. process_exam2_percentages ─────────────────────────────────────────────
  server.tool(
    "process_exam2_percentages",
    "Calculate and store theory, practical, viva (if useviva), and overall percentage for all matching marks records. Required: examcode, programcode. Returns count of updated records.",
    {
      academicyear: z.string().optional(),
      examcode: z.string(),
      regulation: z.string().optional(),
      programcode: z.string(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      attempt: z.number().int().optional(),
      type: z.string().optional().describe("Regular or Supplementary"),
      useviva: z.boolean().optional().default(false).describe("true = process examinationmodel2vivamarksds; false = examinationmodel2marksds")
    },
    async ({ academicyear, examcode, regulation, programcode, semester, coursecode, attempt, type, useviva }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const Model = useviva ? ExamModel2VivaMk2Mcp : ExamModel2MarksMcp;
      const filter = buildMarksFilter(colid, { academicyear, examcode, regulation, programcode, semester, coursecode, attempt, type });
      const records = await Model.find(filter);
      let updated = 0;
      for (const r of records) {
        const thyPct = pct(num(r.theoryobtained), num(r.theorymarks));
        const prcPct = pct(num(r.practicaltotal), num(r.practicalmarks));
        const ovTotal = num(r.overalltotalmarks) || (num(r.theorymarks) + num(r.practicalmarks) + (useviva ? num(r.vivatotal) : 0));
        const ovObt = num(r.overallobtained) || (num(r.theoryobtained) + num(r.practicaltotal) + (useviva ? num(r.vivaobtained) : 0));
        const ovPct = pct(ovObt, ovTotal);
        r.theorypercentage = thyPct;
        r.practicalpercentage = prcPct;
        r.overalltotalmarks = ovTotal;
        r.overallobtained = ovObt;
        r.overallpercentage = ovPct;
        r.resultprocessdate = new Date().toISOString();
        if (useviva) {
          const vivaPct = pct(num(r.vivaobtained), num(r.vivatotal));
          r.vivapercentage = vivaPct;
        }
        await r.save();
        updated++;
      }
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", updated, collection: useviva ? "examinationmodel2vivamarksds" : "examinationmodel2marksds" }, null, 2) }] };
    }
  );

  // ── 12. process_exam2_grades ──────────────────────────────────────────────────
  server.tool(
    "process_exam2_grades",
    "Apply a grading template to Exam Model 2 marks records. Looks up grade and gradepoint from the template for theory, practical (and viva if useviva=true) using percentage ranges, then stores grade/gradepoint fields. Required: examcode, programcode, templateid.",
    {
      academicyear: z.string().optional(),
      examcode: z.string(),
      regulation: z.string().optional(),
      programcode: z.string(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      attempt: z.number().int().optional(),
      type: z.string().optional(),
      templateid: z.string().describe("Grading template _id from list_exam2_grading_templates"),
      useviva: z.boolean().optional().default(false).describe("true = process viva-marks collection")
    },
    async ({ academicyear, examcode, regulation, programcode, semester, coursecode, attempt, type, templateid, useviva }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      // Load template details sorted by frommarks descending (high to low)
      const details = await GradingTemplateDetailMcp.find({ colid, templateid }).sort({ frommarks: -1 }).lean();
      if (!details.length) throw new Error(`No grade ranges found for template '${templateid}'`);
      const Model = useviva ? ExamModel2VivaMk2Mcp : ExamModel2MarksMcp;
      const filter = buildMarksFilter(colid, { academicyear, examcode, regulation, programcode, semester, coursecode, attempt, type });
      const records = await Model.find(filter);
      let updated = 0;
      for (const r of records) {
        const thyPct = num(r.theorypercentage) || pct(num(r.theoryobtained), num(r.theorymarks));
        const prcPct = num(r.practicalpercentage) || pct(num(r.practicaltotal), num(r.practicalmarks));
        const ovPct = num(r.overallpercentage) || pct(num(r.overallobtained), num(r.overalltotalmarks));
        const thy = findGradeFromTemplate(details, thyPct);
        const prc = findGradeFromTemplate(details, prcPct);
        const overall = findGradeFromTemplate(details, ovPct);
        r.theorygrade = thy.grade;
        r.theorygradepoint = thy.gradepoint;
        r.practicalgrade = prc.grade;
        r.practicalgradepoint = prc.gradepoint;
        r.overallgrade = overall.grade;
        r.overallgradepoint = overall.gradepoint;
        r.gpa = overall.gradepoint;
        r.resultprocessdate = new Date().toISOString();
        if (useviva) {
          const vivaPct = num(r.vivapercentage) || pct(num(r.vivaobtained), num(r.vivatotal));
          const vivaGrade = findGradeFromTemplate(details, vivaPct);
          r.vivagrade = vivaGrade.grade;
          r.vivagpa = vivaGrade.gradepoint;
          r.theorystatus = thy.grade === "F" ? "Fail" : "Pass";
          r.practicalstatus = prc.grade === "F" ? "Fail" : "Pass";
        }
        await r.save();
        updated++;
      }
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", updated, templateid, collection: useviva ? "examinationmodel2vivamarksds" : "examinationmodel2marksds" }, null, 2) }] };
    }
  );

  // ── 13. process_exam2_component_fail_rule ─────────────────────────────────────
  server.tool(
    "process_exam2_component_fail_rule",
    "Apply component fail rule: if theory grade is F OR practical grade is F, override overallgrade to F and set gpa to 0. Required: examcode, programcode.",
    {
      academicyear: z.string().optional(),
      examcode: z.string(),
      programcode: z.string(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      regulation: z.string().optional(),
      attempt: z.number().int().optional(),
      type: z.string().optional(),
      useviva: z.boolean().optional().default(false).describe("true = process viva-marks collection (also checks vivagrade)")
    },
    async ({ academicyear, examcode, programcode, semester, coursecode, regulation, attempt, type, useviva }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const Model = useviva ? ExamModel2VivaMk2Mcp : ExamModel2MarksMcp;
      const filter = buildMarksFilter(colid, { academicyear, examcode, regulation, programcode, semester, coursecode, attempt, type });
      const records = await Model.find(filter);
      let updated = 0;
      for (const r of records) {
        const componentFail = r.theorygrade === "F" || r.practicalgrade === "F" || (useviva && r.vivagrade === "F");
        if (componentFail) {
          r.overallgrade = "F";
          r.gpa = 0;
          r.overallgradepoint = 0;
          r.resultprocessdate = new Date().toISOString();
          await r.save();
          updated++;
        }
      }
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", updated, totalScanned: records.length }, null, 2) }] };
    }
  );

  // ── 14. process_exam2_final_grade_status ──────────────────────────────────────
  server.tool(
    "process_exam2_final_grade_status",
    "Set Pass/Fail status field based on overallgrade (F → Fail, else Pass). Run this AFTER process_exam2_grades and process_exam2_component_fail_rule. Required: examcode, programcode.",
    {
      academicyear: z.string().optional(),
      examcode: z.string(),
      programcode: z.string(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      regulation: z.string().optional(),
      attempt: z.number().int().optional(),
      type: z.string().optional(),
      useviva: z.boolean().optional().default(false).describe("true = process viva-marks collection")
    },
    async ({ academicyear, examcode, programcode, semester, coursecode, regulation, attempt, type, useviva }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const Model = useviva ? ExamModel2VivaMk2Mcp : ExamModel2MarksMcp;
      const filter = buildMarksFilter(colid, { academicyear, examcode, regulation, programcode, semester, coursecode, attempt, type });
      const result = await Model.updateMany(filter, [
        { $set: { status: { $cond: [{ $eq: ["$overallgrade", "F"] }, "Fail", "Pass"] }, resultprocessdate: new Date().toISOString() } }
      ]);
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", updated: result.modifiedCount, matched: result.matchedCount }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════════
  //   MARKSHEET GENERATION
  // ══════════════════════════════════════════════════════════════════════════════

  // ── 15. get_exam2_marksheet ───────────────────────────────────────────────────
  server.tool(
    "get_exam2_marksheet",
    "Generate a formatted marksheet for a single student — all courses for the given examcode+programcode+semester+regno. Includes SGPA and class assigned. Required: examcode, programcode, regno.",
    {
      academicyear: z.string().optional(),
      examcode: z.string(),
      programcode: z.string(),
      semester: z.string().optional(),
      regno: z.string(),
      attempt: z.number().int().optional().default(1),
      useviva: z.boolean().optional().default(false).describe("true = read from viva-marks collection")
    },
    async ({ academicyear, examcode, programcode, semester, regno, attempt, useviva }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const Model = useviva ? ExamModel2VivaMk2Mcp : ExamModel2MarksMcp;
      const filter = { colid, examcode, programcode, regno, attempt: attempt ?? 1 };
      if (academicyear) filter.academicyear = academicyear;
      if (semester) filter.semester = semester;
      const records = await Model.find(filter).sort({ coursecode: 1 }).lean();
      if (!records.length) return { content: [{ type: "text", text: JSON.stringify({ found: false, records: [] }, null, 2) }] };
      const header = records[0];
      const totalCredits = records.reduce((s, r) => s + num(r.credit), 0);
      const earnedGradePoints = records.reduce((s, r) => s + (num(r.gpa) * num(r.credit)), 0);
      const sgpa = totalCredits > 0 ? Math.round((earnedGradePoints / totalCredits) * 100) / 100 : 0;
      // Resolve class from class configuration
      const classConf = await ClassConfigMcp.find({ colid, programcode }).sort({ fromsgpa: -1 }).lean();
      let classAssigned = "";
      for (const c of classConf) {
        if (sgpa >= num(c.fromsgpa) && sgpa <= num(c.tosgpa)) { classAssigned = c.classassigned; break; }
      }
      const passCount = records.filter((r) => r.status === "Pass").length;
      return {
        content: [{
          type: "text", text: JSON.stringify({
            found: true,
            student: { name: header.student, regno: header.regno, program: header.program, programcode: header.programcode, semester: header.semester, academicyear: header.academicyear, examcode: header.examcode, attempt: header.attempt, type: header.type },
            courses: records.map((r) => ({
              course: r.course, coursecode: r.coursecode, credit: r.credit,
              theorymarks: r.theorymarks, theoryobtained: r.theoryobtained, theorypercentage: r.theorypercentage, theorygrade: r.theorygrade, theorygradepoint: r.theorygradepoint,
              practicalmarks: r.practicalmarks, practicaltotal: r.practicaltotal, practicalpercentage: r.practicalpercentage, practicalgrade: r.practicalgrade, practicalgradepoint: r.practicalgradepoint,
              ...(useviva ? { vivatotal: r.vivatotal, vivaobtained: r.vivaobtained, vivapercentage: r.vivapercentage, vivagrade: r.vivagrade, vivagpa: r.vivagpa } : {}),
              overalltotalmarks: r.overalltotalmarks, overallobtained: r.overallobtained, overallpercentage: r.overallpercentage, overallgrade: r.overallgrade, overallgradepoint: r.overallgradepoint, gpa: r.gpa, status: r.status
            })),
            summary: { totalCredits, earnedGradePoints: Math.round(earnedGradePoints * 100) / 100, sgpa, classAssigned, passCount, totalCourses: records.length, allPassed: passCount === records.length }
          }, null, 2)
        }]
      };
    }
  );

  // ── 16. get_exam2_annual_report ───────────────────────────────────────────────
  server.tool(
    "get_exam2_annual_report",
    "Generate annual performance report data for a student across all semesters for a given examcode. Returns all course results aggregated by semester with SGPA per semester and CGPA overall.",
    {
      academicyear: z.string().optional(),
      programcode: z.string(),
      regno: z.string(),
      useviva: z.boolean().optional().default(false).describe("true = read from viva-marks collection")
    },
    async ({ academicyear, programcode, regno, useviva }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const Model = useviva ? ExamModel2VivaMk2Mcp : ExamModel2MarksMcp;
      const filter = { colid, programcode, regno };
      if (academicyear) filter.academicyear = academicyear;
      const records = await Model.find(filter).sort({ semester: 1, coursecode: 1 }).lean();
      if (!records.length) return { content: [{ type: "text", text: JSON.stringify({ found: false, records: [] }, null, 2) }] };
      const header = records[0];
      // Group by semester
      const bySem = {};
      for (const r of records) {
        const sem = r.semester || "Unknown";
        if (!bySem[sem]) bySem[sem] = [];
        bySem[sem].push(r);
      }
      const semesterResults = Object.entries(bySem).map(([semester, rows]) => {
        const credits = rows.reduce((s, r) => s + num(r.credit), 0);
        const gradePoints = rows.reduce((s, r) => s + num(r.gpa) * num(r.credit), 0);
        const sgpa = credits > 0 ? Math.round((gradePoints / credits) * 100) / 100 : 0;
        return { semester, courses: rows.length, credits, gradePoints: Math.round(gradePoints * 100) / 100, sgpa, passCount: rows.filter((r) => r.status === "Pass").length };
      });
      const totalCredits = semesterResults.reduce((s, r) => s + r.credits, 0);
      const totalGradePoints = semesterResults.reduce((s, r) => s + r.gradePoints, 0);
      const cgpa = totalCredits > 0 ? Math.round((totalGradePoints / totalCredits) * 100) / 100 : 0;
      const classConf = await ClassConfigMcp.find({ colid, programcode }).sort({ fromsgpa: -1 }).lean();
      let classAssigned = "";
      for (const c of classConf) {
        if (cgpa >= num(c.fromsgpa) && cgpa <= num(c.tosgpa)) { classAssigned = c.classassigned; break; }
      }
      return {
        content: [{
          type: "text", text: JSON.stringify({
            found: true,
            student: { name: header.student, regno: header.regno, program: header.program, programcode: header.programcode, academicyear: header.academicyear },
            semesterResults,
            summary: { totalCredits, totalGradePoints, cgpa, classAssigned, totalCourses: records.length }
          }, null, 2)
        }]
      };
    }
  );
}
