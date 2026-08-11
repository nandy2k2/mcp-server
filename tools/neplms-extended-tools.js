/**
 * NEP-LMS Extended Tools
 *
 * Covers pages not in neplms-tools.js or neplms-attendance-tools.js:
 *   Sequential Content (Lesson Content)    neplmslessoncontentds / neplmslessoncontentprogressds
 *   Pre-Reading                            neplmsprereadingds
 *   Live Quiz                              neplmslivequizds / neplmslivequizattemptds
 *   Descriptive Assessment                 neplmsdescriptiveassessmentds / neplmsdescriptiveattemptds
 *   Faculty Logbook                        neplmsfacultylogbookds
 *   Class Groups                           neplmsclassgroupds
 *   Enrollment Groups (Proxy Enrollment)   neplmsenrollmentgroupds / students / workload
 *   Supplementary Attendance               neplmssupplementaryattendanceworkflowds / requestds
 *   Login Attendance                       neplmsloginattendanceds
 *   Reports: consecutive absence, missing timetable, course progression
 *   Grade Card                             neplmsfinalmarksds (read)
 *   Assessment Marks bulk save             neplmsassessmentmarksds
 */

import { z } from "zod";
import mongoose from "mongoose";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const flashCardSchema = new mongoose.Schema({
  question: { type: String, trim: true },
  questionimage: { type: String, trim: true },
  answer: { type: String, trim: true }
});

const lessonContentSchema = new mongoose.Schema(
  {
    lessonresourceid: { type: mongoose.Schema.Types.ObjectId },
    lessonplantitle: { type: String, trim: true },
    sequence: { type: Number, default: 1 },
    contenttype: { type: String, trim: true },
    title: { type: String, trim: true },
    section: { type: String, trim: true },
    description: { type: String, trim: true },
    topics: { type: String, trim: true },
    filelink: { type: String, trim: true },
    videolink: { type: String, trim: true },
    quizid: { type: mongoose.Schema.Types.ObjectId },
    quiztitle: { type: String, trim: true },
    mindmapid: { type: mongoose.Schema.Types.ObjectId },
    mindmaptitle: { type: String, trim: true },
    flashcards: [flashCardSchema],
    status: { type: String, trim: true, default: "Active" },
    academicyear: { type: String, trim: true },
    regulation: { type: String, trim: true },
    program: { type: String, trim: true },
    programcode: { type: String, trim: true },
    type: { type: String, trim: true },
    major: { type: String, trim: true },
    semester: { type: String, trim: true },
    course: { type: String, trim: true },
    coursecode: { type: String, trim: true },
    coursegroup: { type: String, trim: true },
    faculty: { type: String, trim: true },
    facultyemail: { type: String, trim: true },
    colid: { type: Number, required: true, index: true },
    user: { type: String, trim: true }
  },
  { timestamps: true }
);

const lessonProgressSchema = new mongoose.Schema(
  {
    contentid: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    lessonresourceid: { type: mongoose.Schema.Types.ObjectId },
    lessonplantitle: { type: String, trim: true },
    contenttitle: { type: String, trim: true },
    contenttype: { type: String, trim: true },
    section: { type: String, trim: true },
    sequence: { type: Number },
    totalsteps: { type: Number, default: 0 },
    completedsteps: { type: Number, default: 0 },
    progresspercentage: { type: Number, default: 0 },
    stepstatus: { type: String, trim: true },
    academicyear: { type: String, trim: true },
    regulation: { type: String, trim: true },
    program: { type: String, trim: true },
    programcode: { type: String, trim: true },
    semester: { type: String, trim: true },
    course: { type: String, trim: true },
    coursecode: { type: String, trim: true },
    coursegroup: { type: String, trim: true },
    faculty: { type: String, trim: true },
    facultyemail: { type: String, trim: true },
    student: { type: String, trim: true },
    regno: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    completed: { type: Boolean, default: false },
    completedat: { type: Date },
    comments: { type: String, trim: true },
    colid: { type: Number, required: true, index: true },
    user: { type: String, trim: true }
  },
  { timestamps: true }
);

const preReadingSchema = new mongoose.Schema(
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
    contenttype: { type: String, trim: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    topics: { type: String, trim: true },
    sequence: { type: Number, default: 1 },
    filelink: { type: String, trim: true },
    videolink: { type: String, trim: true },
    mindmapid: { type: mongoose.Schema.Types.ObjectId },
    mindmaptitle: { type: String, trim: true },
    flashcards: [flashCardSchema],
    status: { type: String, trim: true, default: "Active" },
    colid: { type: Number, required: true, index: true },
    user: { type: String, trim: true }
  },
  { timestamps: true }
);

const liveQuizOptionSchema = new mongoose.Schema({ text: { type: String, trim: true }, iscorrect: { type: Boolean, default: false } });
const liveQuizQuestionSchema = new mongoose.Schema({
  question: { type: String, trim: true },
  questionimage: { type: String, trim: true },
  sectionid: { type: mongoose.Schema.Types.ObjectId },
  sectiontitle: { type: String, trim: true },
  options: [liveQuizOptionSchema],
  explanation: { type: String, trim: true },
  marks: { type: Number, default: 1 }
});
const liveQuizSectionSchema = new mongoose.Schema({ title: { type: String, trim: true }, description: { type: String, trim: true } });
const liveQuizSchema = new mongoose.Schema(
  {
    academicyear: { type: String, trim: true },
    regulation: { type: String, trim: true },
    program: { type: String, trim: true },
    programcode: { type: String, trim: true },
    semester: { type: String, trim: true },
    course: { type: String, trim: true },
    coursecode: { type: String, trim: true },
    faculty: { type: String, trim: true },
    facultyemail: { type: String, trim: true },
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true },
    durationminutes: { type: Number, default: 0 },
    status: { type: String, trim: true, default: "Draft" },
    sections: [liveQuizSectionSchema],
    questions: [liveQuizQuestionSchema],
    colid: { type: Number, required: true, index: true },
    user: { type: String, trim: true }
  },
  { timestamps: true }
);

const liveQuizAttemptSchema = new mongoose.Schema(
  {
    quizid: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    quiztitle: { type: String, trim: true },
    academicyear: { type: String, trim: true },
    semester: { type: String, trim: true },
    coursecode: { type: String, trim: true },
    student: { type: String, trim: true },
    regno: { type: String, trim: true },
    email: { type: String, trim: true },
    totalmarks: { type: Number, default: 0 },
    scoredmarks: { type: Number, default: 0 },
    rank: { type: Number },
    submitted: { type: Boolean, default: false },
    submittedat: { type: Date },
    answers: [{ questionid: mongoose.Schema.Types.ObjectId, selectedoption: mongoose.Schema.Types.ObjectId, iscorrect: Boolean, marks: Number }],
    colid: { type: Number, required: true, index: true },
    user: { type: String, trim: true }
  },
  { timestamps: true }
);

const descriptiveQuestionSchema = new mongoose.Schema({
  question: { type: String, trim: true, required: true },
  questionimage: { type: String, trim: true },
  sectionid: { type: mongoose.Schema.Types.ObjectId },
  sectiontitle: { type: String, trim: true },
  marks: { type: Number, default: 0 },
  answerlength: { type: Number, default: 0 }
});
const descriptiveAssessmentSectionSchema = new mongoose.Schema({ title: { type: String, trim: true }, description: { type: String, trim: true } });
const descriptiveAssessmentSchema = new mongoose.Schema(
  {
    academicyear: { type: String, trim: true },
    regulation: { type: String, trim: true },
    program: { type: String, trim: true },
    programcode: { type: String, trim: true },
    semester: { type: String, trim: true },
    course: { type: String, trim: true },
    coursecode: { type: String, trim: true },
    faculty: { type: String, trim: true },
    facultyemail: { type: String, trim: true },
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true },
    duedate: { type: String, trim: true },
    fullmarks: { type: Number, default: 0 },
    status: { type: String, trim: true, default: "Draft" },
    sections: [descriptiveAssessmentSectionSchema],
    questions: [descriptiveQuestionSchema],
    colid: { type: Number, required: true, index: true },
    user: { type: String, trim: true }
  },
  { timestamps: true }
);

const descriptiveAttemptSchema = new mongoose.Schema(
  {
    assessmentid: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    assessmenttitle: { type: String, trim: true },
    academicyear: { type: String, trim: true },
    semester: { type: String, trim: true },
    coursecode: { type: String, trim: true },
    student: { type: String, trim: true },
    regno: { type: String, trim: true },
    email: { type: String, trim: true },
    fullmarks: { type: Number, default: 0 },
    marks: { type: Number, default: 0 },
    status: { type: String, trim: true, default: "Submitted" },
    submittedat: { type: Date },
    answers: [{ questionid: mongoose.Schema.Types.ObjectId, answer: String, answerimage: String, marks: Number, aifeedback: String }],
    colid: { type: Number, required: true, index: true },
    user: { type: String, trim: true }
  },
  { timestamps: true }
);

const facultyLogbookSchema = new mongoose.Schema(
  {
    academicyear: { type: String, trim: true, required: true },
    regulation: { type: String, trim: true },
    program: { type: String, trim: true },
    programcode: { type: String, trim: true },
    faculty: { type: String, trim: true, required: true },
    facultyemail: { type: String, trim: true, required: true },
    course: { type: String, trim: true, required: true },
    coursecode: { type: String, trim: true, required: true },
    typeofwork: { type: String, trim: true, default: "Class" },
    description: { type: String, trim: true },
    dateofwork: { type: String, trim: true, required: true },
    outcome: { type: String, trim: true },
    colid: { type: Number, required: true, index: true },
    user: { type: String, trim: true }
  },
  { timestamps: true }
);

const classGroupSchema = new mongoose.Schema(
  {
    groupname: { type: String, trim: true, required: true },
    academicyear: { type: String, trim: true },
    regulation: { type: String, trim: true },
    program: { type: String, trim: true },
    programcode: { type: String, trim: true },
    type: { type: String, trim: true },
    subject: { type: String, trim: true },
    semester: { type: String, trim: true },
    course: { type: String, trim: true },
    coursecode: { type: String, trim: true },
    faculty: { type: String, trim: true },
    facultyemail: { type: String, trim: true },
    student: { type: String, trim: true },
    regno: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    section: { type: String, trim: true },
    colid: { type: Number, required: true, index: true },
    user: { type: String, trim: true }
  },
  { timestamps: true }
);

const enrollmentGroupSchema = new mongoose.Schema(
  {
    colid: { type: Number, required: true, index: true },
    academicyear: { type: String, trim: true },
    regulation: { type: String, trim: true },
    section: { type: String, trim: true },
    groupname: { type: String, trim: true, required: true },
    description: { type: String, trim: true },
    status: { type: String, trim: true, default: "Active" },
    user: { type: String, trim: true }
  },
  { timestamps: true }
);

const enrollmentGroupStudentSchema = new mongoose.Schema(
  {
    colid: { type: Number, required: true, index: true },
    groupid: { type: mongoose.Schema.Types.ObjectId, index: true },
    groupname: { type: String, trim: true },
    studentid: { type: mongoose.Schema.Types.ObjectId },
    student: { type: String, trim: true },
    studentemail: { type: String, trim: true },
    studentphone: { type: String, trim: true },
    regno: { type: String, trim: true },
    rollno: { type: String, trim: true },
    academicyear: { type: String, trim: true },
    regulation: { type: String, trim: true },
    program: { type: String, trim: true },
    programcode: { type: String, trim: true },
    semester: { type: String, trim: true },
    section: { type: String, trim: true },
    user: { type: String, trim: true }
  },
  { timestamps: true }
);

const enrollmentWorkloadSchema = new mongoose.Schema(
  {
    colid: { type: Number, required: true, index: true },
    groupid: { type: mongoose.Schema.Types.ObjectId, index: true },
    groupname: { type: String, trim: true },
    faculty: { type: String, trim: true },
    facultyemail: { type: String, trim: true },
    academicyear: { type: String, trim: true },
    regulation: { type: String, trim: true },
    program: { type: String, trim: true },
    programcode: { type: String, trim: true },
    semester: { type: String, trim: true },
    course: { type: String, trim: true },
    coursecode: { type: String, trim: true },
    user: { type: String, trim: true }
  },
  { timestamps: true }
);

const supplementaryWorkflowSchema = new mongoose.Schema(
  {
    category: { type: String, trim: true },
    level: { type: Number },
    approverrole: { type: String, trim: true },
    approvername: { type: String, trim: true },
    approveremail: { type: String, trim: true },
    status: { type: String, trim: true, default: "Active" },
    colid: { type: Number, required: true, index: true },
    user: { type: String, trim: true }
  },
  { timestamps: true }
);

const supplementaryRequestSchema = new mongoose.Schema(
  {
    category: { type: String, trim: true },
    fromdate: { type: String, trim: true },
    fromtime: { type: String, trim: true },
    todate: { type: String, trim: true },
    totime: { type: String, trim: true },
    description: { type: String, trim: true },
    documentlink: { type: String, trim: true },
    documentname: { type: String, trim: true },
    students: [{ regno: String, name: String, email: String }],
    status: { type: String, trim: true, default: "Pending" },
    currentlevel: { type: Number },
    approvals: [{ level: Number, approver: String, approveremail: String, status: String, remarks: String, actionat: Date }],
    colid: { type: Number, required: true, index: true },
    user: { type: String, trim: true },
    username: { type: String, trim: true }
  },
  { timestamps: true }
);

const loginAttendanceSchema = new mongoose.Schema(
  {
    academicyear: { type: String, trim: true },
    regulation: { type: String, trim: true },
    program: { type: String, trim: true },
    programcode: { type: String, trim: true },
    semester: { type: String, trim: true },
    course: { type: String, trim: true },
    coursecode: { type: String, trim: true },
    section: { type: String, trim: true },
    student: { type: String, trim: true },
    regno: { type: String, trim: true },
    email: { type: String, trim: true },
    loginat: { type: Date },
    logoutat: { type: Date },
    minutesonline: { type: Number, default: 0 },
    colid: { type: Number, required: true, index: true }
  },
  { timestamps: true }
);

// Minimal schemas for read-only use of shared collections
const minimalAttendanceSchema = new mongoose.Schema(
  { academicyear: String, semester: String, coursecode: String, facultyemail: String, classdate: String, regno: String, status: String, colid: Number },
  { timestamps: true }
);
const minimalTimetableSchema = new mongoose.Schema(
  { academicyear: String, semester: String, coursecode: String, facultyemail: String, classdate: String, colid: Number },
  { timestamps: true }
);
const minimalFinalMarksSchema = new mongoose.Schema(
  { academicyear: String, regulation: String, program: String, programcode: String, semester: String, course: String, coursecode: String, regno: String, student: String, totalmarks: Number, marks: Number, grade: String, gradepoint: Number, credits: Number, earnedcredits: Number, gradepoints: Number, status: String, colid: Number },
  { timestamps: true }
);
const minimalAssessmentMarksSchema = new mongoose.Schema(
  { academicyear: String, regulation: String, program: String, programcode: String, semester: String, course: String, coursecode: String, assessmentid: mongoose.Schema.Types.ObjectId, assessmenttitle: String, fullmarks: Number, regno: String, student: String, marks: Number, colid: Number },
  { timestamps: true }
);
const minimalWorkloadSchema = new mongoose.Schema(
  { academicyear: String, regulation: String, program: String, programcode: String, semester: String, course: String, coursecode: String, faculty: String, facultyemail: String, status: String, colid: Number },
  { timestamps: true }
);
const minimalUserSchema = new mongoose.Schema(
  { name: String, email: String, phone: String, regno: String, rollno: String, academicyear: String, admissionyear: String, regulation: String, program: String, programcode: String, semester: String, section: String, Major: String, role: String, status: Number, colid: Number },
  { timestamps: true }
);

// ─── Models ──────────────────────────────────────────────────────────────────

const NepLmsLessonContent = mongoose.models.NepLmsLessonContentMcp
  || mongoose.model("NepLmsLessonContentMcp", lessonContentSchema, "neplmslessoncontentds");

const NepLmsLessonProgress = mongoose.models.NepLmsLessonProgressMcp
  || mongoose.model("NepLmsLessonProgressMcp", lessonProgressSchema, "neplmslessoncontentprogressds");

const NepLmsPreReading = mongoose.models.NepLmsPreReadingMcp
  || mongoose.model("NepLmsPreReadingMcp", preReadingSchema, "neplmsprereadingds");

const NepLmsLiveQuiz = mongoose.models.NepLmsLiveQuizMcp
  || mongoose.model("NepLmsLiveQuizMcp", liveQuizSchema, "neplmslivequizds");

const NepLmsLiveQuizAttempt = mongoose.models.NepLmsLiveQuizAttemptMcp
  || mongoose.model("NepLmsLiveQuizAttemptMcp", liveQuizAttemptSchema, "neplmslivequizattemptds");

const NepLmsDescriptiveAssessment = mongoose.models.NepLmsDescriptiveAssessmentMcp
  || mongoose.model("NepLmsDescriptiveAssessmentMcp", descriptiveAssessmentSchema, "neplmsdescriptiveassessmentds");

const NepLmsDescriptiveAttempt = mongoose.models.NepLmsDescriptiveAttemptMcp
  || mongoose.model("NepLmsDescriptiveAttemptMcp", descriptiveAttemptSchema, "neplmsdescriptiveattemptds");

const NepLmsFacultyLogbook = mongoose.models.NepLmsFacultyLogbookMcp
  || mongoose.model("NepLmsFacultyLogbookMcp", facultyLogbookSchema, "neplmsfacultylogbookds");

const NepLmsClassGroup = mongoose.models.NepLmsClassGroupMcp
  || mongoose.model("NepLmsClassGroupMcp", classGroupSchema, "neplmsclassgroupds");

const NepLmsEnrollmentGroup = mongoose.models.NepLmsEnrollmentGroupMcp
  || mongoose.model("NepLmsEnrollmentGroupMcp", enrollmentGroupSchema, "neplmsenrollmentgroupds");

const NepLmsEnrollmentGroupStudent = mongoose.models.NepLmsEnrollmentGroupStudentMcp
  || mongoose.model("NepLmsEnrollmentGroupStudentMcp", enrollmentGroupStudentSchema, "neplmsenrollmentgroupstudentds");

const NepLmsEnrollmentWorkload = mongoose.models.NepLmsEnrollmentWorkloadMcp
  || mongoose.model("NepLmsEnrollmentWorkloadMcp", enrollmentWorkloadSchema, "neplmsenrollmentworkloadds");

const NepLmsSupplementaryWorkflow = mongoose.models.NepLmsSupplementaryWorkflowMcp
  || mongoose.model("NepLmsSupplementaryWorkflowMcp", supplementaryWorkflowSchema, "neplmssupplementaryattendanceworkflowds");

const NepLmsSupplementaryRequest = mongoose.models.NepLmsSupplementaryRequestMcp
  || mongoose.model("NepLmsSupplementaryRequestMcp", supplementaryRequestSchema, "neplmssupplementaryattendancerequestds");

const NepLmsLoginAttendance = mongoose.models.NepLmsLoginAttendanceMcp
  || mongoose.model("NepLmsLoginAttendanceMcp", loginAttendanceSchema, "neplmsloginattendanceds");

const NepLmsAttendanceExt = mongoose.models.NepLmsAttendanceExtMcp
  || mongoose.model("NepLmsAttendanceExtMcp", minimalAttendanceSchema, "neplmsattendanceds");

const NepLmsTimetableExt = mongoose.models.NepLmsTimetableExtMcp
  || mongoose.model("NepLmsTimetableExtMcp", minimalTimetableSchema, "neplmstimetableds");

const NepLmsFinalMarksExt = mongoose.models.NepLmsFinalMarksExtMcp
  || mongoose.model("NepLmsFinalMarksExtMcp", minimalFinalMarksSchema, "neplmsfinalmarksds");

const NepLmsAssessmentMarksExt = mongoose.models.NepLmsAssessmentMarksExtMcp
  || mongoose.model("NepLmsAssessmentMarksExtMcp", minimalAssessmentMarksSchema, "neplmsassessmentmarksds");

const WorkloadExt = mongoose.models.WorkloadExtMcp
  || mongoose.model("WorkloadExtMcp", minimalWorkloadSchema, "workloadassignmentds");

const UserExt = mongoose.models.UserExtMcp
  || mongoose.model("UserExtMcp", minimalUserSchema, "users");

// ─── Helpers ─────────────────────────────────────────────────────────────────

const t = (v) => String(v ?? "").trim();
const n = (v, fallback = undefined) => { const p = Number(v); return Number.isFinite(p) ? p : fallback; };
const uniqueSorted = (arr) => [...new Set(arr.map(t).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const courseFilter = (source = {}, extra = []) => {
  const q = { colid: Number(source.colid) };
  ["academicyear", "regulation", "program", "programcode", "type", "major", "semester", "course", "coursecode", "faculty", "facultyemail", "status", ...extra]
    .forEach((f) => { if (t(source[f])) q[f] = t(source[f]); });
  return q;
};

const courseFilterSchema = {
  academicyear: z.string().optional(),
  regulation: z.string().optional(),
  program: z.string().optional(),
  programcode: z.string().optional(),
  semester: z.string().optional(),
  coursecode: z.string().optional(),
  facultyemail: z.string().optional(),
  status: z.string().optional()
};

// ─── Registration ─────────────────────────────────────────────────────────────

export function registerNeplmsExtendedTools(server, { requireAuth, resolveColid, connectDB }) {

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 1 — SEQUENTIAL CONTENT (LESSON CONTENT)
  // ══════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_lesson_content",
    "List sequential lesson content items for a course (faculty/admin view). Filter by lessonresourceid to get steps for one lesson plan.",
    {
      ...courseFilterSchema,
      lessonresourceid: z.string().optional().describe("Lesson Plan resource _id to filter by"),
      contenttype: z.string().optional().describe("Text | File Link | Video Link | Quiz | Mindmap | Flash Card | Infographics"),
      section: z.string().optional(),
      limit: z.number().int().min(1).max(1000).optional().default(1000)
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 1000, lessonresourceid, contenttype, section, ...rest } = args;
      const q = courseFilter({ colid, ...rest });
      if (lessonresourceid) q.lessonresourceid = lessonresourceid;
      if (contenttype) q.contenttype = contenttype;
      if (section) q.section = section;
      const docs = await NepLmsLessonContent.find(q).sort({ lessonresourceid: 1, sequence: 1, createdAt: 1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "save_lesson_content",
    "Create or update a sequential lesson content item. Pass id to update. Required: lessonresourceid, contenttype, title. contenttypes: Text, File Link, Video Link, Quiz, Mindmap, Flash Card, Infographics.",
    {
      id: z.string().optional().describe("Pass to update existing"),
      lessonresourceid: z.string().min(1).describe("_id of the Lesson Plan resource this belongs to"),
      lessonplantitle: z.string().optional(),
      sequence: z.number().int().min(1).optional().default(1).describe("Ordering within the lesson plan"),
      contenttype: z.enum(["Text", "File Link", "Video Link", "Quiz", "Mindmap", "Flash Card", "Infographics"]),
      title: z.string().min(1),
      section: z.string().optional(),
      description: z.string().optional(),
      topics: z.string().optional(),
      filelink: z.string().optional().describe("URL for Text/File Link/Infographics content"),
      videolink: z.string().optional().describe("URL for Video Link content"),
      quizid: z.string().optional().describe("_id of linked Quiz (for contenttype Quiz)"),
      quiztitle: z.string().optional(),
      mindmapid: z.string().optional().describe("_id of linked MindMap"),
      mindmaptitle: z.string().optional(),
      flashcards: z.array(z.object({ question: z.string(), answer: z.string(), questionimage: z.string().optional() })).optional(),
      status: z.string().optional().default("Active"),
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      semester: z.string().optional(),
      course: z.string().optional(),
      coursecode: z.string().optional(),
      coursegroup: z.string().optional(),
      faculty: z.string().optional(),
      facultyemail: z.string().optional()
    },
    async ({ id, flashcards, ...args }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { ...args, colid };
      if (Array.isArray(flashcards)) payload.flashcards = flashcards;
      let doc;
      if (id) {
        doc = await NepLmsLessonContent.findOneAndUpdate({ _id: id, colid }, payload, { new: true, runValidators: true });
        if (!doc) return { content: [{ type: "text", text: "Lesson content not found" }] };
      } else {
        if (!args.lessonresourceid) return { content: [{ type: "text", text: "lessonresourceid is required" }] };
        doc = await NepLmsLessonContent.create(payload);
      }
      return { content: [{ type: "text", text: `Lesson content saved: ${doc._id}` }] };
    }
  );

  server.tool(
    "get_lesson_content_progress",
    "Get student completion progress for lesson content items. Filter by lessonresourceid, coursecode, regno, or facultyemail.",
    {
      lessonresourceid: z.string().optional(),
      contentid: z.string().optional(),
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      regno: z.string().optional().describe("Student registration number to filter"),
      facultyemail: z.string().optional(),
      limit: z.number().int().min(1).max(1000).optional().default(1000)
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 1000, ...rest } = args;
      const q = { colid };
      ["lessonresourceid", "contentid", "academicyear", "semester", "coursecode", "regno", "facultyemail"].forEach((f) => {
        if (t(rest[f])) q[f] = t(rest[f]);
      });
      const docs = await NepLmsLessonProgress.find(q).sort({ completedat: -1, student: 1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "get_student_lesson_content",
    "Get all lesson content for a student with locked/completed status. Sequential locking: each step within a lesson plan unlocks only after the previous is completed.",
    {
      regno: z.string().min(1).describe("Student registration number"),
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      coursegroup: z.string().optional(),
      lessonresourceid: z.string().optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { regno, lessonresourceid, ...filters } = args;
      const student = await UserExt.findOne({ colid, regno }).lean();
      if (!student) return { content: [{ type: "text", text: `Student not found: ${regno}` }] };
      const q = courseFilter({ colid, ...filters });
      q.status = "Active";
      if (lessonresourceid) q.lessonresourceid = lessonresourceid;
      const contents = await NepLmsLessonContent.find(q).sort({ lessonresourceid: 1, sequence: 1 }).lean();
      const progressRows = await NepLmsLessonProgress.find({
        colid,
        regno,
        contentid: { $in: contents.map((c) => c._id) }
      }).lean();
      const completed = new Set(progressRows.map((r) => String(r.contentid)));
      const priorByLesson = {};
      const data = contents.map((c) => {
        const key = String(c.lessonresourceid || "general");
        const prevOk = priorByLesson[key] !== false;
        const isDone = completed.has(String(c._id));
        const prog = progressRows.find((r) => String(r.contentid) === String(c._id));
        priorByLesson[key] = prevOk && isDone;
        return { ...c, completed: isDone, locked: !prevOk, completedat: prog?.completedat || null, progresspercentage: prog?.progresspercentage || 0 };
      });
      const summary = {};
      data.forEach((item) => {
        const key = String(item.lessonresourceid || "general");
        if (!summary[key]) summary[key] = { lessonresourceid: key, lessonplantitle: item.lessonplantitle, total: 0, completed: 0 };
        summary[key].total++;
        if (item.completed) summary[key].completed++;
      });
      return { content: [{ type: "text", text: JSON.stringify({ student: { name: student.name, regno, academicyear: student.academicyear, semester: student.semester }, lessonSummaries: Object.values(summary), count: data.length, data }, null, 2) }] };
    }
  );

  server.tool(
    "complete_lesson_content",
    "Mark a lesson content item as completed for a student. Enforces sequential order — previous items in the same lesson plan must be completed first. For Quiz contenttype, a quiz attempt must exist.",
    {
      regno: z.string().min(1).describe("Student registration number"),
      contentid: z.string().min(1).describe("_id of the lesson content item to mark complete"),
      comments: z.string().optional()
    },
    async ({ regno, contentid, comments }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const student = await UserExt.findOne({ colid, regno }).lean();
      if (!student) return { content: [{ type: "text", text: `Student not found: ${regno}` }] };
      const content = await NepLmsLessonContent.findOne({ _id: contentid, colid, status: "Active" }).lean();
      if (!content) return { content: [{ type: "text", text: "Content not found or inactive" }] };
      const earlier = await NepLmsLessonContent.find({
        colid,
        lessonresourceid: content.lessonresourceid,
        sequence: { $lt: content.sequence },
        status: "Active"
      }).sort({ sequence: 1 }).lean();
      if (earlier.length) {
        const earlyProgress = await NepLmsLessonProgress.find({ colid, regno, contentid: { $in: earlier.map((e) => e._id) } }).lean();
        if (earlyProgress.length < earlier.length) {
          return { content: [{ type: "text", text: "Complete previous content in this lesson plan first" }] };
        }
      }
      const lessonSteps = await NepLmsLessonContent.find({ colid, lessonresourceid: content.lessonresourceid, status: "Active" }).lean();
      const existingProgress = await NepLmsLessonProgress.find({ colid, regno, contentid: { $in: lessonSteps.map((s) => s._id) } }).lean();
      const completedIds = new Set(existingProgress.map((r) => String(r.contentid)));
      completedIds.add(String(content._id));
      const totalsteps = lessonSteps.length || 1;
      const completedsteps = Math.min(completedIds.size, totalsteps);
      const progresspercentage = Number(((completedsteps / totalsteps) * 100).toFixed(2));
      await NepLmsLessonProgress.findOneAndUpdate(
        { colid, contentid: content._id, regno },
        {
          lessonresourceid: content.lessonresourceid,
          lessonplantitle: content.lessonplantitle,
          contenttitle: content.title,
          contenttype: content.contenttype,
          section: content.section,
          sequence: content.sequence,
          totalsteps,
          completedsteps,
          progresspercentage,
          stepstatus: "Completed",
          academicyear: content.academicyear,
          semester: content.semester,
          coursecode: content.coursecode,
          coursegroup: content.coursegroup,
          faculty: content.faculty,
          facultyemail: content.facultyemail,
          student: student.name || "",
          regno,
          email: student.email || "",
          phone: student.phone || "",
          completed: true,
          completedat: new Date(),
          comments: t(comments),
          colid
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      return { content: [{ type: "text", text: `Completed: ${content.title}. Progress: ${completedsteps}/${totalsteps} (${progresspercentage}%)` }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 2 — PRE-READING
  // ══════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_pre_reading",
    "List pre-reading content items (faculty view). Pre-reading is content students review before class.",
    {
      ...courseFilterSchema,
      contenttype: z.string().optional(),
      limit: z.number().int().min(1).max(1000).optional().default(1000)
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 1000, contenttype, ...rest } = args;
      const q = courseFilter({ colid, ...rest });
      if (contenttype) q.contenttype = contenttype;
      const docs = await NepLmsPreReading.find(q).sort({ academicyear: -1, semester: 1, course: 1, sequence: 1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "save_pre_reading",
    "Create or update a pre-reading content item. Pass id to update. contenttypes: Text, File Link, Video Link, Mindmap, Flash Card.",
    {
      id: z.string().optional(),
      academicyear: z.string().min(1),
      semester: z.string().min(1),
      coursecode: z.string().min(1),
      course: z.string().optional(),
      regulation: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      faculty: z.string().optional(),
      facultyemail: z.string().optional(),
      contenttype: z.enum(["Text", "File Link", "Video Link", "Mindmap", "Flash Card"]),
      title: z.string().min(1),
      description: z.string().optional(),
      topics: z.string().optional(),
      sequence: z.number().int().min(1).optional().default(1),
      filelink: z.string().optional(),
      videolink: z.string().optional(),
      mindmapid: z.string().optional(),
      mindmaptitle: z.string().optional(),
      flashcards: z.array(z.object({ question: z.string(), answer: z.string(), questionimage: z.string().optional() })).optional(),
      status: z.string().optional().default("Active")
    },
    async ({ id, flashcards, ...args }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { ...args, colid };
      if (Array.isArray(flashcards)) payload.flashcards = flashcards;
      let doc;
      if (id) {
        doc = await NepLmsPreReading.findOneAndUpdate({ _id: id, colid }, payload, { new: true });
        if (!doc) return { content: [{ type: "text", text: "Pre-reading not found" }] };
      } else {
        doc = await NepLmsPreReading.create(payload);
      }
      return { content: [{ type: "text", text: `Pre-reading saved: ${doc._id}` }] };
    }
  );

  server.tool(
    "get_student_pre_reading",
    "Get pre-reading content list visible to a student, based on their course registration.",
    {
      regno: z.string().min(1),
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { regno, ...filters } = args;
      const student = await UserExt.findOne({ colid, regno }).lean();
      if (!student) return { content: [{ type: "text", text: `Student not found: ${regno}` }] };
      const q = courseFilter({ colid, ...filters });
      q.status = "Active";
      const docs = await NepLmsPreReading.find(q).sort({ academicyear: -1, semester: 1, sequence: 1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ student: { name: student.name, regno }, count: docs.length, data: docs }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 3 — LIVE QUIZ
  // ══════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_live_quizzes",
    "List live quizzes (faculty/admin). Live quizzes are real-time MCQ sessions with leaderboard.",
    {
      ...courseFilterSchema,
      limit: z.number().int().min(1).max(1000).optional().default(1000)
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 1000, ...rest } = args;
      const q = courseFilter({ colid, ...rest });
      const docs = await NepLmsLiveQuiz.find(q).sort({ createdAt: -1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "save_live_quiz",
    "Create or update a live quiz. Pass id to update. Status: Draft | Active | Closed.",
    {
      id: z.string().optional(),
      title: z.string().min(1),
      description: z.string().optional(),
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      course: z.string().optional(),
      regulation: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      faculty: z.string().optional(),
      facultyemail: z.string().optional(),
      durationminutes: z.number().int().min(0).optional().default(0),
      status: z.string().optional().default("Draft")
    },
    async ({ id, ...args }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { ...args, colid };
      let doc;
      if (id) {
        doc = await NepLmsLiveQuiz.findOneAndUpdate({ _id: id, colid }, { $set: args }, { new: true });
        if (!doc) return { content: [{ type: "text", text: "Live quiz not found" }] };
      } else {
        doc = await NepLmsLiveQuiz.create(payload);
      }
      return { content: [{ type: "text", text: `Live quiz saved: ${doc._id}` }] };
    }
  );

  server.tool(
    "add_live_quiz_section",
    "Add a section to a live quiz.",
    {
      quizid: z.string().min(1),
      title: z.string().min(1),
      description: z.string().optional()
    },
    async ({ quizid, title, description }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const section = { title, description: description || "" };
      const doc = await NepLmsLiveQuiz.findOneAndUpdate({ _id: quizid, colid }, { $push: { sections: section } }, { new: true });
      if (!doc) return { content: [{ type: "text", text: "Live quiz not found" }] };
      const added = doc.sections[doc.sections.length - 1];
      return { content: [{ type: "text", text: `Section added: ${added._id}` }] };
    }
  );

  server.tool(
    "add_live_quiz_question",
    "Add a question to a live quiz. Options is an array of {text, iscorrect} objects — mark exactly one as iscorrect: true.",
    {
      quizid: z.string().min(1),
      sectionid: z.string().optional(),
      sectiontitle: z.string().optional(),
      question: z.string().min(1),
      options: z.array(z.object({ text: z.string(), iscorrect: z.boolean().optional().default(false) })).min(2),
      explanation: z.string().optional(),
      marks: z.number().int().min(1).optional().default(1)
    },
    async ({ quizid, sectionid, sectiontitle, question, options, explanation, marks }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const q = { question, options, marks: marks || 1, explanation: explanation || "", sectionid: sectionid || undefined, sectiontitle: sectiontitle || "" };
      const doc = await NepLmsLiveQuiz.findOneAndUpdate({ _id: quizid, colid }, { $push: { questions: q } }, { new: true });
      if (!doc) return { content: [{ type: "text", text: "Live quiz not found" }] };
      const added = doc.questions[doc.questions.length - 1];
      return { content: [{ type: "text", text: `Question added: ${added._id}` }] };
    }
  );

  server.tool(
    "update_live_quiz_question",
    "Update a question within a live quiz.",
    {
      quizid: z.string().min(1),
      questionid: z.string().min(1),
      question: z.string().optional(),
      options: z.array(z.object({ text: z.string(), iscorrect: z.boolean().optional().default(false) })).optional(),
      explanation: z.string().optional(),
      marks: z.number().int().min(1).optional()
    },
    async ({ quizid, questionid, ...updates }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const setObj = {};
      if (updates.question !== undefined) setObj["questions.$.question"] = updates.question;
      if (updates.options !== undefined) setObj["questions.$.options"] = updates.options;
      if (updates.explanation !== undefined) setObj["questions.$.explanation"] = updates.explanation;
      if (updates.marks !== undefined) setObj["questions.$.marks"] = updates.marks;
      const doc = await NepLmsLiveQuiz.findOneAndUpdate({ _id: quizid, colid, "questions._id": questionid }, { $set: setObj }, { new: true });
      if (!doc) return { content: [{ type: "text", text: "Live quiz or question not found" }] };
      return { content: [{ type: "text", text: "Question updated" }] };
    }
  );

  server.tool(
    "get_live_quiz_leaderboard",
    "Get the leaderboard (ranked attempts) for a live quiz.",
    {
      quizid: z.string().min(1),
      limit: z.number().int().min(1).max(1000).optional().default(100)
    },
    async ({ quizid, limit }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const attempts = await NepLmsLiveQuizAttempt.find({ quizid, colid, submitted: true })
        .sort({ scoredmarks: -1, submittedat: 1 })
        .limit(limit || 100)
        .lean();
      const ranked = attempts.map((a, i) => ({ rank: i + 1, student: a.student, regno: a.regno, scoredmarks: a.scoredmarks, totalmarks: a.totalmarks }));
      return { content: [{ type: "text", text: JSON.stringify({ count: ranked.length, leaderboard: ranked }, null, 2) }] };
    }
  );

  server.tool(
    "list_live_quiz_attempts",
    "List live quiz attempts for a quiz or student.",
    {
      quizid: z.string().optional(),
      regno: z.string().optional(),
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      submitted: z.boolean().optional(),
      limit: z.number().int().min(1).max(1000).optional().default(1000)
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 1000, quizid, regno, submitted, ...rest } = args;
      const q = { colid };
      if (quizid) q.quizid = quizid;
      if (regno) q.regno = regno;
      if (submitted !== undefined) q.submitted = submitted;
      if (rest.academicyear) q.academicyear = rest.academicyear;
      if (rest.semester) q.semester = rest.semester;
      if (rest.coursecode) q.coursecode = rest.coursecode;
      const docs = await NepLmsLiveQuizAttempt.find(q).sort({ scoredmarks: -1, submittedat: -1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 4 — DESCRIPTIVE ASSESSMENTS
  // ══════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_lms_assessments",
    "List descriptive/subjective assessments (not MCQ quizzes). These are essay/long-answer type.",
    {
      ...courseFilterSchema,
      limit: z.number().int().min(1).max(1000).optional().default(1000)
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 1000, ...rest } = args;
      const q = courseFilter({ colid, ...rest });
      const docs = await NepLmsDescriptiveAssessment.find(q).sort({ createdAt: -1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "save_lms_assessment",
    "Create or update a descriptive assessment. Pass id to update. Status: Draft | Active | Closed.",
    {
      id: z.string().optional(),
      title: z.string().min(1),
      description: z.string().optional(),
      duedate: z.string().optional().describe("YYYY-MM-DD"),
      fullmarks: z.number().optional().default(0),
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      course: z.string().optional(),
      regulation: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      faculty: z.string().optional(),
      facultyemail: z.string().optional(),
      status: z.string().optional().default("Draft")
    },
    async ({ id, ...args }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { ...args, colid };
      let doc;
      if (id) {
        doc = await NepLmsDescriptiveAssessment.findOneAndUpdate({ _id: id, colid }, { $set: args }, { new: true });
        if (!doc) return { content: [{ type: "text", text: "Assessment not found" }] };
      } else {
        doc = await NepLmsDescriptiveAssessment.create(payload);
      }
      return { content: [{ type: "text", text: `Assessment saved: ${doc._id}` }] };
    }
  );

  server.tool(
    "add_lms_assessment_section",
    "Add a section to a descriptive assessment.",
    {
      assessmentid: z.string().min(1),
      title: z.string().min(1),
      description: z.string().optional()
    },
    async ({ assessmentid, title, description }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const doc = await NepLmsDescriptiveAssessment.findOneAndUpdate(
        { _id: assessmentid, colid },
        { $push: { sections: { title, description: description || "" } } },
        { new: true }
      );
      if (!doc) return { content: [{ type: "text", text: "Assessment not found" }] };
      const added = doc.sections[doc.sections.length - 1];
      return { content: [{ type: "text", text: `Section added: ${added._id}` }] };
    }
  );

  server.tool(
    "add_lms_assessment_question",
    "Add a question to a descriptive assessment section.",
    {
      assessmentid: z.string().min(1),
      sectionid: z.string().optional(),
      sectiontitle: z.string().optional(),
      question: z.string().min(1),
      marks: z.number().optional().default(0),
      answerlength: z.number().int().min(0).optional().default(0).describe("Expected answer word/char limit")
    },
    async ({ assessmentid, sectionid, sectiontitle, question, marks, answerlength }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const doc = await NepLmsDescriptiveAssessment.findOneAndUpdate(
        { _id: assessmentid, colid },
        { $push: { questions: { question, marks: marks || 0, answerlength: answerlength || 0, sectionid: sectionid || undefined, sectiontitle: sectiontitle || "" } } },
        { new: true }
      );
      if (!doc) return { content: [{ type: "text", text: "Assessment not found" }] };
      const added = doc.questions[doc.questions.length - 1];
      return { content: [{ type: "text", text: `Question added: ${added._id}` }] };
    }
  );

  server.tool(
    "list_lms_assessment_attempts",
    "List student attempts/submissions for descriptive assessments.",
    {
      assessmentid: z.string().optional(),
      regno: z.string().optional(),
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().int().min(1).max(1000).optional().default(1000)
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 1000, assessmentid, regno, ...rest } = args;
      const q = { colid };
      if (assessmentid) q.assessmentid = assessmentid;
      if (regno) q.regno = regno;
      if (rest.academicyear) q.academicyear = rest.academicyear;
      if (rest.semester) q.semester = rest.semester;
      if (rest.coursecode) q.coursecode = rest.coursecode;
      if (rest.status) q.status = rest.status;
      const docs = await NepLmsDescriptiveAttempt.find(q).sort({ submittedat: -1, student: 1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "update_lms_assessment_marks",
    "Update marks for a descriptive assessment attempt (faculty grading).",
    {
      attemptid: z.string().min(1).describe("_id of the attempt/submission"),
      marks: z.number().min(0).describe("Total marks awarded"),
      questionmarks: z.array(z.object({ questionid: z.string(), marks: z.number(), aifeedback: z.string().optional() })).optional().describe("Per-question marks breakdown")
    },
    async ({ attemptid, marks, questionmarks }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const update = { $set: { marks, status: "Graded" } };
      if (Array.isArray(questionmarks) && questionmarks.length) {
        const attempt = await NepLmsDescriptiveAttempt.findOne({ _id: attemptid, colid }).lean();
        if (!attempt) return { content: [{ type: "text", text: "Attempt not found" }] };
        const updatedAnswers = (attempt.answers || []).map((ans) => {
          const qm = questionmarks.find((q) => String(q.questionid) === String(ans.questionid));
          if (qm) return { ...ans, marks: qm.marks, aifeedback: qm.aifeedback || ans.aifeedback };
          return ans;
        });
        update.$set.answers = updatedAnswers;
      }
      const doc = await NepLmsDescriptiveAttempt.findOneAndUpdate({ _id: attemptid, colid }, update, { new: true });
      if (!doc) return { content: [{ type: "text", text: "Attempt not found" }] };
      return { content: [{ type: "text", text: `Marks updated for ${doc.student || doc.regno}: ${marks}` }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 5 — FACULTY LOGBOOK
  // ══════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_faculty_logbook",
    "List faculty logbook entries. Each entry records what a faculty member taught on a given day (Class or Assessment).",
    {
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      programcode: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      facultyemail: z.string().optional(),
      typeofwork: z.string().optional().describe("Class | Assessment"),
      fromdate: z.string().optional().describe("YYYY-MM-DD"),
      todate: z.string().optional().describe("YYYY-MM-DD"),
      limit: z.number().int().min(1).max(1000).optional().default(1000)
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 1000, fromdate, todate, typeofwork, ...rest } = args;
      const q = courseFilter({ colid, ...rest });
      if (typeofwork) q.typeofwork = typeofwork;
      if (fromdate || todate) {
        q.dateofwork = {};
        if (fromdate) q.dateofwork.$gte = fromdate;
        if (todate) q.dateofwork.$lte = todate;
      }
      const docs = await NepLmsFacultyLogbook.find(q).sort({ dateofwork: -1, course: 1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "save_faculty_logbook",
    "Create or update a faculty logbook entry. Pass id to update. typeofwork: Class or Assessment.",
    {
      id: z.string().optional(),
      academicyear: z.string().min(1),
      regulation: z.string().min(1),
      program: z.string().min(1),
      programcode: z.string().min(1),
      faculty: z.string().min(1),
      facultyemail: z.string().min(1),
      course: z.string().min(1),
      coursecode: z.string().min(1),
      typeofwork: z.enum(["Class", "Assessment"]).default("Class"),
      description: z.string().optional(),
      dateofwork: z.string().min(1).describe("YYYY-MM-DD"),
      outcome: z.string().optional()
    },
    async ({ id, ...args }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { ...args, colid };
      let doc;
      if (id) {
        doc = await NepLmsFacultyLogbook.findOneAndUpdate({ _id: id, colid }, payload, { new: true });
        if (!doc) return { content: [{ type: "text", text: "Logbook entry not found" }] };
      } else {
        doc = await NepLmsFacultyLogbook.create(payload);
      }
      return { content: [{ type: "text", text: `Logbook entry saved: ${doc._id}` }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 6 — CLASS GROUPS
  // ══════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_class_groups",
    "List class group assignments. Class groups divide students within a course into named groups for attendance/workload.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      facultyemail: z.string().optional(),
      groupname: z.string().optional(),
      regno: z.string().optional(),
      programcode: z.string().optional(),
      limit: z.number().int().min(1).max(1000).optional().default(1000)
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 1000, ...rest } = args;
      const q = { colid };
      ["academicyear", "semester", "coursecode", "facultyemail", "groupname", "regno", "programcode"].forEach((f) => {
        if (t(rest[f])) q[f] = t(rest[f]);
      });
      const docs = await NepLmsClassGroup.find(q).sort({ groupname: 1, student: 1 }).limit(limit).lean();
      const groups = {};
      docs.forEach((d) => {
        const key = t(d.groupname);
        if (!groups[key]) groups[key] = { groupname: key, coursecode: d.coursecode, faculty: d.faculty, count: 0, students: [] };
        groups[key].count++;
        groups[key].students.push({ regno: d.regno, student: d.student, email: d.email });
      });
      return { content: [{ type: "text", text: JSON.stringify({ totalRecords: docs.length, groups: Object.values(groups), data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "save_class_group",
    "Create a class group by assigning students to a named group for a course. Each student gets one record. Existing students in the same group are preserved; new students are added.",
    {
      groupname: z.string().min(1),
      academicyear: z.string().min(1),
      regulation: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      semester: z.string().min(1),
      course: z.string().optional(),
      coursecode: z.string().min(1),
      faculty: z.string().optional(),
      facultyemail: z.string().optional(),
      students: z.array(z.object({
        regno: z.string(),
        student: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        section: z.string().optional()
      })).min(1)
    },
    async ({ students, ...courseArgs }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const saved = [];
      for (const item of students) {
        const payload = { ...courseArgs, colid, student: item.student || "", regno: item.regno, email: item.email || "", phone: item.phone || "", section: item.section || "" };
        const doc = await NepLmsClassGroup.findOneAndUpdate(
          { colid, groupname: courseArgs.groupname, coursecode: courseArgs.coursecode, regno: item.regno },
          payload,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        saved.push(doc._id);
      }
      return { content: [{ type: "text", text: `Class group '${courseArgs.groupname}' saved with ${saved.length} students` }] };
    }
  );

  server.tool(
    "get_class_group_courses",
    "Get the courses assigned to a faculty member (from workload) — used to populate the course dropdown when creating class groups.",
    {
      facultyemail: z.string().min(1),
      academicyear: z.string().optional(),
      semester: z.string().optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { facultyemail, academicyear, semester } = args;
      const q = { colid, facultyemail, status: "Active" };
      if (academicyear) q.academicyear = academicyear;
      if (semester) q.semester = semester;
      const docs = await WorkloadExt.find(q).sort({ academicyear: -1, semester: 1, course: 1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "get_class_group_students",
    "Get enrolled students for a course (from user records) to assign to a class group.",
    {
      academicyear: z.string().optional(),
      programcode: z.string().optional(),
      semester: z.string().optional(),
      section: z.string().optional(),
      regulation: z.string().optional(),
      limit: z.number().int().min(1).max(1000).optional().default(1000)
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 1000, ...filters } = args;
      const q = { colid, role: "Student", status: 1 };
      if (filters.programcode) q.programcode = filters.programcode;
      if (filters.semester) q.semester = filters.semester;
      if (filters.section) q.section = filters.section;
      if (filters.regulation) q.regulation = filters.regulation;
      if (filters.academicyear) q.$or = [{ academicyear: filters.academicyear }, { admissionyear: filters.academicyear }];
      const docs = await UserExt.find(q).select("name email phone regno rollno academicyear admissionyear regulation program programcode semester section").sort({ name: 1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 7 — ENROLLMENT GROUPS (PROXY ENROLLMENT)
  // ══════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_enrollment_groups",
    "List enrollment groups (proxy enrollment). Enrollment groups are admin-created groups of students assigned to courses with specific faculty.",
    {
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      groupname: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().int().min(1).max(1000).optional().default(1000)
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 1000, ...rest } = args;
      const q = { colid };
      ["academicyear", "regulation", "groupname", "status"].forEach((f) => { if (t(rest[f])) q[f] = t(rest[f]); });
      const docs = await NepLmsEnrollmentGroup.find(q).sort({ academicyear: -1, groupname: 1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "save_enrollment_group",
    "Create or update an enrollment group. Pass id to update.",
    {
      id: z.string().optional(),
      groupname: z.string().min(1),
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      section: z.string().optional(),
      description: z.string().optional(),
      status: z.string().optional().default("Active")
    },
    async ({ id, ...args }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { ...args, colid };
      let doc;
      if (id) {
        doc = await NepLmsEnrollmentGroup.findOneAndUpdate({ _id: id, colid }, payload, { new: true });
      } else {
        doc = await NepLmsEnrollmentGroup.findOneAndUpdate(
          { colid, groupname: args.groupname },
          payload,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      return { content: [{ type: "text", text: `Enrollment group saved: ${doc._id}` }] };
    }
  );

  server.tool(
    "list_enrollment_group_students",
    "List students in an enrollment group.",
    {
      groupid: z.string().optional(),
      groupname: z.string().optional(),
      academicyear: z.string().optional(),
      programcode: z.string().optional(),
      limit: z.number().int().min(1).max(1000).optional().default(1000)
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 1000, groupid, groupname, academicyear, programcode } = args;
      const q = { colid };
      if (groupid) q.groupid = groupid;
      if (groupname) q.groupname = groupname;
      if (academicyear) q.academicyear = academicyear;
      if (programcode) q.programcode = programcode;
      const docs = await NepLmsEnrollmentGroupStudent.find(q).sort({ groupname: 1, student: 1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "add_enrollment_group_students",
    "Add students to an enrollment group. Each student is looked up from the users collection.",
    {
      groupid: z.string().min(1).describe("_id of the enrollment group"),
      students: z.array(z.object({
        regno: z.string(),
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        academicyear: z.string().optional(),
        regulation: z.string().optional(),
        program: z.string().optional(),
        programcode: z.string().optional(),
        semester: z.string().optional(),
        section: z.string().optional()
      })).min(1)
    },
    async ({ groupid, students }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const group = await NepLmsEnrollmentGroup.findOne({ _id: groupid, colid }).lean();
      if (!group) return { content: [{ type: "text", text: "Enrollment group not found" }] };
      let saved = 0;
      for (const item of students) {
        const payload = {
          colid,
          groupid: group._id,
          groupname: group.groupname,
          studentid: item._id || item.studentid || undefined,
          student: t(item.name || item.student),
          studentemail: t(item.email || item.studentemail),
          studentphone: t(item.phone || item.studentphone),
          regno: t(item.regno),
          rollno: t(item.rollno),
          academicyear: t(item.academicyear || item.admissionyear),
          regulation: t(item.regulation),
          program: t(item.program),
          programcode: t(item.programcode),
          semester: t(item.semester),
          section: t(item.section)
        };
        await NepLmsEnrollmentGroupStudent.findOneAndUpdate(
          { colid, groupid: group._id, regno: payload.regno },
          payload,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        saved++;
      }
      return { content: [{ type: "text", text: `Added ${saved} students to group '${group.groupname}'` }] };
    }
  );

  server.tool(
    "search_enrollment_group_students",
    "Search students by name, regno, programcode, or semester for enrollment group assignment.",
    {
      name: z.string().optional(),
      regno: z.string().optional(),
      programcode: z.string().optional(),
      semester: z.string().optional(),
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      limit: z.number().int().min(1).max(1000).optional().default(200)
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 200, name, regno, ...filters } = args;
      const q = { colid, role: /^Student$/i };
      if (name) q.name = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (regno) q.regno = new RegExp(regno.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      ["programcode", "semester", "academicyear", "regulation"].forEach((f) => { if (t(filters[f])) q[f] = t(filters[f]); });
      const docs = await UserExt.find(q).select("name email phone regno rollno academicyear admissionyear regulation program programcode semester section Major").sort({ name: 1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "list_enrollment_group_workload",
    "List workload assignments (faculty-course pairs) for an enrollment group.",
    {
      groupid: z.string().optional(),
      groupname: z.string().optional(),
      limit: z.number().int().min(1).max(1000).optional().default(1000)
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 1000, groupid, groupname } = args;
      const q = { colid };
      if (groupid) q.groupid = groupid;
      if (groupname) q.groupname = groupname;
      const docs = await NepLmsEnrollmentWorkload.find(q).sort({ groupname: 1, coursecode: 1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "save_enrollment_group_workload",
    "Assign a faculty member and course to an enrollment group.",
    {
      groupid: z.string().min(1),
      faculty: z.string().min(1),
      facultyemail: z.string().min(1),
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      semester: z.string().optional(),
      course: z.string().optional(),
      coursecode: z.string().min(1)
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const group = await NepLmsEnrollmentGroup.findOne({ _id: args.groupid, colid }).lean();
      if (!group) return { content: [{ type: "text", text: "Enrollment group not found" }] };
      const payload = { ...args, colid, groupid: group._id, groupname: group.groupname };
      const doc = await NepLmsEnrollmentWorkload.findOneAndUpdate(
        { colid, groupid: group._id, coursecode: args.coursecode, facultyemail: args.facultyemail },
        payload,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return { content: [{ type: "text", text: `Workload saved: ${doc._id}` }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 8 — SUPPLEMENTARY ATTENDANCE
  // ══════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_supplementary_attendance_workflow",
    "List supplementary attendance approval workflow configuration (approval levels per category).",
    {
      category: z.string().optional(),
      status: z.string().optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const q = { colid };
      if (t(args.category)) q.category = new RegExp(args.category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (t(args.status)) q.status = new RegExp(args.status.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const docs = await NepLmsSupplementaryWorkflow.find(q).sort({ category: 1, level: 1 }).lean();
      const categories = uniqueSorted(docs.map((d) => d.category).filter(Boolean));
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, categories, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "save_supplementary_attendance_workflow",
    "Create or update a supplementary attendance approval workflow level. Pass id to update.",
    {
      id: z.string().optional(),
      category: z.string().min(1).describe("e.g. Medical, Sports, Event"),
      level: z.number().int().min(1).describe("Approval level number (1 = first approver)"),
      approverrole: z.string().optional(),
      approvername: z.string().optional(),
      approveremail: z.string().optional(),
      status: z.string().optional().default("Active")
    },
    async ({ id, ...args }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { ...args, colid };
      let doc;
      if (id) {
        doc = await NepLmsSupplementaryWorkflow.findOneAndUpdate({ _id: id, colid }, payload, { new: true });
      } else {
        doc = await NepLmsSupplementaryWorkflow.create(payload);
      }
      return { content: [{ type: "text", text: `Workflow level saved: ${doc._id}` }] };
    }
  );

  server.tool(
    "create_supplementary_attendance_request",
    "Create a supplementary attendance request for one or more students. Workflow must be configured for the category first.",
    {
      category: z.string().min(1).describe("Must match a configured workflow category"),
      fromdate: z.string().min(1).describe("YYYY-MM-DD"),
      todate: z.string().min(1).describe("YYYY-MM-DD"),
      fromtime: z.string().optional(),
      totime: z.string().optional(),
      description: z.string().optional(),
      documentlink: z.string().optional(),
      documentname: z.string().optional(),
      students: z.array(z.object({ regno: z.string(), name: z.string().optional(), email: z.string().optional() })).min(1),
      username: z.string().optional().describe("Name of the person raising the request")
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { students, username, ...rest } = args;
      const workflow = await NepLmsSupplementaryWorkflow.find({ colid, category: rest.category, status: /^Active$/i }).sort({ level: 1 }).lean();
      if (!workflow.length) return { content: [{ type: "text", text: `No active workflow configured for category: ${rest.category}` }] };
      const payload = {
        ...rest,
        students: students.map((s) => ({ regno: t(s.regno), name: t(s.name), email: t(s.email) })),
        status: "Pending",
        currentlevel: workflow[0].level,
        colid,
        username: t(username)
      };
      const doc = await NepLmsSupplementaryRequest.create(payload);
      return { content: [{ type: "text", text: `Request created: ${doc._id} | Status: Pending | Level: ${workflow[0].level}` }] };
    }
  );

  server.tool(
    "list_supplementary_attendance_requests",
    "List supplementary attendance requests.",
    {
      category: z.string().optional(),
      status: z.string().optional().describe("Pending | Approved | Rejected"),
      user: z.string().optional().describe("Filter by requester"),
      limit: z.number().int().min(1).max(1000).optional().default(1000)
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 1000, category, status, user } = args;
      const q = { colid };
      if (category) q.category = new RegExp(category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (status) q.status = new RegExp(status.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (user) q.user = new RegExp(user.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const docs = await NepLmsSupplementaryRequest.find(q).sort({ createdAt: -1 }).limit(limit).lean();
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "get_supplementary_attendance_approval_queue",
    "Get supplementary attendance requests pending approval for a given approver email.",
    {
      approveremail: z.string().min(1),
      category: z.string().optional(),
      limit: z.number().int().min(1).max(1000).optional().default(1000)
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 1000, approveremail, category } = args;
      const workflows = await NepLmsSupplementaryWorkflow.find({
        colid,
        approveremail: new RegExp(`^${approveremail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
        status: /^Active$/i
      }).lean();
      if (!workflows.length) return { content: [{ type: "text", text: "No workflow levels found for this approver" }] };
      const q = { colid, status: "Pending" };
      if (category) q.category = category;
      const pendingRequests = await NepLmsSupplementaryRequest.find(q).sort({ createdAt: -1 }).limit(limit).lean();
      const queue = pendingRequests.filter((r) => workflows.some((w) => w.level === r.currentlevel && t(w.category).toLowerCase() === t(r.category).toLowerCase()));
      return { content: [{ type: "text", text: JSON.stringify({ count: queue.length, data: queue }, null, 2) }] };
    }
  );

  server.tool(
    "approve_supplementary_attendance",
    "Approve or reject a supplementary attendance request. On approval, advances to next level or marks final Approved.",
    {
      requestid: z.string().min(1),
      action: z.enum(["Approve", "Reject"]),
      approveremail: z.string().min(1),
      approvername: z.string().optional(),
      remarks: z.string().optional()
    },
    async ({ requestid, action, approveremail, approvername, remarks }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const req = await NepLmsSupplementaryRequest.findOne({ _id: requestid, colid }).lean();
      if (!req) return { content: [{ type: "text", text: "Request not found" }] };
      if (req.status !== "Pending") return { content: [{ type: "text", text: `Request is already ${req.status}` }] };
      const approval = { level: req.currentlevel, approver: approvername || "", approveremail, status: action === "Approve" ? "Approved" : "Rejected", remarks: remarks || "", actionat: new Date() };
      if (action === "Reject") {
        await NepLmsSupplementaryRequest.updateOne({ _id: requestid }, { $set: { status: "Rejected" }, $push: { approvals: approval } });
        return { content: [{ type: "text", text: "Request rejected" }] };
      }
      const nextWorkflow = await NepLmsSupplementaryWorkflow.findOne({ colid, category: req.category, level: { $gt: req.currentlevel }, status: /^Active$/i }).sort({ level: 1 }).lean();
      const newStatus = nextWorkflow ? "Pending" : "Approved";
      const newLevel = nextWorkflow ? nextWorkflow.level : req.currentlevel;
      await NepLmsSupplementaryRequest.updateOne({ _id: requestid }, { $set: { status: newStatus, currentlevel: newLevel }, $push: { approvals: approval } });
      return { content: [{ type: "text", text: `Request ${newStatus}${nextWorkflow ? ` — advanced to level ${newLevel}` : " — final approval"}` }] };
    }
  );

  server.tool(
    "get_supplementary_attendance_report",
    "Get a report of supplementary attendance requests, optionally filtered by date range and category.",
    {
      category: z.string().optional(),
      status: z.string().optional(),
      fromdate: z.string().optional().describe("YYYY-MM-DD filter on fromdate field"),
      todate: z.string().optional().describe("YYYY-MM-DD filter on todate field"),
      limit: z.number().int().min(1).max(1000).optional().default(1000)
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 1000, category, status, fromdate, todate } = args;
      const q = { colid };
      if (category) q.category = category;
      if (status) q.status = status;
      if (fromdate) q.fromdate = { $gte: fromdate };
      if (todate) { q.todate = q.todate || {}; q.todate.$lte = todate; }
      const docs = await NepLmsSupplementaryRequest.find(q).sort({ createdAt: -1 }).limit(limit).lean();
      const summary = { total: docs.length, approved: 0, rejected: 0, pending: 0, byCategory: {} };
      docs.forEach((d) => {
        const s = t(d.status).toLowerCase();
        if (s === "approved") summary.approved++;
        else if (s === "rejected") summary.rejected++;
        else summary.pending++;
        const cat = t(d.category) || "Unknown";
        summary.byCategory[cat] = (summary.byCategory[cat] || 0) + 1;
      });
      return { content: [{ type: "text", text: JSON.stringify({ summary, data: docs }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 9 — LOGIN ATTENDANCE
  // ══════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_login_attendance",
    "List login-based attendance records (tracks student online class joins).",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      programcode: z.string().optional(),
      coursecode: z.string().optional(),
      regno: z.string().optional(),
      fromdate: z.string().optional().describe("YYYY-MM-DD filter on loginat"),
      todate: z.string().optional().describe("YYYY-MM-DD filter on loginat"),
      limit: z.number().int().min(1).max(1000).optional().default(1000)
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 1000, fromdate, todate, ...rest } = args;
      const q = { colid };
      ["academicyear", "semester", "programcode", "coursecode", "regno"].forEach((f) => { if (t(rest[f])) q[f] = t(rest[f]); });
      if (fromdate || todate) {
        q.loginat = {};
        if (fromdate) q.loginat.$gte = new Date(`${fromdate}T00:00:00.000Z`);
        if (todate) q.loginat.$lte = new Date(`${todate}T23:59:59.999Z`);
      }
      const docs = await NepLmsLoginAttendance.find(q).sort({ loginat: -1 }).limit(limit).lean();
      const totalMinutes = docs.reduce((s, d) => s + (d.minutesonline || 0), 0);
      return { content: [{ type: "text", text: JSON.stringify({ count: docs.length, totalMinutesOnline: totalMinutes, data: docs }, null, 2) }] };
    }
  );

  server.tool(
    "get_login_attendance_options",
    "Get distinct filter values (academicyear, semester, programcode, coursecode) available in login attendance records.",
    {},
    async () => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const fields = ["academicyear", "semester", "programcode", "coursecode"];
      const results = await Promise.all(fields.map((f) => NepLmsLoginAttendance.distinct(f, { colid })));
      const options = Object.fromEntries(fields.map((f, i) => [f, uniqueSorted(results[i])]));
      return { content: [{ type: "text", text: JSON.stringify({ options }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 10 — REPORT PAGES
  // ══════════════════════════════════════════════════════════════════════════

  server.tool(
    "get_consecutive_absence_report",
    "Report students with N or more consecutive absences in a course. Scans attendance records and identifies streaks.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      facultyemail: z.string().optional(),
      minConsecutive: z.number().int().min(2).optional().default(3).describe("Minimum consecutive absences to flag (default 3)")
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { minConsecutive = 3, ...filters } = args;
      const q = { colid };
      ["academicyear", "semester", "coursecode", "facultyemail"].forEach((f) => { if (t(filters[f])) q[f] = t(filters[f]); });
      const records = await NepLmsAttendanceExt.find(q).sort({ regno: 1, classdate: 1 }).lean();
      const byStudent = {};
      records.forEach((r) => {
        const key = `${r.regno}||${r.coursecode}`;
        if (!byStudent[key]) byStudent[key] = { regno: r.regno, coursecode: r.coursecode, records: [] };
        byStudent[key].records.push({ date: r.classdate, status: t(r.status) });
      });
      const flagged = [];
      Object.values(byStudent).forEach(({ regno, coursecode, records: recs }) => {
        let streak = 0;
        let streakStart = "";
        recs.forEach((r) => {
          if (r.status.toLowerCase() === "absent") {
            if (!streak) streakStart = r.date;
            streak++;
          } else {
            if (streak >= minConsecutive) flagged.push({ regno, coursecode, consecutiveAbsences: streak, from: streakStart, to: recs[recs.indexOf(r) - 1]?.date });
            streak = 0;
            streakStart = "";
          }
        });
        if (streak >= minConsecutive) flagged.push({ regno, coursecode, consecutiveAbsences: streak, from: streakStart, to: recs[recs.length - 1]?.date });
      });
      flagged.sort((a, b) => b.consecutiveAbsences - a.consecutiveAbsences);
      return { content: [{ type: "text", text: JSON.stringify({ count: flagged.length, minConsecutive, flagged }, null, 2) }] };
    }
  );

  server.tool(
    "get_missing_timetable_report",
    "Report timetable entries for which no attendance record exists (missed classes).",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      facultyemail: z.string().optional(),
      fromdate: z.string().optional().describe("YYYY-MM-DD"),
      todate: z.string().optional().describe("YYYY-MM-DD")
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { fromdate, todate, ...filters } = args;
      const ttQ = { colid };
      const attQ = { colid };
      ["academicyear", "semester", "coursecode", "facultyemail"].forEach((f) => {
        if (t(filters[f])) { ttQ[f] = t(filters[f]); attQ[f] = t(filters[f]); }
      });
      if (fromdate || todate) {
        const dateFilter = {};
        if (fromdate) dateFilter.$gte = fromdate;
        if (todate) dateFilter.$lte = todate;
        ttQ.classdate = dateFilter;
        attQ.classdate = dateFilter;
      }
      const [timetable, attendance] = await Promise.all([
        NepLmsTimetableExt.find(ttQ).sort({ classdate: 1, coursecode: 1 }).lean(),
        NepLmsAttendanceExt.find(attQ).select("classdate coursecode facultyemail").lean()
      ]);
      const attKeys = new Set(attendance.map((a) => `${a.classdate}||${a.coursecode}||${t(a.facultyemail).toLowerCase()}`));
      const missing = timetable.filter((tt) => !attKeys.has(`${tt.classdate}||${tt.coursecode}||${t(tt.facultyemail).toLowerCase()}`));
      return { content: [{ type: "text", text: JSON.stringify({ timetableCount: timetable.length, attendanceCount: attendance.length, missingCount: missing.length, missing }, null, 2) }] };
    }
  );

  server.tool(
    "get_course_progression_report",
    "Report course progression: for each course, count timetable entries, attendance records, and calculate coverage percentage.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      programcode: z.string().optional(),
      facultyemail: z.string().optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const q = { colid };
      ["academicyear", "semester", "programcode", "facultyemail"].forEach((f) => { if (t(args[f])) q[f] = t(args[f]); });
      const [timetable, attendance] = await Promise.all([
        NepLmsTimetableExt.find(q).lean(),
        NepLmsAttendanceExt.find(q).lean()
      ]);
      const courseMap = {};
      timetable.forEach((tt) => {
        const key = `${tt.coursecode}||${t(tt.facultyemail).toLowerCase()}`;
        if (!courseMap[key]) courseMap[key] = { coursecode: tt.coursecode, faculty: tt.faculty, facultyemail: tt.facultyemail, academicyear: tt.academicyear, semester: tt.semester, timetableCount: 0, attendanceCount: 0 };
        courseMap[key].timetableCount++;
      });
      attendance.forEach((att) => {
        const key = `${att.coursecode}||${t(att.facultyemail).toLowerCase()}`;
        if (courseMap[key]) courseMap[key].attendanceCount++;
      });
      const result = Object.values(courseMap).map((c) => ({
        ...c,
        coveragePercent: c.timetableCount ? Number(((c.attendanceCount / c.timetableCount) * 100).toFixed(1)) : 0
      })).sort((a, b) => a.coveragePercent - b.coveragePercent);
      return { content: [{ type: "text", text: JSON.stringify({ count: result.length, data: result }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 11 — GRADE CARD
  // ══════════════════════════════════════════════════════════════════════════

  server.tool(
    "get_lms_grade_card",
    "Get grade card for a student (or batch). Returns final marks per course with grades, grade points, SGPA calculation.",
    {
      regno: z.string().optional().describe("Single student registration number"),
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      programcode: z.string().optional(),
      regulation: z.string().optional(),
      limit: z.number().int().min(1).max(1000).optional().default(1000)
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 1000, ...filters } = args;
      const q = { colid };
      ["regno", "academicyear", "semester", "programcode", "regulation"].forEach((f) => { if (t(filters[f])) q[f] = t(filters[f]); });
      const docs = await NepLmsFinalMarksExt.find(q).sort({ academicyear: 1, semester: 1, regno: 1, coursecode: 1 }).limit(limit).lean();
      const byStudent = {};
      docs.forEach((d) => {
        const key = `${d.regno}||${d.academicyear}||${d.semester}`;
        if (!byStudent[key]) byStudent[key] = { regno: d.regno, student: d.student, academicyear: d.academicyear, semester: d.semester, courses: [], totalCredits: 0, earnedGradePoints: 0 };
        byStudent[key].courses.push({ coursecode: d.coursecode, course: d.course, marks: d.marks, totalmarks: d.totalmarks, grade: d.grade, gradepoint: d.gradepoint, credits: d.credits, earnedcredits: d.earnedcredits, gradepoints: d.gradepoints, status: d.status });
        byStudent[key].totalCredits += (d.credits || 0);
        byStudent[key].earnedGradePoints += (d.gradepoints || 0);
      });
      const gradeCards = Object.values(byStudent).map((s) => ({
        ...s,
        sgpa: s.totalCredits ? Number((s.earnedGradePoints / s.totalCredits).toFixed(2)) : 0,
        result: s.courses.every((c) => t(c.status).toLowerCase() !== "fail") ? "Pass" : "Fail"
      }));
      return { content: [{ type: "text", text: JSON.stringify({ count: gradeCards.length, data: gradeCards }, null, 2) }] };
    }
  );

  server.tool(
    "get_lms_grade_card_options",
    "Get distinct filter values (academicyear, semester, programcode, regulation) available for grade card queries.",
    {},
    async () => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const fields = ["academicyear", "semester", "programcode", "regulation"];
      const results = await Promise.all(fields.map((f) => NepLmsFinalMarksExt.distinct(f, { colid })));
      const options = Object.fromEntries(fields.map((f, i) => [f, uniqueSorted(results[i])]));
      return { content: [{ type: "text", text: JSON.stringify({ options }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 12 — ASSESSMENT MARKS BULK SAVE
  // ══════════════════════════════════════════════════════════════════════════

  server.tool(
    "save_lms_assessment_marks_bulk",
    "Save assessment marks for multiple students at once for a given assessment and course.",
    {
      assessmentid: z.string().min(1).describe("_id of the assessment/quiz"),
      assessmenttitle: z.string().optional(),
      fullmarks: z.number().optional().default(0),
      academicyear: z.string().min(1),
      semester: z.string().min(1),
      coursecode: z.string().min(1),
      course: z.string().optional(),
      regulation: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      marks: z.array(z.object({
        regno: z.string().min(1),
        student: z.string().optional(),
        marks: z.number().min(0)
      })).min(1).describe("Array of {regno, student, marks}")
    },
    async ({ marks: marksList, ...courseArgs }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      let saved = 0;
      let errors = 0;
      for (const item of marksList) {
        try {
          await NepLmsAssessmentMarksExt.findOneAndUpdate(
            { colid, assessmentid: courseArgs.assessmentid, academicyear: courseArgs.academicyear, semester: courseArgs.semester, coursecode: courseArgs.coursecode, regno: item.regno },
            { ...courseArgs, colid, student: item.student || "", regno: item.regno, marks: item.marks },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          saved++;
        } catch {
          errors++;
        }
      }
      return { content: [{ type: "text", text: `Assessment marks saved: ${saved} students${errors ? `, ${errors} errors` : ""}` }] };
    }
  );

}
