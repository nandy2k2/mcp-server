/**
 * exam-misc-tools.js
 *
 * MCP tools covering:
 *   disciplinaryaction / disciplinaryactionupdate  → disciplinaryactionds
 *   online-examination / online-exam-responses / online-exam-report
 *                                                  → onlineexamds, onlineexamattemptds
 *   neplmsmindmaps                                 → neplmsmindmapds
 *   assessmentcomponent                            → assessmentcomponentds
 *   passmarkconfiguration                          → passmarksconfigurationds
 *   exammodel2-component-marks-crud                → exammodel2componentmarksds
 *   exammodel2-interim-marks-transfer              → (same models, transfer operation)
 *   exammodel2viva-marksheet / exammodel2viva-marksheet-marks
 *                                                  → examinationmodel2vivamarksds
 *
 * All unique model names have an "Mcp" suffix to avoid conflicts.
 * NO delete tools (policy).
 */

import mongoose from "mongoose";
import { z } from "zod";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const disciplinarySchema = new mongoose.Schema(
  {
    colid: Number,
    academicyear: String,
    regulation: String,
    program: String,
    programcode: String,
    semester: String,
    section: String,
    student: String,
    regno: String,
    email: String,
    phone: String,
    actiondate: Date,
    severity: { type: String, default: "Low" },
    description: String,
    actiontaken: String,
    actiontakendate: Date,
    status: { type: String, default: "Open" },
    user: String
  },
  { strict: false, timestamps: true, collection: "disciplinaryactionds" }
);

const onlineExamSchema = new mongoose.Schema(
  {
    colid: Number,
    academicyear: String,
    program: String,
    programcode: String,
    course: String,
    coursecode: String,
    examname: String,
    examcode: String,
    durationminutes: { type: Number, default: 60 },
    starttime: Date,
    endtime: Date,
    timezone: String,
    instructions: String,
    status: { type: String, default: "Draft" },
    sections: [
      {
        sectionname: String,
        sectiontype: String,
        instructions: String,
        order: Number,
        questions: [
          {
            questiontext: String,
            questiontype: String,
            marks: Number,
            options: [{ optiontext: String, iscorrect: Boolean }],
            imageurl: String,
            fileurl: String,
            linkurl: String,
            order: Number
          }
        ]
      }
    ],
    user: String,
    username: String
  },
  { strict: false, timestamps: true, collection: "onlineexamds" }
);

const onlineExamAttemptSchema = new mongoose.Schema(
  {
    colid: Number,
    examid: String,
    examname: String,
    examcode: String,
    academicyear: String,
    program: String,
    programcode: String,
    course: String,
    coursecode: String,
    student: String,
    email: String,
    regno: String,
    starttime: Date,
    submittime: Date,
    status: { type: String, default: "Started" },
    autosubmitted: { type: String, default: "No" },
    submitreason: String,
    remainingseconds: Number,
    totalmarks: Number,
    marksobtained: Number,
    grade: String,
    comments: String,
    answers: [
      {
        sectionid: String,
        questionid: String,
        selectedoptionid: String,
        selectedoptiontext: String,
        answertext: String,
        maxmarks: Number,
        marksobtained: Number,
        grade: String,
        comments: String,
        gradingstatus: { type: String, default: "Pending" }
      }
    ]
  },
  { strict: false, timestamps: true, collection: "onlineexamattemptds" }
);

const mindMapSchema = new mongoose.Schema(
  {
    colid: Number,
    title: String,
    description: String,
    academicyear: String,
    regulation: String,
    program: String,
    programcode: String,
    type: String,
    subject: String,
    semester: String,
    course: String,
    coursecode: String,
    classid: String,
    classdate: String,
    classtime: String,
    faculty: String,
    facultyemail: String,
    nodes: { type: [mongoose.Schema.Types.Mixed], default: [] },
    edges: { type: [mongoose.Schema.Types.Mixed], default: [] },
    status: { type: String, default: "Draft" },
    published: { type: String, default: "No" },
    publisheddate: Date,
    user: String
  },
  { strict: false, timestamps: true, collection: "neplmsmindmapds" }
);

const assessmentComponentSchema = new mongoose.Schema(
  {
    colid: Number,
    academicyear: String,
    regulation: String,
    program: String,
    programcode: String,
    type: { type: String },
    subject: String,
    semester: String,
    course: String,
    coursecode: String,
    assessmentgroup: String,
    grouptype: String,
    scoretype: String,
    componenttype: String,
    assessmentcomponent: String,
    marks: Number,
    passmarks: Number,
    weightage: Number,
    credits: Number,
    status: String,
    user: String
  },
  { strict: false, timestamps: true, collection: "assessmentcomponentds" }
);

const passMarksSchema = new mongoose.Schema(
  {
    colid: Number,
    academicyear: String,
    regulation: String,
    program: String,
    programcode: String,
    course: String,
    coursecode: String,
    component: String,
    maxmarks: Number,
    passmarks: Number,
    passpercentage: Number,
    status: String,
    user: String
  },
  { strict: false, timestamps: true, collection: "passmarksconfigurationds" }
);

const componentMarksSchema = new mongoose.Schema(
  {
    colid: Number,
    academicyear: String,
    exam: String,
    examcode: String,
    regulation: String,
    program: String,
    programcode: String,
    course: String,
    coursecode: String,
    student: String,
    regno: String,
    examrollno: String,
    componenttype: String,
    scoretype: String,
    assessmentgroup: String,
    assessmentgrouptype: String,
    assessmentcomponent: String,
    maxmarks: Number,
    marksobtained: Number,
    credits: Number,
    examinername: String,
    examineremail: String,
    submissionstatus: { type: String, default: "Draft" },
    submitteddate: Date,
    submittedby: String,
    user: String
  },
  { strict: false, timestamps: true, collection: "exammodel2componentmarksds" }
);

const vivaMarksSchema = new mongoose.Schema(
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
    credit: Number,
    student: String,
    regno: String,
    abcid: String,
    theorymarks: Number,
    theoryobtained: Number,
    theorypercentage: Number,
    theorygradepoint: Number,
    theorygrade: String,
    theorystatus: String,
    practicalmarks: Number,
    practicaltotal: Number,
    practicalpercentage: Number,
    practicalgradepoint: Number,
    practicalgrade: String,
    practicalstatus: String,
    vivatotal: Number,
    vivaobtained: Number,
    vivapercentage: Number,
    vivagpa: Number,
    vivagrade: String,
    overalltotalmarks: Number,
    overallobtained: Number,
    overallgradepoint: Number,
    overallgrade: String,
    overallpercentage: Number,
    gpa: Number,
    status: String,
    attempt: { type: Number, default: 1 },
    type: { type: String, default: "Regular" },
    examdate: Date,
    resultprocessdate: Date,
    user: String
  },
  { strict: false, timestamps: true, collection: "examinationmodel2vivamarksds" }
);

const userExamMcpSchema = new mongoose.Schema(
  { name: String, email: String, role: String, program: String, programcode: String, semester: String, section: String, academicyear: String, regno: String, phone: String, colid: Number },
  { strict: false, collection: "users" }
);

// ─── Guarded model registrations ─────────────────────────────────────────────

const DisciplinaryActionMcp  = mongoose.models.DisciplinaryActionMcp  || mongoose.model("DisciplinaryActionMcp",  disciplinarySchema,       "disciplinaryactionds");
const OnlineExamMcp          = mongoose.models.OnlineExamMcp          || mongoose.model("OnlineExamMcp",          onlineExamSchema,         "onlineexamds");
const OnlineExamAttemptMcp   = mongoose.models.OnlineExamAttemptMcp   || mongoose.model("OnlineExamAttemptMcp",   onlineExamAttemptSchema,  "onlineexamattemptds");
const MindMapMcp             = mongoose.models.MindMapMcp             || mongoose.model("MindMapMcp",             mindMapSchema,            "neplmsmindmapds");
const AssessmentComponentMcp = mongoose.models.AssessmentComponentMcp || mongoose.model("AssessmentComponentMcp", assessmentComponentSchema,"assessmentcomponentds");
const PassMarksMcp           = mongoose.models.PassMarksMcp           || mongoose.model("PassMarksMcp",           passMarksSchema,          "passmarksconfigurationds");
const ComponentMarksMcp      = mongoose.models.ComponentMarksMcp      || mongoose.model("ComponentMarksMcp",      componentMarksSchema,     "exammodel2componentmarksds");
const VivaMarksMcp           = mongoose.models.VivaMarksMcp           || mongoose.model("VivaMarksMcp",           vivaMarksSchema,          "examinationmodel2vivamarksds");
const UserExamMcp            = mongoose.models.UserExamMcp            || mongoose.model("UserExamMcp",            userExamMcpSchema,        "users");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const num = (v, fb = 0) => { const p = Number(v); return Number.isFinite(p) ? p : fb; };
const rx = (s) => new RegExp(String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

/** UGC grade scale (Exam Model 2). */
const ugcGrade = (pct) => {
  if (pct >= 90) return { grade: "O",  gradepoint: 10 };
  if (pct >= 80) return { grade: "A+", gradepoint: 9 };
  if (pct >= 70) return { grade: "A",  gradepoint: 8 };
  if (pct >= 60) return { grade: "B+", gradepoint: 7 };
  if (pct >= 50) return { grade: "B",  gradepoint: 6 };
  if (pct >= 40) return { grade: "C",  gradepoint: 5 };
  if (pct >= 36) return { grade: "P",  gradepoint: 4 };
  return { grade: "F", gradepoint: 0 };
};

/** Auto-grade an MCQ exam attempt (modifies attempt object in-place). */
const autoGradeMcq = (exam, attempt) => {
  const sectionMap = {};
  for (const s of (exam.sections || [])) {
    sectionMap[String(s._id)] = s;
    for (const q of (s.questions || [])) {
      q._sectionId = String(s._id);
    }
  }
  let total = 0, obtained = 0;
  for (const ans of (attempt.answers || [])) {
    const sec = sectionMap[String(ans.sectionid)];
    if (!sec) continue;
    const q = (sec.questions || []).find((x) => String(x._id) === String(ans.questionid));
    if (!q) continue;
    const maxmarks = num(q.marks, 0);
    total += maxmarks;
    if (q.questiontype === "MCQ" || q.questiontype === "Multiple Choice") {
      const correct = (q.options || []).find((o) => o.iscorrect);
      if (correct && String(correct._id) === String(ans.selectedoptionid)) {
        ans.marksobtained = maxmarks;
        ans.gradingstatus = "Graded";
        obtained += maxmarks;
      } else {
        ans.marksobtained = 0;
        ans.gradingstatus = "Graded";
      }
    } else {
      ans.gradingstatus = "Pending";
    }
    ans.maxmarks = maxmarks;
  }
  attempt.totalmarks = total;
  attempt.marksobtained = obtained;
  const pct = total > 0 ? (obtained / total) * 100 : 0;
  attempt.grade = ugcGrade(pct).grade;
};

// ─── Tool registration ────────────────────────────────────────────────────────

export function registerExamMiscTools(server, { requireAuth, resolveColid, connectDB }) {

  // ══════════════════════════════════════════════════════════════════════════════
  //   DISCIPLINARY MODULE
  // ══════════════════════════════════════════════════════════════════════════════

  // ── 1. get_disciplinary_options ──────────────────────────────────────────────
  server.tool(
    "get_disciplinary_options",
    "Get filter-option lists for disciplinary action pages: academic years, programs, severities, statuses.",
    {},
    async () => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const raw = await DisciplinaryActionMcp.find({ colid }).select("academicyear program programcode semester").lean();
      const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort();
      return {
        content: [{
          type: "text", text: JSON.stringify({
            academicyears: uniq(raw.map((r) => r.academicyear)),
            programs: uniq(raw.map((r) => r.program)),
            programcodes: uniq(raw.map((r) => r.programcode)),
            semesters: uniq(raw.map((r) => r.semester)),
            severities: ["Low", "Medium", "High", "Critical"],
            statuses: ["Open", "InProgress", "Closed", "Appealed"]
          }, null, 2)
        }]
      };
    }
  );

  // ── 2. search_students_for_disciplinary ─────────────────────────────────────
  server.tool(
    "search_students_for_disciplinary",
    "Search students to attach to a new disciplinary action. Filter by program, semester, or name/regno.",
    {
      academicyear: z.string().optional(),
      programcode: z.string().optional(),
      semester: z.string().optional(),
      section: z.string().optional(),
      search: z.string().optional().describe("Student name or registration number")
    },
    async ({ academicyear, programcode, semester, section, search }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid(), role: /^Student$/i };
      if (academicyear) filter.academicyear = academicyear;
      if (programcode) filter.programcode = programcode;
      if (semester) filter.semester = semester;
      if (section) filter.section = section;
      if (search) { const s = rx(search); filter.$or = [{ name: s }, { regno: s }]; }
      const data = await UserExamMcp.find(filter).select("name email regno phone program programcode semester section academicyear").sort({ name: 1 }).limit(1000).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 3. create_disciplinary_action ────────────────────────────────────────────
  server.tool(
    "create_disciplinary_action",
    "Record a new disciplinary action against a student. Status is always 'Open' on creation. Required: regno, actiondate, severity, description.",
    {
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      semester: z.string().optional(),
      section: z.string().optional(),
      student: z.string().optional().describe("Student full name"),
      regno: z.string(),
      email: z.string().optional(),
      phone: z.string().optional(),
      actiondate: z.string().describe("ISO date of the incident"),
      severity: z.enum(["Low", "Medium", "High", "Critical"]).optional().default("Low"),
      description: z.string().describe("Description of the incident"),
      actiontaken: z.string().optional(),
      actiontakendate: z.string().optional().describe("ISO date"),
      user: z.string().optional()
    },
    async ({ academicyear, regulation, program, programcode, semester, section, student, regno, email, phone, actiondate, severity, description, actiontaken, actiontakendate, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const person = await UserExamMcp.findOne({ colid, $or: [{ regno }, { email: email || "" }] }).lean();
      const data = await DisciplinaryActionMcp.create({
        colid,
        academicyear: academicyear || person?.academicyear || "",
        regulation: regulation || "",
        program: program || person?.program || "",
        programcode: programcode || person?.programcode || "",
        semester: semester || person?.semester || "",
        section: section || person?.section || "",
        student: student || person?.name || "",
        regno: person?.regno || regno,
        email: email || person?.email || "",
        phone: phone || person?.phone || "",
        actiondate: new Date(actiondate),
        severity: severity || "Low",
        description,
        actiontaken: actiontaken || "",
        actiontakendate: actiontakendate ? new Date(actiontakendate) : undefined,
        status: "Open",
        user: user || ""
      });
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 4. list_disciplinary_actions ─────────────────────────────────────────────
  server.tool(
    "list_disciplinary_actions",
    "List disciplinary actions with multi-value filters. Supports arrays for academicyear, programcode, semester, section, severity, status.",
    {
      academicyears: z.array(z.string()).optional(),
      programcodes: z.array(z.string()).optional(),
      semesters: z.array(z.string()).optional(),
      sections: z.array(z.string()).optional(),
      severities: z.array(z.string()).optional(),
      statuses: z.array(z.string()).optional(),
      search: z.string().optional().describe("Name or regno"),
      limit: z.number().int().min(1).max(2000).optional().default(1000)
    },
    async ({ academicyears, programcodes, semesters, sections, severities, statuses, search, limit }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (academicyears?.length) filter.academicyear = { $in: academicyears };
      if (programcodes?.length) filter.programcode = { $in: programcodes };
      if (semesters?.length) filter.semester = { $in: semesters };
      if (sections?.length) filter.section = { $in: sections };
      if (severities?.length) filter.severity = { $in: severities };
      if (statuses?.length) filter.status = { $in: statuses };
      if (search) { const s = rx(search); filter.$or = [{ student: s }, { regno: s }]; }
      const data = await DisciplinaryActionMcp.find(filter).sort({ actiondate: -1 }).limit(limit || 1000).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 5. update_disciplinary_action ────────────────────────────────────────────
  server.tool(
    "update_disciplinary_action",
    "Update the action taken, date, and/or status for an existing disciplinary record. Required: id. Only actiontaken, actiontakendate, and status are updatable.",
    {
      id: z.string().describe("Disciplinary action _id"),
      actiontaken: z.string().optional(),
      actiontakendate: z.string().optional().describe("ISO date"),
      status: z.enum(["Open", "InProgress", "Closed", "Appealed"]).optional(),
      user: z.string().optional()
    },
    async ({ id, actiontaken, actiontakendate, status, user }) => {
      requireAuth();
      await connectDB();
      const update = {};
      if (actiontaken !== undefined) update.actiontaken = actiontaken;
      if (actiontakendate) update.actiontakendate = new Date(actiontakendate);
      if (status) update.status = status;
      if (user) update.user = user;
      const data = await DisciplinaryActionMcp.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
      if (!data) throw new Error("Disciplinary action not found");
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════════
  //   ONLINE EXAM MODULE
  // ══════════════════════════════════════════════════════════════════════════════

  // ── 6. list_online_exams ─────────────────────────────────────────────────────
  server.tool(
    "list_online_exams",
    "List online exams (instructor/admin view). Filter by programcode, coursecode, status, or examname.",
    {
      academicyear: z.string().optional(),
      programcode: z.string().optional(),
      coursecode: z.string().optional(),
      examname: z.string().optional(),
      examcode: z.string().optional(),
      status: z.string().optional().describe("Draft, Published, Closed"),
      user: z.string().optional().describe("Filter by instructor email (user field)")
    },
    async ({ academicyear, programcode, coursecode, examname, examcode, status, user }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (academicyear) filter.academicyear = academicyear;
      if (programcode) filter.programcode = programcode;
      if (coursecode) filter.coursecode = coursecode;
      if (examname) filter.examname = rx(examname);
      if (examcode) filter.examcode = rx(examcode);
      if (status) filter.status = rx(status);
      if (user) filter.user = user;
      const data = await OnlineExamMcp.find(filter).select("-sections.questions.options").sort({ createdAt: -1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 7. save_online_exam ──────────────────────────────────────────────────────
  server.tool(
    "save_online_exam",
    "Create or update an online exam header (excluding sections — use save_exam_section for those). Required for create: examname, programcode, coursecode. Provide id to update.",
    {
      id: z.string().optional(),
      academicyear: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      course: z.string().optional(),
      coursecode: z.string().optional(),
      examname: z.string().optional(),
      examcode: z.string().optional(),
      durationminutes: z.number().int().optional().default(60),
      starttime: z.string().optional().describe("ISO datetime"),
      endtime: z.string().optional().describe("ISO datetime"),
      timezone: z.string().optional().default("Asia/Kolkata"),
      instructions: z.string().optional(),
      status: z.enum(["Draft", "Published", "Closed"]).optional().default("Draft"),
      user: z.string().optional(),
      username: z.string().optional()
    },
    async ({ id, academicyear, program, programcode, course, coursecode, examname, examcode, durationminutes, starttime, endtime, timezone, instructions, status, user, username }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { colid, academicyear, program, programcode, course, coursecode, examname, examcode, durationminutes, starttime: starttime ? new Date(starttime) : undefined, endtime: endtime ? new Date(endtime) : undefined, timezone, instructions, status, user, username };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id
        ? await OnlineExamMcp.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true })
        : await OnlineExamMcp.create(payload);
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 8. save_exam_section ─────────────────────────────────────────────────────
  server.tool(
    "save_exam_section",
    "Add or replace a section in an online exam. Provide sectionid to update an existing section. Required: examid, sectionname.",
    {
      examid: z.string(),
      sectionid: z.string().optional().describe("Section sub-document _id to update; omit to add new"),
      sectionname: z.string().optional(),
      sectiontype: z.string().optional().describe("MCQ, Descriptive, Mixed"),
      instructions: z.string().optional(),
      order: z.number().int().optional()
    },
    async ({ examid, sectionid, sectionname, sectiontype, instructions, order }) => {
      requireAuth();
      await connectDB();
      const exam = await OnlineExamMcp.findOne({ _id: examid, colid: resolveColid() });
      if (!exam) throw new Error("Exam not found");
      if (sectionid) {
        const sec = exam.sections.id(sectionid);
        if (!sec) throw new Error("Section not found");
        if (sectionname !== undefined) sec.sectionname = sectionname;
        if (sectiontype !== undefined) sec.sectiontype = sectiontype;
        if (instructions !== undefined) sec.instructions = instructions;
        if (order !== undefined) sec.order = order;
      } else {
        exam.sections.push({ sectionname, sectiontype, instructions, order: order ?? exam.sections.length + 1, questions: [] });
      }
      await exam.save();
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data: exam }, null, 2) }] };
    }
  );

  // ── 9. save_exam_question ────────────────────────────────────────────────────
  server.tool(
    "save_exam_question",
    "Add or update a question inside a section. Provide questionid to update. Required: examid, sectionid, questiontext, questiontype, marks. For MCQ, provide options array with {optiontext, iscorrect}.",
    {
      examid: z.string(),
      sectionid: z.string(),
      questionid: z.string().optional(),
      questiontext: z.string().optional(),
      questiontype: z.enum(["MCQ", "Descriptive", "File Upload", "Short Answer"]).optional().default("MCQ"),
      marks: z.number().optional(),
      options: z.array(z.object({ optiontext: z.string(), iscorrect: z.boolean() })).optional(),
      imageurl: z.string().optional(),
      linkurl: z.string().optional(),
      order: z.number().int().optional()
    },
    async ({ examid, sectionid, questionid, questiontext, questiontype, marks, options, imageurl, linkurl, order }) => {
      requireAuth();
      await connectDB();
      const exam = await OnlineExamMcp.findOne({ _id: examid, colid: resolveColid() });
      if (!exam) throw new Error("Exam not found");
      const sec = exam.sections.id(sectionid);
      if (!sec) throw new Error("Section not found");
      if (questionid) {
        const q = sec.questions.id(questionid);
        if (!q) throw new Error("Question not found");
        if (questiontext !== undefined) q.questiontext = questiontext;
        if (questiontype !== undefined) q.questiontype = questiontype;
        if (marks !== undefined) q.marks = marks;
        if (options !== undefined) q.options = options;
        if (imageurl !== undefined) q.imageurl = imageurl;
        if (linkurl !== undefined) q.linkurl = linkurl;
        if (order !== undefined) q.order = order;
      } else {
        sec.questions.push({ questiontext, questiontype: questiontype || "MCQ", marks, options: options || [], imageurl, linkurl, order: order ?? sec.questions.length + 1 });
      }
      await exam.save();
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data: exam }, null, 2) }] };
    }
  );

  // ── 10. list_online_exam_responses ───────────────────────────────────────────
  server.tool(
    "list_online_exam_responses",
    "List online exam attempts (admin/instructor view). Filter by examid, examcode, programcode, coursecode, status, autosubmitted.",
    {
      examid: z.string().optional(),
      examcode: z.string().optional(),
      programcode: z.string().optional(),
      coursecode: z.string().optional(),
      academicyear: z.string().optional(),
      status: z.string().optional().describe("Started, Submitted, Graded"),
      autosubmitted: z.string().optional().describe("Yes or No"),
      search: z.string().optional().describe("Student name or regno"),
      limit: z.number().int().min(1).max(2000).optional().default(1000)
    },
    async ({ examid, examcode, programcode, coursecode, academicyear, status, autosubmitted, search, limit }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (examid) filter.examid = examid;
      if (examcode) filter.examcode = examcode;
      if (programcode) filter.programcode = programcode;
      if (coursecode) filter.coursecode = coursecode;
      if (academicyear) filter.academicyear = academicyear;
      if (status) filter.status = rx(status);
      if (autosubmitted) filter.autosubmitted = autosubmitted;
      if (search) { const s = rx(search); filter.$or = [{ student: s }, { regno: s }]; }
      const data = await OnlineExamAttemptMcp.find(filter).sort({ submittime: -1 }).limit(limit || 1000).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 11. grade_exam_attempt ────────────────────────────────────────────────────
  server.tool(
    "grade_exam_attempt",
    "Manually grade descriptive answers in an exam attempt. Provide attemptid and answer_grades array. Each entry: {answerindex (0-based), marksobtained, comments}. Overall grade is auto-calculated after grading.",
    {
      attemptid: z.string(),
      answer_grades: z.array(z.object({
        answerindex: z.number().int().describe("0-based index into attempt.answers array"),
        marksobtained: z.number(),
        comments: z.string().optional()
      })),
      user: z.string().optional()
    },
    async ({ attemptid, answer_grades, user }) => {
      requireAuth();
      await connectDB();
      const attempt = await OnlineExamAttemptMcp.findOne({ _id: attemptid, colid: resolveColid() });
      if (!attempt) throw new Error("Attempt not found");
      for (const g of answer_grades) {
        const ans = attempt.answers[g.answerindex];
        if (!ans) continue;
        ans.marksobtained = g.marksobtained;
        ans.gradingstatus = "Graded";
        if (g.comments) ans.comments = g.comments;
      }
      const total = attempt.answers.reduce((s, a) => s + num(a.maxmarks), 0);
      const obtained = attempt.answers.reduce((s, a) => s + num(a.marksobtained), 0);
      attempt.totalmarks = total;
      attempt.marksobtained = obtained;
      const pct = total > 0 ? (obtained / total) * 100 : 0;
      attempt.grade = ugcGrade(pct).grade;
      attempt.status = "Graded";
      await attempt.save();
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data: attempt, totalmarks: total, marksobtained: obtained, grade: attempt.grade }, null, 2) }] };
    }
  );

  // ── 12. get_online_exam_report ────────────────────────────────────────────────
  server.tool(
    "get_online_exam_report",
    "Get a summary report for an online exam: total attempted, submitted, auto-submitted, average score, grade distribution, and per-exam breakdown.",
    {
      examid: z.string().optional(),
      examcode: z.string().optional(),
      programcode: z.string().optional(),
      coursecode: z.string().optional(),
      academicyear: z.string().optional()
    },
    async ({ examid, examcode, programcode, coursecode, academicyear }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (examid) filter.examid = examid;
      if (examcode) filter.examcode = examcode;
      if (programcode) filter.programcode = programcode;
      if (coursecode) filter.coursecode = coursecode;
      if (academicyear) filter.academicyear = academicyear;
      const attempts = await OnlineExamAttemptMcp.find(filter).lean();
      const total = attempts.length;
      const submitted = attempts.filter((a) => a.status === "Submitted" || a.status === "Graded").length;
      const autosubmitted = attempts.filter((a) => a.autosubmitted === "Yes").length;
      const graded = attempts.filter((a) => a.status === "Graded");
      const avgScore = graded.length > 0 ? graded.reduce((s, a) => s + num(a.marksobtained), 0) / graded.length : 0;
      const gradeDist = {};
      for (const a of graded) { gradeDist[a.grade || "?"] = (gradeDist[a.grade || "?"] || 0) + 1; }
      const gradeDistData = Object.entries(gradeDist).map(([grade, count]) => ({ grade, count })).sort((a, b) => a.grade.localeCompare(b.grade));
      // Per-exam breakdown
      const examBreakdown = {};
      for (const a of attempts) {
        const key = a.examcode || a.examid;
        if (!examBreakdown[key]) examBreakdown[key] = { examname: a.examname, examcode: a.examcode, total: 0, submitted: 0, avgScore: 0, scores: [] };
        examBreakdown[key].total++;
        if (a.status === "Submitted" || a.status === "Graded") examBreakdown[key].submitted++;
        if (a.marksobtained != null) examBreakdown[key].scores.push(num(a.marksobtained));
      }
      for (const v of Object.values(examBreakdown)) {
        v.avgScore = v.scores.length ? v.scores.reduce((s, x) => s + x, 0) / v.scores.length : 0;
        delete v.scores;
      }
      return { content: [{ type: "text", text: JSON.stringify({ cards: { total, submitted, autosubmitted, avgScore: avgScore.toFixed(2) }, gradeDistribution: gradeDistData, examBreakdown: Object.values(examBreakdown) }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════════
  //   NEP LMS MIND MAPS
  // ══════════════════════════════════════════════════════════════════════════════

  // ── 13. list_mind_maps ────────────────────────────────────────────────────────
  server.tool(
    "list_mind_maps",
    "List mind maps. Faculty: filter by facultyemail to see own maps. Students: only published=Yes maps are relevant. Filter by programcode, coursecode, status, published.",
    {
      facultyemail: z.string().optional(),
      academicyear: z.string().optional(),
      programcode: z.string().optional(),
      coursecode: z.string().optional(),
      semester: z.string().optional(),
      status: z.string().optional().describe("Draft or Published"),
      published: z.string().optional().describe("Yes or No"),
      search: z.string().optional().describe("Title or subject")
    },
    async ({ facultyemail, academicyear, programcode, coursecode, semester, status, published, search }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (facultyemail) filter.facultyemail = facultyemail.toLowerCase();
      if (academicyear) filter.academicyear = academicyear;
      if (programcode) filter.programcode = programcode;
      if (coursecode) filter.coursecode = coursecode;
      if (semester) filter.semester = semester;
      if (status) filter.status = rx(status);
      if (published) filter.published = published;
      if (search) { const s = rx(search); filter.$or = [{ title: s }, { subject: s }]; }
      const data = await MindMapMcp.find(filter).select("-nodes -edges").sort({ updatedAt: -1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 14. get_mind_map ─────────────────────────────────────────────────────────
  server.tool(
    "get_mind_map",
    "Get a single mind map with full nodes and edges. Required: id.",
    { id: z.string() },
    async ({ id }) => {
      requireAuth();
      await connectDB();
      const data = await MindMapMcp.findOne({ _id: id, colid: resolveColid() }).lean();
      if (!data) throw new Error("Mind map not found");
      return { content: [{ type: "text", text: JSON.stringify({ data }, null, 2) }] };
    }
  );

  // ── 15. save_mind_map ────────────────────────────────────────────────────────
  server.tool(
    "save_mind_map",
    "Create or update a mind map. Provide id to update. Nodes and edges are ReactFlow format arrays. Setting published='Yes' makes it visible to students and records publisheddate.",
    {
      id: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      type: z.string().optional(),
      subject: z.string().optional(),
      semester: z.string().optional(),
      course: z.string().optional(),
      coursecode: z.string().optional(),
      classid: z.string().optional(),
      classdate: z.string().optional(),
      classtime: z.string().optional(),
      faculty: z.string().optional(),
      facultyemail: z.string().optional(),
      nodes: z.array(z.record(z.unknown())).optional().describe("ReactFlow node objects"),
      edges: z.array(z.record(z.unknown())).optional().describe("ReactFlow edge objects"),
      status: z.enum(["Draft", "Published"]).optional().default("Draft"),
      published: z.enum(["Yes", "No"]).optional().default("No"),
      user: z.string().optional()
    },
    async ({ id, title, description, academicyear, regulation, program, programcode, type, subject, semester, course, coursecode, classid, classdate, classtime, faculty, facultyemail, nodes, edges, status, published, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { colid, title, description, academicyear, regulation, program, programcode, type, subject, semester, course, coursecode, classid, classdate, classtime, faculty, facultyemail: facultyemail?.toLowerCase(), nodes, edges, status, published, user };
      if (published === "Yes") payload.publisheddate = new Date();
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id
        ? await MindMapMcp.findOneAndUpdate({ _id: id, colid }, { $set: payload }, { new: true, runValidators: true })
        : await MindMapMcp.create(payload);
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════════
  //   ASSESSMENT COMPONENT MODULE
  // ══════════════════════════════════════════════════════════════════════════════

  // ── 16. list_assessment_components ───────────────────────────────────────────
  server.tool(
    "list_assessment_components",
    "List assessment component definitions. Filter by academicyear, programcode, coursecode, componenttype, scoretype.",
    {
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      programcode: z.string().optional(),
      coursecode: z.string().optional(),
      semester: z.string().optional(),
      type: z.string().optional().describe("Major or Minor"),
      componenttype: z.string().optional().describe("Theory, Practical, Viva"),
      scoretype: z.string().optional().describe("Internal or External"),
      status: z.string().optional()
    },
    async ({ academicyear, regulation, programcode, coursecode, semester, type, componenttype, scoretype, status }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (academicyear) filter.academicyear = academicyear;
      if (regulation) filter.regulation = regulation;
      if (programcode) filter.programcode = programcode;
      if (coursecode) filter.coursecode = coursecode;
      if (semester) filter.semester = semester;
      if (type) filter.type = type;
      if (componenttype) filter.componenttype = componenttype;
      if (scoretype) filter.scoretype = scoretype;
      if (status) filter.status = rx(status);
      const data = await AssessmentComponentMcp.find(filter).sort({ assessmentcomponent: 1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 17. save_assessment_component ────────────────────────────────────────────
  server.tool(
    "save_assessment_component",
    "Create or update an assessment component definition. Provide id to update an existing record.",
    {
      id: z.string().optional(),
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      type: z.enum(["Major", "Minor"]).optional(),
      subject: z.string().optional(),
      semester: z.string().optional(),
      course: z.string().optional(),
      coursecode: z.string().optional(),
      assessmentgroup: z.string().optional(),
      grouptype: z.enum(["Best", "Average"]).optional(),
      scoretype: z.enum(["Internal", "External"]).optional(),
      componenttype: z.enum(["Theory", "Practical", "Viva"]).optional(),
      assessmentcomponent: z.string().optional(),
      marks: z.number().optional(),
      passmarks: z.number().optional(),
      weightage: z.number().optional(),
      credits: z.number().optional(),
      status: z.string().optional(),
      user: z.string().optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { id, ...rest } = args;
      const payload = { colid, ...rest };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id
        ? await AssessmentComponentMcp.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true })
        : await AssessmentComponentMcp.create(payload);
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════════
  //   PASS MARKS CONFIGURATION MODULE
  // ══════════════════════════════════════════════════════════════════════════════

  // ── 18. list_pass_mark_configurations ────────────────────────────────────────
  server.tool(
    "list_pass_mark_configurations",
    "List pass mark configurations by regulation, program, course, and component. Unique per (colid, academicyear, regulation, programcode, coursecode, component).",
    {
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      programcode: z.string().optional(),
      coursecode: z.string().optional(),
      component: z.string().optional().describe("Theory, Practical, or Viva"),
      status: z.string().optional()
    },
    async ({ academicyear, regulation, programcode, coursecode, component, status }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (academicyear) filter.academicyear = academicyear;
      if (regulation) filter.regulation = regulation;
      if (programcode) filter.programcode = programcode;
      if (coursecode) filter.coursecode = coursecode;
      if (component) filter.component = component;
      if (status) filter.status = rx(status);
      const data = await PassMarksMcp.find(filter).sort({ programcode: 1, coursecode: 1, component: 1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 19. save_pass_mark_configuration ─────────────────────────────────────────
  server.tool(
    "save_pass_mark_configuration",
    "Create or update a pass mark rule. Upserts on (colid, academicyear, regulation, programcode, coursecode, component). Required: academicyear, regulation, programcode, coursecode, component, maxmarks, passmarks.",
    {
      id: z.string().optional(),
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      course: z.string().optional(),
      coursecode: z.string().optional(),
      component: z.enum(["Theory", "Practical", "Viva"]).optional(),
      maxmarks: z.number().optional(),
      passmarks: z.number().optional(),
      passpercentage: z.number().optional(),
      status: z.string().optional(),
      user: z.string().optional()
    },
    async ({ id, academicyear, regulation, program, programcode, course, coursecode, component, maxmarks, passmarks, passpercentage, status, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      // Auto-calculate passpercentage if not provided
      const pct = passpercentage ?? (maxmarks && passmarks ? Math.round((passmarks / maxmarks) * 100 * 10) / 10 : undefined);
      const payload = { colid, academicyear, regulation, program, programcode, course, coursecode, component, maxmarks, passmarks, passpercentage: pct, status, user };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id
        ? await PassMarksMcp.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true })
        : await PassMarksMcp.findOneAndUpdate({ colid, academicyear, regulation, programcode, coursecode, component }, payload, { new: true, upsert: true, setDefaultsOnInsert: true });
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════════
  //   EXAM MODEL 2 — COMPONENT MARKS (CRUD + INTERIM TRANSFER)
  // ══════════════════════════════════════════════════════════════════════════════

  // ── 20. list_component_marks ─────────────────────────────────────────────────
  server.tool(
    "list_component_marks",
    "List Exam Model 2 component marks. Filter by examcode, programcode, coursecode, componenttype, assessmentcomponent, submissionstatus. Use for both the CRUD page and interim transfer source review.",
    {
      academicyear: z.string().optional(),
      examcode: z.string().optional(),
      regulation: z.string().optional(),
      programcode: z.string().optional(),
      coursecode: z.string().optional(),
      componenttype: z.string().optional().describe("Theory, Practical, or Viva"),
      scoretype: z.string().optional(),
      assessmentgroup: z.string().optional(),
      assessmentcomponent: z.string().optional(),
      submissionstatus: z.string().optional().describe("Draft or Submitted"),
      search: z.string().optional().describe("Student name or regno"),
      limit: z.number().int().min(1).max(5000).optional().default(1000)
    },
    async ({ academicyear, examcode, regulation, programcode, coursecode, componenttype, scoretype, assessmentgroup, assessmentcomponent, submissionstatus, search, limit }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (academicyear) filter.academicyear = academicyear;
      if (examcode) filter.examcode = examcode;
      if (regulation) filter.regulation = regulation;
      if (programcode) filter.programcode = programcode;
      if (coursecode) filter.coursecode = coursecode;
      if (componenttype) filter.componenttype = componenttype;
      if (scoretype) filter.scoretype = scoretype;
      if (assessmentgroup) filter.assessmentgroup = assessmentgroup;
      if (assessmentcomponent) filter.assessmentcomponent = assessmentcomponent;
      if (submissionstatus) filter.submissionstatus = submissionstatus;
      if (search) { const s = rx(search); filter.$or = [{ student: s }, { regno: s }]; }
      const data = await ComponentMarksMcp.find(filter).sort({ student: 1, assessmentcomponent: 1 }).limit(limit || 1000).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 21. save_component_mark ──────────────────────────────────────────────────
  server.tool(
    "save_component_mark",
    "Create or update a single student component mark. Upserts on (colid, academicyear, examcode, regulation, programcode, coursecode, regno, componenttype, assessmentgroup, assessmentcomponent). Provide id to update directly.",
    {
      id: z.string().optional(),
      academicyear: z.string().optional(),
      exam: z.string().optional(),
      examcode: z.string().optional(),
      regulation: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      course: z.string().optional(),
      coursecode: z.string().optional(),
      student: z.string().optional(),
      regno: z.string().optional(),
      examrollno: z.string().optional(),
      componenttype: z.string().optional().describe("Theory, Practical, or Viva"),
      scoretype: z.string().optional().describe("Internal or External"),
      assessmentgroup: z.string().optional(),
      assessmentgrouptype: z.string().optional().describe("Best or Average"),
      assessmentcomponent: z.string().optional(),
      maxmarks: z.number().optional(),
      marksobtained: z.number().optional(),
      credits: z.number().optional(),
      examinername: z.string().optional(),
      examineremail: z.string().optional(),
      submissionstatus: z.enum(["Draft", "Submitted"]).optional().default("Draft"),
      user: z.string().optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { id, ...rest } = args;
      const payload = { colid, ...rest };
      if (payload.submissionstatus === "Submitted") { payload.submitteddate = new Date(); payload.submittedby = payload.user || ""; }
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const { academicyear, examcode, regulation, programcode, coursecode, regno, componenttype, assessmentgroup, assessmentcomponent } = payload;
      const data = id
        ? await ComponentMarksMcp.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true })
        : await ComponentMarksMcp.findOneAndUpdate({ colid, academicyear, examcode, regulation, programcode, coursecode, regno, componenttype, assessmentgroup, assessmentcomponent }, payload, { new: true, upsert: true, setDefaultsOnInsert: true });
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 22. transfer_interim_marks ────────────────────────────────────────────────
  server.tool(
    "transfer_interim_marks",
    "Exam Model 2 Interim Marks Transfer: aggregate component marks for a course/exam into viva marksheet records (examinationmodel2vivamarksds). Applies Best/Average grouptype logic and UGC grading. Required: academicyear, examcode, programcode, coursecode.",
    {
      academicyear: z.string(),
      exam: z.string().optional(),
      examcode: z.string(),
      regulation: z.string().optional(),
      programcode: z.string(),
      semester: z.string().optional(),
      coursecode: z.string(),
      user: z.string().optional()
    },
    async ({ academicyear, exam, examcode, regulation, programcode, semester, coursecode, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      // Get all submitted marks for this exam/course
      const marks = await ComponentMarksMcp.find({ colid, academicyear, examcode, programcode, coursecode }).lean();
      if (!marks.length) throw new Error("No component marks found for this selection");
      // Group by regno
      const byRegno = {};
      for (const m of marks) {
        if (!byRegno[m.regno]) byRegno[m.regno] = { student: m.student, regno: m.regno, examrollno: m.examrollno, credits: m.credits, theory: {}, practical: {}, viva: {}, course: m.course, program: m.program };
        const comp = String(m.componenttype || "Theory").toLowerCase();
        const group = m.assessmentgroup || "G1";
        if (!byRegno[m.regno][comp][group]) byRegno[m.regno][comp][group] = { items: [], grouptype: m.assessmentgrouptype || "Best" };
        byRegno[m.regno][comp][group].items.push({ component: m.assessmentcomponent, maxmarks: num(m.maxmarks), marksobtained: num(m.marksobtained) });
      }
      const results = [];
      for (const [regno, rec] of Object.entries(byRegno)) {
        // Aggregate each type
        const aggregate = (groups) => {
          if (!Object.keys(groups).length) return { total: 0, obtained: 0 };
          let totalMax = 0, totalObt = 0;
          for (const [, grp] of Object.entries(groups)) {
            if (grp.grouptype === "Best") {
              const best = grp.items.reduce((b, it) => it.marksobtained > b.marksobtained ? it : b, grp.items[0]);
              totalMax += best?.maxmarks || 0;
              totalObt += best?.marksobtained || 0;
            } else {
              const sumMax = grp.items.reduce((s, it) => s + it.maxmarks, 0);
              const sumObt = grp.items.reduce((s, it) => s + it.marksobtained, 0);
              const avg = grp.items.length ? sumObt / grp.items.length : 0;
              totalMax += sumMax / (grp.items.length || 1);
              totalObt += avg;
            }
          }
          return { total: Math.round(totalMax * 10) / 10, obtained: Math.round(totalObt * 10) / 10 };
        };
        const thy = aggregate(rec.theory);
        const prc = aggregate(rec.practical);
        const viva = aggregate(rec.viva);
        const pct = (t, o) => t > 0 ? Math.round((o / t) * 1000) / 10 : 0;
        const thyPct = pct(thy.total, thy.obtained);
        const prcPct = pct(prc.total, prc.obtained);
        const vivaPct = pct(viva.total, viva.obtained);
        const overallTotal = thy.total + prc.total + viva.total;
        const overallObt = thy.obtained + prc.obtained + viva.obtained;
        const overallPct = pct(overallTotal, overallObt);
        const { grade: overallGrade, gradepoint: overallGp } = ugcGrade(overallPct);
        const vivaGpa = ugcGrade(vivaPct).gradepoint;
        const doc = await VivaMarksMcp.findOneAndUpdate(
          { colid, academicyear, examcode, programcode, coursecode, regno },
          {
            $set: {
              colid, academicyear, regulation: regulation || "", exam: exam || examcode, examcode,
              program: rec.program || "", programcode, semester: semester || "", course: rec.course || "", coursecode,
              credit: num(rec.credits, 0), student: rec.student || "", regno, abcid: "", examrollno: rec.examrollno || "",
              theorymarks: thy.total, theoryobtained: thy.obtained, theorypercentage: thyPct, theorygradepoint: ugcGrade(thyPct).gradepoint, theorygrade: ugcGrade(thyPct).grade, theorystatus: ugcGrade(thyPct).grade === "F" ? "Fail" : "Pass",
              practicalmarks: prc.total, practicaltotal: prc.obtained, practicalpercentage: prcPct, practicalgradepoint: ugcGrade(prcPct).gradepoint, practicalgrade: ugcGrade(prcPct).grade, practicalstatus: ugcGrade(prcPct).grade === "F" ? "Fail" : "Pass",
              vivatotal: viva.total, vivaobtained: viva.obtained, vivapercentage: vivaPct, vivagpa: vivaGpa, vivagrade: ugcGrade(vivaPct).grade,
              overalltotalmarks: overallTotal, overallobtained: overallObt, overallgradepoint: overallGp, overallgrade: overallGrade, overallpercentage: overallPct, gpa: overallGp,
              status: overallGrade === "F" ? "Fail" : "Pass", resultprocessdate: new Date(), user: user || ""
            }
          },
          { new: true, upsert: true }
        );
        results.push(doc);
      }
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", transferred: results.length, data: results }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════════
  //   EXAM MODEL 2 — VIVA MARKSHEET
  // ══════════════════════════════════════════════════════════════════════════════

  // ── 23. list_viva_marks ───────────────────────────────────────────────────────
  server.tool(
    "list_viva_marks",
    "List Exam Model 2 viva marksheet records. Use for exammodel2viva-marksheet page. Filter by examcode, programcode, coursecode, semester.",
    {
      academicyear: z.string().optional(),
      examcode: z.string().optional(),
      programcode: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      status: z.string().optional().describe("Pass or Fail"),
      search: z.string().optional().describe("Student name or regno"),
      limit: z.number().int().min(1).max(5000).optional().default(1000)
    },
    async ({ academicyear, examcode, programcode, semester, coursecode, status, search, limit }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (academicyear) filter.academicyear = academicyear;
      if (examcode) filter.examcode = examcode;
      if (programcode) filter.programcode = programcode;
      if (semester) filter.semester = semester;
      if (coursecode) filter.coursecode = coursecode;
      if (status) filter.status = status;
      if (search) { const s = rx(search); filter.$or = [{ student: s }, { regno: s }]; }
      const data = await VivaMarksMcp.find(filter).sort({ student: 1 }).limit(limit || 1000).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 24. save_viva_mark ────────────────────────────────────────────────────────
  server.tool(
    "save_viva_mark",
    "Create or update a viva marksheet record directly (for exammodel2viva-marksheet-marks page where individual marks are entered manually rather than via transfer). Upserts on (colid, academicyear, examcode, programcode, semester, coursecode, regno, attempt).",
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
      vivatotal: z.number().optional(),
      vivaobtained: z.number().optional(),
      attempt: z.number().int().optional().default(1),
      type: z.enum(["Regular", "Backlog", "Repeat"]).optional().default("Regular"),
      examdate: z.string().optional().describe("ISO date"),
      user: z.string().optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { id, examdate, ...rest } = args;
      // Auto-compute grades if marks are provided
      const thy = { total: num(rest.theorymarks), obtained: num(rest.theoryobtained) };
      const prc = { total: num(rest.practicalmarks), obtained: num(rest.practicaltotal) };
      const viva = { total: num(rest.vivatotal), obtained: num(rest.vivaobtained) };
      const pct = (t, o) => t > 0 ? Math.round((o / t) * 1000) / 10 : 0;
      const thyPct = pct(thy.total, thy.obtained);
      const prcPct = pct(prc.total, prc.obtained);
      const vivaPct = pct(viva.total, viva.obtained);
      const overallTotal = thy.total + prc.total + viva.total;
      const overallObt = thy.obtained + prc.obtained + viva.obtained;
      const overallPct = pct(overallTotal, overallObt);
      const { grade: overallGrade, gradepoint: overallGp } = ugcGrade(overallPct);
      const computed = {
        theorypercentage: thyPct, theorygradepoint: ugcGrade(thyPct).gradepoint, theorygrade: ugcGrade(thyPct).grade, theorystatus: ugcGrade(thyPct).grade === "F" ? "Fail" : "Pass",
        practicalpercentage: prcPct, practicalgradepoint: ugcGrade(prcPct).gradepoint, practicalgrade: ugcGrade(prcPct).grade, practicalstatus: ugcGrade(prcPct).grade === "F" ? "Fail" : "Pass",
        vivapercentage: vivaPct, vivagpa: ugcGrade(vivaPct).gradepoint, vivagrade: ugcGrade(vivaPct).grade,
        overalltotalmarks: overallTotal, overallobtained: overallObt, overallgradepoint: overallGp, overallgrade: overallGrade, overallpercentage: overallPct, gpa: overallGp,
        status: overallGrade === "F" ? "Fail" : "Pass"
      };
      const payload = { colid, ...rest, ...computed, examdate: examdate ? new Date(examdate) : undefined };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const { academicyear, examcode, programcode, semester, coursecode, regno, attempt } = payload;
      const data = id
        ? await VivaMarksMcp.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true })
        : await VivaMarksMcp.findOneAndUpdate({ colid, academicyear, examcode, programcode, semester, coursecode, regno, attempt: attempt ?? 1 }, payload, { new: true, upsert: true, setDefaultsOnInsert: true });
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 25. get_viva_marksheet ────────────────────────────────────────────────────
  server.tool(
    "get_viva_marksheet",
    "Generate a formatted viva marksheet report for a set of students. Returns all viva marks with SGPA (single course GPA) sorted by grade. Required: examcode, programcode, coursecode.",
    {
      academicyear: z.string().optional(),
      examcode: z.string(),
      programcode: z.string(),
      semester: z.string().optional(),
      coursecode: z.string(),
      attempt: z.number().int().optional().default(1)
    },
    async ({ academicyear, examcode, programcode, semester, coursecode, attempt }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid(), examcode, programcode, coursecode, attempt: attempt ?? 1 };
      if (academicyear) filter.academicyear = academicyear;
      if (semester) filter.semester = semester;
      const records = await VivaMarksMcp.find(filter).sort({ student: 1 }).lean();
      if (!records.length) return { content: [{ type: "text", text: JSON.stringify({ records: [], summary: {}, total: 0 }, null, 2) }] };
      const gradeOrder = { "O": 0, "A+": 1, "A": 2, "B+": 3, "B": 4, "C": 5, "P": 6, "F": 7 };
      records.sort((a, b) => (gradeOrder[a.overallgrade] ?? 9) - (gradeOrder[b.overallgrade] ?? 9));
      const summary = {
        total: records.length,
        pass: records.filter((r) => r.status === "Pass").length,
        fail: records.filter((r) => r.status === "Fail").length,
        avgGpa: records.length ? Math.round(records.reduce((s, r) => s + num(r.gpa), 0) / records.length * 100) / 100 : 0,
        gradeDistribution: {}
      };
      for (const r of records) { summary.gradeDistribution[r.overallgrade || "?"] = (summary.gradeDistribution[r.overallgrade || "?"] || 0) + 1; }
      return { content: [{ type: "text", text: JSON.stringify({ records, summary, total: records.length }, null, 2) }] };
    }
  );
}
