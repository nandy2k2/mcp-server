/**
 * NEP-LMS Attendance Tools
 *
 * Mirrors NepLmsAttendancePage.jsx and the full backend controller
 * (neplmsattendancectlrds.js).
 *
 * Flow on the page:
 *   1. Faculty selects filters → get_lms_attendance_context
 *      → returns their assigned courses + matching timetable classes.
 *   2. Faculty clicks a class from the calendar
 *      → get_lms_students_for_class  (students + existing attendance status)
 *   3. Faculty marks P/A and hits Save
 *      → mark_lms_attendance  (upsert per student, Regular or Supplementary)
 *
 * Additional tools:
 *   • update/delete individual records
 *   • bulk upload from JSON or Excel
 *   • Excel template download
 *   • Reports: studentwise, student-coursewise, low-attendance,
 *              faculty-course-low-attendance, datewise
 */

import { z } from "zod";
import mongoose from "mongoose";
import * as XLSX from "xlsx";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const workloadAssignmentSchema = new mongoose.Schema(
  {
    academicyear: String, regulation: String, program: String, programcode: String,
    type: String, subject: String, semester: String, course: String, coursecode: String,
    facultyname: String, facultyemail: String, facultydepartment: String,
    status: { type: String, default: "Active" },
    colid: { type: Number, required: true, index: true }, user: String
  },
  { timestamps: true }
);

const nepLmsTimetableSchema = new mongoose.Schema(
  {
    academicyear: String, regulation: String, program: String, programcode: String,
    faculty: String, facultyemail: String, major: String, semester: String,
    course: String, coursecode: String, classdate: String, classtime: String,
    period: String, durationminutes: { type: Number, default: 0 }, module: String,
    topic: String, workcompleted: { type: String, default: "" },
    status: { type: String, default: "Active" },
    colid: { type: Number, required: true, index: true }, user: String
  },
  { timestamps: true }
);

const nepLmsAttendanceSchema = new mongoose.Schema(
  {
    classid: mongoose.Schema.Types.ObjectId,
    studentid: mongoose.Schema.Types.ObjectId,
    student: String, studentemail: String, studentphone: String, regno: String,
    program: String, programcode: String, academicyear: String, semester: String,
    major: String, faculty: String, facultyemail: String,
    course: String, coursecode: String, classdate: String, classtime: String,
    attendance: { type: Number, enum: [0, 1], default: 1 },
    type: { type: String, default: "Regular" },
    comments: String,
    colid: { type: Number, required: true }, user: String
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: String, email: String, phone: String, role: String,
    regno: String, programcode: String, regulation: String,
    admissionyear: String, semester: String, section: String,
    gender: String, department: String, category: String,
    Major: String, Minor: String,
    colid: { type: Number, required: true }, user: String
  },
  { strict: false }
);

// ─── Models (with guard) ──────────────────────────────────────────────────────
const WorkloadAssignment = mongoose.models.workloadassignmentds
  || mongoose.model("workloadassignmentds", workloadAssignmentSchema);
const NepLmsTimetable = mongoose.models.neplmstimetableds
  || mongoose.model("neplmstimetableds", nepLmsTimetableSchema);
const NepLmsAttendance = mongoose.models.NepLmsAttendance
  || mongoose.model("NepLmsAttendance", nepLmsAttendanceSchema);
// Use a unique model name with explicit collection so we never shadow the
// "Users" model that index.js/server.js owns for login authentication.
const UserModel = mongoose.models.AttendanceUserLookup
  || mongoose.model("AttendanceUserLookup", userSchema, "users");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const t = (v) => String(v || "").trim();
const normalizeHeader = (v) => t(v).toLowerCase().replace(/[^a-z0-9]/g, "");

function buildStudentwiseSummary(data) {
  const map = new Map();
  data.forEach((row) => {
    const key = String(row.studentid || row.regno || row.student || "");
    if (!map.has(key)) {
      map.set(key, {
        studentid: row.studentid, student: row.student || "",
        regno: row.regno || "", email: row.studentemail || "",
        phone: row.studentphone || "", program: row.program || "",
        programcode: row.programcode || "", academicyear: row.academicyear || "",
        semester: row.semester || "", major: row.major || "",
        total: 0, present: 0, absent: 0, percentage: 0
      });
    }
    const item = map.get(key);
    item.total += 1;
    if (Number(row.attendance) === 1) item.present += 1;
    else item.absent += 1;
    item.percentage = item.total ? +((item.present / item.total) * 100).toFixed(2) : 0;
  });
  return [...map.values()].sort((a, b) => t(a.student).localeCompare(t(b.student)));
}

function groupByField(data, field) {
  const map = new Map();
  data.forEach((row) => {
    const key = row[field] || "-";
    const cur = map.get(key) || { name: key, total: 0, present: 0, absent: 0, percentage: 0 };
    cur.total += 1;
    if (Number(row.attendance) === 1) cur.present += 1;
    else cur.absent += 1;
    cur.percentage = cur.total ? +((cur.present / cur.total) * 100).toFixed(2) : 0;
    map.set(key, cur);
  });
  return [...map.values()].sort((a, b) => t(a.name).localeCompare(t(b.name)));
}

function uniqSorted(data, field) {
  return [...new Set(data.map((row) => t(row[field])).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

// ─── Registrar ────────────────────────────────────────────────────────────────
export function registerNepLmsAttendanceTools(server, { requireAuth, resolveColid, resolveUser, connectDB }) {

  // ═══════════════════════════════════════════════════════════════════════════
  // 1.  CONTEXT — assigned courses + matching timetable classes for a faculty
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "get_lms_attendance_context",
    "Get a faculty's active workload assignments and the matching timetable classes (used to populate the attendance class calendar). Pass facultyemail to filter for a specific faculty; omit to use the logged-in user.",
    {
      facultyemail: z.string().optional().describe("Faculty email — defaults to logged-in user"),
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      programcode: z.string().optional(),
      coursecode: z.string().optional(),
      from_date: z.string().optional().describe("YYYY-MM-DD — filter classes from this date"),
      to_date: z.string().optional().describe("YYYY-MM-DD — filter classes to this date")
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const user = resolveUser();
      const email = t(args.facultyemail || user);

      // Active workload assignments for this faculty
      const assignmentQuery = { colid, status: /^Active$/i };
      if (email) assignmentQuery.facultyemail = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
      if (args.academicyear) assignmentQuery.academicyear = args.academicyear;
      if (args.semester) assignmentQuery.semester = args.semester;
      if (args.programcode) assignmentQuery.programcode = args.programcode;
      if (args.coursecode) assignmentQuery.coursecode = args.coursecode;

      const assignments = await WorkloadAssignment.find(assignmentQuery)
        .sort({ academicyear: -1, semester: 1, course: 1 }).lean();

      // Timetable classes for those courses
      const courseCodes = [...new Set(assignments.map((a) => t(a.coursecode)).filter(Boolean))];
      const classQuery = { colid };
      if (courseCodes.length) classQuery.coursecode = { $in: courseCodes };
      if (args.from_date || args.to_date) {
        classQuery.classdate = {};
        if (args.from_date) classQuery.classdate.$gte = args.from_date;
        if (args.to_date) classQuery.classdate.$lte = args.to_date;
      }

      const classes = await NepLmsTimetable.find(classQuery)
        .sort({ classdate: 1, classtime: 1 }).lean();

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            assignments: { count: assignments.length, data: assignments },
            classes: { count: classes.length, data: classes }
          }, null, 2)
        }]
      };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 2.  STUDENTS FOR A CLASS — with existing attendance pre-loaded
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "get_lms_students_for_class",
    "Get the list of students eligible for a class along with their existing attendance status (if already marked). Filters students by programcode, admissionyear (=academicyear), semester, major (=subject/Major), and optional section. Returns existingAttendance (1=Present, 0=Absent, null=not yet marked).",
    {
      classid: z.string().min(1).describe("_id of the NepLmsTimetable class entry"),
      academicyear: z.string().optional().describe("Used as admissionyear filter for students"),
      semester: z.string().optional(),
      programcode: z.string().optional(),
      major: z.string().optional().describe("Maps to student.Major field"),
      section: z.string().optional(),
      attendance_type: z.enum(["Regular", "Supplementary"]).default("Regular").optional(),
      // extra student search filters
      name: z.string().optional(),
      regno: z.string().optional(),
      email: z.string().optional(),
      gender: z.string().optional(),
      category: z.string().optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const attendanceType = args.attendance_type || "Regular";

      // Build student query
      const studentQuery = { colid, role: /^Student$/i };
      if (args.academicyear) studentQuery.admissionyear = t(args.academicyear);
      if (args.semester) studentQuery.semester = t(args.semester);
      if (args.programcode) studentQuery.programcode = t(args.programcode);
      if (args.major) studentQuery.Major = t(args.major);
      if (args.section) studentQuery.section = t(args.section);
      if (args.name) studentQuery.name = new RegExp(t(args.name), "i");
      if (args.email) studentQuery.email = new RegExp(t(args.email), "i");
      if (args.regno) studentQuery.regno = new RegExp(t(args.regno), "i");
      if (args.gender) studentQuery.gender = t(args.gender);
      if (args.category) studentQuery.category = t(args.category);

      const [students, attendanceRows] = await Promise.all([
        UserModel.find(studentQuery)
          .select("name email phone regno admissionyear programcode regulation Major Minor semester section category gender department colid")
          .sort({ name: 1, regno: 1 }).lean(),
        args.classid
          ? NepLmsAttendance.find({ colid, classid: args.classid, type: attendanceType }).lean()
          : []
      ]);

      const attendanceByStudent = new Map(
        attendanceRows.map((row) => [String(row.studentid), row])
      );

      const data = students.map((student) => {
        const existing = attendanceByStudent.get(String(student._id));
        return {
          ...student,
          existingAttendance: existing?.attendance ?? null,   // 1, 0, or null
          attendanceId: existing?._id ?? null,
          attendanceComments: existing?.comments ?? ""
        };
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            classid: args.classid,
            attendanceType,
            studentCount: data.length,
            markedCount: attendanceRows.length,
            data
          }, null, 2)
        }]
      };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 3.  MARK ATTENDANCE — batch upsert (the main "Save Attendance" action)
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "mark_lms_attendance",
    "Save (upsert) attendance for a class. Provide classInfo (the timetable entry fields) plus an array of students each with attendance=1 (present) or 0 (absent). Existing records are updated, new ones are created. Supports Regular and Supplementary types.",
    {
      classid: z.string().min(1).describe("_id of the NepLmsTimetable entry"),
      classdate: z.string().optional().describe("YYYY-MM-DD"),
      classtime: z.string().optional(),
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      course: z.string().optional(),
      coursecode: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      major: z.string().optional(),
      faculty: z.string().optional(),
      facultyemail: z.string().optional(),
      attendance_type: z.enum(["Regular", "Supplementary"]).default("Regular").optional(),
      comments: z.string().optional(),
      students: z.array(z.object({
        studentid: z.string().describe("_id of the student (Users collection)"),
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        regno: z.string().optional(),
        programcode: z.string().optional(),
        semester: z.string().optional(),
        Major: z.string().optional(),
        section: z.string().optional(),
        attendance: z.number().int().min(0).max(1).describe("1 = Present, 0 = Absent")
      })).min(1).max(1000)
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const user = resolveUser();
      const attendanceType = args.attendance_type || "Regular";
      const comments = t(args.comments);

      const classInfo = {
        _id: args.classid,
        classdate: t(args.classdate),
        classtime: t(args.classtime),
        academicyear: t(args.academicyear),
        semester: t(args.semester),
        course: t(args.course),
        coursecode: t(args.coursecode),
        program: t(args.program),
        programcode: t(args.programcode),
        major: t(args.major),
        faculty: t(args.faculty),
        facultyemail: t(args.facultyemail)
      };

      // If any class fields are missing, fetch from DB
      if (!classInfo.classdate || !classInfo.coursecode) {
        const classDoc = await NepLmsTimetable.findById(args.classid).lean();
        if (!classDoc) return { content: [{ type: "text", text: "Class not found" }] };
        Object.assign(classInfo, {
          classdate: classInfo.classdate || t(classDoc.classdate),
          classtime: classInfo.classtime || t(classDoc.classtime),
          academicyear: classInfo.academicyear || t(classDoc.academicyear),
          semester: classInfo.semester || t(classDoc.semester),
          course: classInfo.course || t(classDoc.course),
          coursecode: classInfo.coursecode || t(classDoc.coursecode),
          program: classInfo.program || t(classDoc.program),
          programcode: classInfo.programcode || t(classDoc.programcode),
          major: classInfo.major || t(classDoc.major),
          faculty: classInfo.faculty || t(classDoc.faculty),
          facultyemail: classInfo.facultyemail || t(classDoc.facultyemail)
        });
      }

      const saved = [];
      const errors = [];
      for (const item of args.students) {
        if (!item.studentid) { errors.push("studentid missing"); continue; }
        const payload = {
          classid: args.classid,
          studentid: item.studentid,
          student: t(item.name),
          studentemail: t(item.email),
          studentphone: t(item.phone),
          regno: t(item.regno),
          program: classInfo.program,
          programcode: t(item.programcode) || classInfo.programcode,
          academicyear: classInfo.academicyear,
          semester: t(item.semester) || classInfo.semester,
          major: t(item.Major) || classInfo.major,
          faculty: classInfo.faculty,
          facultyemail: classInfo.facultyemail,
          course: classInfo.course,
          coursecode: classInfo.coursecode,
          classdate: classInfo.classdate,
          classtime: classInfo.classtime,
          attendance: Number(item.attendance) === 0 ? 0 : 1,
          type: attendanceType,
          comments,
          colid,
          user
        };
        const row = await NepLmsAttendance.findOneAndUpdate(
          { colid, classid: args.classid, studentid: item.studentid, type: attendanceType },
          payload,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        saved.push(row);
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            saved: saved.length,
            errors: errors.length ? errors : undefined,
            classid: args.classid,
            classdate: classInfo.classdate,
            coursecode: classInfo.coursecode,
            type: attendanceType
          }, null, 2)
        }]
      };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 4.  MARK SINGLE STUDENT ATTENDANCE
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "mark_single_lms_attendance",
    "Mark or update attendance for a single student in a class. Creates the record if it doesn't exist (upsert).",
    {
      classid: z.string().min(1),
      studentid: z.string().min(1),
      attendance: z.number().int().min(0).max(1).describe("1=Present, 0=Absent"),
      attendance_type: z.enum(["Regular", "Supplementary"]).default("Regular").optional(),
      comments: z.string().optional(),
      // Class context fields (auto-fetched from timetable if omitted)
      classdate: z.string().optional(),
      classtime: z.string().optional(),
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      course: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      major: z.string().optional(),
      faculty: z.string().optional(),
      facultyemail: z.string().optional(),
      // Student context fields (auto-fetched from Users if omitted)
      student_name: z.string().optional(),
      student_email: z.string().optional(),
      student_phone: z.string().optional(),
      regno: z.string().optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const user = resolveUser();
      const attendanceType = args.attendance_type || "Regular";

      // Fetch class info if needed
      let classdate = t(args.classdate);
      let classtime = t(args.classtime);
      let academicyear = t(args.academicyear);
      let semester = t(args.semester);
      let coursecode = t(args.coursecode);
      let course = t(args.course);
      let program = t(args.program);
      let programcode = t(args.programcode);
      let major = t(args.major);
      let faculty = t(args.faculty);
      let facultyemail = t(args.facultyemail);

      if (!classdate || !coursecode) {
        const classDoc = await NepLmsTimetable.findById(args.classid).lean();
        if (!classDoc) return { content: [{ type: "text", text: "Class not found" }] };
        classdate = classdate || t(classDoc.classdate);
        classtime = classtime || t(classDoc.classtime);
        academicyear = academicyear || t(classDoc.academicyear);
        semester = semester || t(classDoc.semester);
        coursecode = coursecode || t(classDoc.coursecode);
        course = course || t(classDoc.course);
        program = program || t(classDoc.program);
        programcode = programcode || t(classDoc.programcode);
        major = major || t(classDoc.major);
        faculty = faculty || t(classDoc.faculty);
        facultyemail = facultyemail || t(classDoc.facultyemail);
      }

      // Fetch student info if needed
      let studentName = t(args.student_name);
      let studentEmail = t(args.student_email);
      let studentPhone = t(args.student_phone);
      let regno = t(args.regno);

      if (!studentName || !regno) {
        const studentDoc = await UserModel.findById(args.studentid)
          .select("name email phone regno programcode semester Major section").lean();
        if (studentDoc) {
          studentName = studentName || t(studentDoc.name);
          studentEmail = studentEmail || t(studentDoc.email);
          studentPhone = studentPhone || t(studentDoc.phone);
          regno = regno || t(studentDoc.regno);
          if (!programcode) programcode = t(studentDoc.programcode);
          if (!semester) semester = t(studentDoc.semester);
          if (!major) major = t(studentDoc.Major);
        }
      }

      const payload = {
        classid: args.classid, studentid: args.studentid,
        student: studentName, studentemail: studentEmail, studentphone: studentPhone, regno,
        program, programcode, academicyear, semester, major,
        faculty, facultyemail, course, coursecode, classdate, classtime,
        attendance: Number(args.attendance) === 0 ? 0 : 1,
        type: attendanceType, comments: t(args.comments), colid, user
      };

      const row = await NepLmsAttendance.findOneAndUpdate(
        { colid, classid: args.classid, studentid: args.studentid, type: attendanceType },
        payload,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            saved: true,
            id: row._id,
            student: studentName,
            regno,
            attendance: row.attendance === 1 ? "Present" : "Absent",
            type: attendanceType,
            classdate,
            coursecode
          }, null, 2)
        }]
      };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 5.  UPDATE ATTENDANCE RECORD
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "update_lms_attendance_record",
    "Update a specific attendance record by its _id (change present/absent status, comments, or type).",
    {
      id: z.string().min(1).describe("_id of the attendance record"),
      attendance: z.number().int().min(0).max(1).optional().describe("1=Present, 0=Absent"),
      comments: z.string().optional(),
      type: z.enum(["Regular", "Supplementary"]).optional()
    },
    async ({ id, attendance, comments, type }) => {
      requireAuth();
      await connectDB();
      const updates = {};
      if (attendance !== undefined) updates.attendance = Number(attendance) === 0 ? 0 : 1;
      if (comments !== undefined) updates.comments = comments;
      if (type !== undefined) updates.type = type;
      const doc = await NepLmsAttendance.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
      if (!doc) return { content: [{ type: "text", text: "Attendance record not found" }] };
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            updated: true, id: doc._id,
            student: doc.student, regno: doc.regno,
            attendance: doc.attendance === 1 ? "Present" : "Absent",
            type: doc.type, classdate: doc.classdate, coursecode: doc.coursecode
          }, null, 2)
        }]
      };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 6.  DELETE ATTENDANCE RECORD
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "delete_lms_attendance_record",
    "Delete a specific attendance record by its _id.",
    { id: z.string().min(1) },
    async ({ id }) => {
      requireAuth();
      await connectDB();
      const doc = await NepLmsAttendance.findByIdAndDelete(id).lean();
      if (!doc) return { content: [{ type: "text", text: "Record not found" }] };
      return { content: [{ type: "text", text: `Deleted attendance record: ${id} (${doc.student || doc.regno})` }] };
    }
  );

  server.tool(
    "delete_lms_attendance_for_class",
    "Delete ALL attendance records for a given class and type (use before re-marking a class).",
    {
      classid: z.string().min(1),
      attendance_type: z.enum(["Regular", "Supplementary"]).optional()
    },
    async ({ classid, attendance_type }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const query = { colid, classid };
      if (attendance_type) query.type = attendance_type;
      const result = await NepLmsAttendance.deleteMany(query);
      return { content: [{ type: "text", text: `Deleted ${result.deletedCount} attendance records for class ${classid}` }] };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 7.  BULK UPLOAD — JSON
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "bulk_upload_lms_attendance_from_json",
    "Bulk upsert attendance records from a JSON array. Each record must have classid, studentid, and attendance (0/1). Class context fields (classdate, coursecode etc.) and student name/regno are optional — they will be stored as-is.",
    {
      records: z.array(z.object({
        classid: z.string(),
        studentid: z.string(),
        attendance: z.number().int().min(0).max(1),
        attendance_type: z.enum(["Regular", "Supplementary"]).optional(),
        student: z.string().optional(),
        regno: z.string().optional(),
        studentemail: z.string().optional(),
        studentphone: z.string().optional(),
        academicyear: z.string().optional(),
        semester: z.string().optional(),
        coursecode: z.string().optional(),
        course: z.string().optional(),
        programcode: z.string().optional(),
        program: z.string().optional(),
        major: z.string().optional(),
        faculty: z.string().optional(),
        facultyemail: z.string().optional(),
        classdate: z.string().optional(),
        classtime: z.string().optional(),
        comments: z.string().optional()
      })).min(1).max(5000)
    },
    async ({ records }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const user = resolveUser();
      let saved = 0;
      const errors = [];
      for (const rec of records) {
        if (!rec.classid || !rec.studentid) { errors.push(`Missing classid/studentid`); continue; }
        const attendanceType = rec.attendance_type || "Regular";
        const payload = {
          classid: rec.classid, studentid: rec.studentid,
          attendance: Number(rec.attendance) === 0 ? 0 : 1,
          type: attendanceType,
          student: t(rec.student), studentemail: t(rec.studentemail),
          studentphone: t(rec.studentphone), regno: t(rec.regno),
          academicyear: t(rec.academicyear), semester: t(rec.semester),
          coursecode: t(rec.coursecode), course: t(rec.course),
          programcode: t(rec.programcode), program: t(rec.program),
          major: t(rec.major), faculty: t(rec.faculty),
          facultyemail: t(rec.facultyemail),
          classdate: t(rec.classdate), classtime: t(rec.classtime),
          comments: t(rec.comments), colid, user
        };
        await NepLmsAttendance.findOneAndUpdate(
          { colid, classid: rec.classid, studentid: rec.studentid, type: attendanceType },
          payload,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        saved += 1;
      }
      return { content: [{ type: "text", text: `Saved ${saved} of ${records.length} attendance records. ${errors.length ? `\nErrors: ${errors.join("; ")}` : ""}` }] };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 8.  BULK UPLOAD — EXCEL
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "bulk_upload_lms_attendance_from_excel",
    "Bulk upsert attendance from an Excel file (.xlsx). Required columns: Class ID, Student ID, Attendance (1/0). Optional: Attendance Type, Student Name, Reg No, Student Email, Academic Year, Semester, Course Code, Class Date, Faculty Email, Comments.",
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
        classid: ["classid", "class id", "classid"],
        studentid: ["studentid", "student id"],
        attendance: ["attendance", "present", "status"],
        attendance_type: ["attendancetype", "attendance type", "type"],
        student: ["student", "student name", "name"],
        regno: ["regno", "reg no", "registration no", "roll no"],
        studentemail: ["studentemail", "student email", "email"],
        studentphone: ["studentphone", "student phone", "phone"],
        academicyear: ["academicyear", "academic year", "year"],
        semester: ["semester", "sem"],
        coursecode: ["coursecode", "course code"],
        course: ["course"],
        programcode: ["programcode", "program code"],
        program: ["program"],
        major: ["major", "subject"],
        faculty: ["faculty", "faculty name"],
        facultyemail: ["facultyemail", "faculty email"],
        classdate: ["classdate", "class date", "date"],
        classtime: ["classtime", "class time", "time"],
        comments: ["comments", "remarks"]
      };

      const errors = [];
      let saved = 0;

      for (const [rowIdx, row] of raw.entries()) {
        const normalized = {};
        for (const [k, v] of Object.entries(row)) normalized[normalizeHeader(k)] = v;
        const mapped = {};
        for (const [field, aliases] of Object.entries(aliasMap)) {
          for (const alias of aliases) {
            const key = normalizeHeader(alias);
            if (normalized[key] !== undefined) { mapped[field] = normalized[key]; break; }
          }
        }

        if (!mapped.classid) { errors.push(`Row ${rowIdx + 2}: classid missing`); continue; }
        if (!mapped.studentid) { errors.push(`Row ${rowIdx + 2}: studentid missing`); continue; }

        const attendanceVal = String(mapped.attendance || "").trim().toLowerCase();
        let attendanceNum = 1;
        if (attendanceVal === "0" || attendanceVal === "absent" || attendanceVal === "a") attendanceNum = 0;

        const attendanceType = t(mapped.attendance_type) || "Regular";
        const payload = {
          classid: t(mapped.classid), studentid: t(mapped.studentid),
          attendance: attendanceNum, type: attendanceType,
          student: t(mapped.student), studentemail: t(mapped.studentemail),
          studentphone: t(mapped.studentphone), regno: t(mapped.regno),
          academicyear: t(mapped.academicyear), semester: t(mapped.semester),
          coursecode: t(mapped.coursecode), course: t(mapped.course),
          programcode: t(mapped.programcode), program: t(mapped.program),
          major: t(mapped.major), faculty: t(mapped.faculty),
          facultyemail: t(mapped.facultyemail),
          classdate: t(mapped.classdate), classtime: t(mapped.classtime),
          comments: t(mapped.comments), colid, user
        };

        await NepLmsAttendance.findOneAndUpdate(
          { colid, classid: t(mapped.classid), studentid: t(mapped.studentid), type: attendanceType },
          payload,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        saved += 1;
      }

      return {
        content: [{
          type: "text",
          text: `Saved ${saved} of ${raw.length} attendance records.\n${errors.join("\n")}`
        }]
      };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 9.  EXCEL TEMPLATE
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "get_excel_template_lms_attendance",
    "Download an Excel template for bulk-uploading attendance records. Attendance column: 1=Present, 0=Absent. Attendance Type: Regular or Supplementary.",
    { file_path: z.string().min(1).describe("Where to save the .xlsx template") },
    async ({ file_path }) => {
      const ws = XLSX.utils.aoa_to_sheet([
        [
          "Class ID", "Student ID", "Attendance", "Attendance Type",
          "Student Name", "Reg No", "Student Email", "Academic Year",
          "Semester", "Course Code", "Course", "Program Code",
          "Major", "Faculty Email", "Class Date", "Comments"
        ],
        [
          "6650abc123def456", "6650abc000def111", 1, "Regular",
          "Alice Rajan", "23CS001", "alice@college.edu", "2026-27",
          "I", "CS101", "Data Structures", "BSCS",
          "Computer Science", "smith@college.edu", "2026-08-10", ""
        ],
        [
          "6650abc123def456", "6650abc000def222", 0, "Regular",
          "Bob Kumar", "23CS002", "bob@college.edu", "2026-27",
          "I", "CS101", "Data Structures", "BSCS",
          "Computer Science", "smith@college.edu", "2026-08-10", "Medical leave"
        ]
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance");
      XLSX.writeFile(wb, file_path);
      return { content: [{ type: "text", text: `Template saved: ${file_path}` }] };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 10.  LIST RAW ATTENDANCE RECORDS
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_lms_attendance_records",
    "List raw attendance records with filters. For aggregated summaries use the report_ tools instead.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      programcode: z.string().optional(),
      coursecode: z.string().optional(),
      classdate: z.string().optional(),
      from_date: z.string().optional(),
      to_date: z.string().optional(),
      classid: z.string().optional(),
      regno: z.string().optional(),
      student: z.string().optional(),
      facultyemail: z.string().optional(),
      attendance_type: z.enum(["Regular", "Supplementary"]).optional(),
      attendance: z.number().int().min(0).max(1).optional().describe("1=Present, 0=Absent"),
      limit: z.number().int().min(1).max(5000).default(500).optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { from_date, to_date, classdate, limit = 500, attendance_type, attendance, ...rest } = args;
      const query = { colid };

      if (rest.academicyear) query.academicyear = rest.academicyear;
      if (rest.semester) query.semester = rest.semester;
      if (rest.programcode) query.programcode = rest.programcode;
      if (rest.coursecode) query.coursecode = rest.coursecode;
      if (rest.classid) query.classid = rest.classid;
      if (rest.regno) query.regno = new RegExp(t(rest.regno), "i");
      if (rest.student) query.student = new RegExp(t(rest.student), "i");
      if (rest.facultyemail) query.facultyemail = new RegExp(t(rest.facultyemail), "i");
      if (attendance_type) query.type = attendance_type;
      if (attendance !== undefined) query.attendance = attendance;

      if (classdate) {
        query.classdate = classdate;
      } else if (from_date || to_date) {
        query.classdate = {};
        if (from_date) query.classdate.$gte = from_date;
        if (to_date) query.classdate.$lte = to_date;
      }

      const docs = await NepLmsAttendance.find(query)
        .sort({ classdate: -1, classtime: 1, student: 1 }).limit(limit).lean();

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ count: docs.length, data: docs }, null, 2)
        }]
      };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 11.  REPORT — STUDENTWISE ATTENDANCE SUMMARY
  //       Mirrors backend getStudentwiseAttendanceReport
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "report_lms_attendance_studentwise",
    "Student-wise attendance summary: total classes, present, absent, percentage — with group breakdowns by course, semester, and program. Mirrors the Studentwise Attendance Report page.",
    {
      academicyear: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      semester: z.string().optional(),
      major: z.string().optional(),
      course: z.string().optional(),
      coursecode: z.string().optional(),
      facultyemail: z.string().optional(),
      attendance_type: z.enum(["Regular", "Supplementary"]).optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const query = { colid };
      const textFields = ["academicyear", "program", "programcode", "semester", "major", "course", "coursecode", "facultyemail"];
      for (const f of textFields) if (args[f]) query[f] = args[f];
      if (args.attendance_type) query.type = args.attendance_type;

      const data = await NepLmsAttendance.find(query).sort({ student: 1, classdate: 1 }).lean();
      const rows = buildStudentwiseSummary(data);
      const summary = {
        totalStudents: rows.length,
        totalClasses: data.length,
        present: data.filter((r) => Number(r.attendance) === 1).length,
        absent: data.filter((r) => Number(r.attendance) !== 1).length
      };
      summary.percentage = summary.totalClasses
        ? +((summary.present / summary.totalClasses) * 100).toFixed(2) : 0;

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            summary,
            rows,
            charts: {
              byCourse: groupByField(data, "coursecode"),
              bySemester: groupByField(data, "semester"),
              byProgram: groupByField(data, "programcode"),
              presentAbsent: [
                { name: "Present", value: summary.present },
                { name: "Absent", value: summary.absent }
              ]
            },
            options: {
              academicyear: uniqSorted(data, "academicyear"),
              programcode: uniqSorted(data, "programcode"),
              semester: uniqSorted(data, "semester"),
              major: uniqSorted(data, "major"),
              coursecode: uniqSorted(data, "coursecode"),
              type: uniqSorted(data, "type")
            }
          }, null, 2)
        }]
      };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 12.  REPORT — STUDENT COURSE-WISE ATTENDANCE
  //       Mirrors backend getStudentCoursewiseAttendanceReport
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "report_lms_attendance_student_coursewise",
    "Course-wise attendance breakdown for a specific student (or list of all students for selection). Supply regno or studentid to get the per-course breakdown for that student. Omit to get the list of all students with their totals.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      programcode: z.string().optional(),
      coursecode: z.string().optional(),
      attendance_type: z.enum(["Regular", "Supplementary"]).optional(),
      regno: z.string().optional().describe("Reg no to drill into a specific student"),
      studentid: z.string().optional().describe("Student _id to drill in"),
      student_name: z.string().optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const query = { colid };
      if (args.academicyear) query.academicyear = args.academicyear;
      if (args.semester) query.semester = args.semester;
      if (args.programcode) query.programcode = args.programcode;
      if (args.coursecode) query.coursecode = args.coursecode;
      if (args.attendance_type) query.type = args.attendance_type;
      if (args.regno) query.regno = new RegExp(t(args.regno), "i");
      if (args.student_name) query.student = new RegExp(t(args.student_name), "i");

      const data = await NepLmsAttendance.find(query).sort({ student: 1, coursecode: 1, classdate: 1 }).lean();
      const students = buildStudentwiseSummary(data);

      // Find the selected student
      let selectedStudent = null;
      if (args.studentid) {
        selectedStudent = students.find((s) => String(s.studentid) === args.studentid) || null;
      } else if (args.regno) {
        selectedStudent = students.find((s) => t(s.regno).toLowerCase() === t(args.regno).toLowerCase()) || null;
      } else if (students.length === 1) {
        selectedStudent = students[0];
      }

      // Build course-wise breakdown for the selected student
      let courseRows = [];
      if (selectedStudent) {
        const selectedKey = String(selectedStudent.studentid || selectedStudent.regno || selectedStudent.student || "");
        const selectedData = data.filter((row) => {
          const key = String(row.studentid || row.regno || row.student || "");
          return key === selectedKey
            || (selectedStudent.regno && t(row.regno).toLowerCase() === t(selectedStudent.regno).toLowerCase());
        });
        const courseMap = new Map();
        selectedData.forEach((row) => {
          const key = [row.coursecode || row.course || "", row.academicyear || "", row.semester || "", row.type || ""].join("||");
          if (!courseMap.has(key)) {
            courseMap.set(key, {
              id: key, course: row.course || "", coursecode: row.coursecode || "",
              academicyear: row.academicyear || "", semester: row.semester || "",
              major: row.major || "", type: row.type || "",
              totalClasses: 0, classesAttended: 0, classesAbsent: 0, percentage: 0
            });
          }
          const item = courseMap.get(key);
          item.totalClasses += 1;
          if (Number(row.attendance) === 1) item.classesAttended += 1;
          else item.classesAbsent += 1;
          item.percentage = item.totalClasses ? +((item.classesAttended / item.totalClasses) * 100).toFixed(2) : 0;
        });
        courseRows = [...courseMap.values()].sort((a, b) => t(a.coursecode).localeCompare(t(b.coursecode)));
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            allStudents: students,
            selectedStudent,
            courseRows,
            summary: selectedStudent ? {
              totalCourses: courseRows.length,
              totalClasses: courseRows.reduce((s, r) => s + r.totalClasses, 0),
              classesAttended: courseRows.reduce((s, r) => s + r.classesAttended, 0),
              classesAbsent: courseRows.reduce((s, r) => s + r.classesAbsent, 0)
            } : null
          }, null, 2)
        }]
      };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 13.  REPORT — LOW ATTENDANCE (institutional view)
  //       Mirrors backend getFacultyCoursewiseLowAttendanceReport
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "report_lms_attendance_low",
    "Students with attendance below a given threshold (default 75%). Groups by faculty, course, and program. Mirrors the Low Attendance Report page.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      programcode: z.string().optional(),
      coursecode: z.string().optional(),
      facultyemail: z.string().optional(),
      attendance_type: z.enum(["Regular", "Supplementary"]).optional(),
      threshold: z.number().default(75).optional().describe("% threshold below which a student is 'low' (default 75)")
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const threshold = args.threshold ?? 75;
      const query = { colid };
      if (args.academicyear) query.academicyear = args.academicyear;
      if (args.semester) query.semester = args.semester;
      if (args.programcode) query.programcode = args.programcode;
      if (args.coursecode) query.coursecode = args.coursecode;
      if (args.facultyemail) query.facultyemail = new RegExp(t(args.facultyemail), "i");
      if (args.attendance_type) query.type = args.attendance_type;

      const data = await NepLmsAttendance.find(query).sort({ student: 1, classdate: 1 }).lean();

      // Per-student-per-course aggregation (mirrors backend facultyCourse version for student view)
      const map = new Map();
      data.forEach((row) => {
        const key = [
          String(row.studentid || row.regno || row.student || ""),
          row.coursecode || "", row.semester || "", row.type || ""
        ].join("||");
        if (!map.has(key)) {
          map.set(key, {
            id: key, studentid: row.studentid, student: row.student || "",
            regno: row.regno || "", email: row.studentemail || "",
            phone: row.studentphone || "", program: row.program || "",
            programcode: row.programcode || "", academicyear: row.academicyear || "",
            semester: row.semester || "", major: row.major || "",
            course: row.course || "", coursecode: row.coursecode || "",
            faculty: row.faculty || "", facultyemail: row.facultyemail || "",
            type: row.type || "Regular",
            total: 0, present: 0, absent: 0, percentage: 0
          });
        }
        const item = map.get(key);
        item.total += 1;
        if (Number(row.attendance) === 1) item.present += 1;
        else item.absent += 1;
        item.percentage = item.total ? +((item.present / item.total) * 100).toFixed(2) : 0;
      });

      const allRows = [...map.values()].sort((a, b) => t(a.student).localeCompare(t(b.student)));
      const lowRows = allRows.filter((r) => r.percentage < threshold);

      const summary = {
        totalRows: allRows.length,
        lowRows: lowRows.length,
        threshold,
        totalPresent: data.filter((r) => Number(r.attendance) === 1).length,
        totalAbsent: data.filter((r) => Number(r.attendance) !== 1).length,
        totalClasses: data.length
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            summary,
            lowAttendanceStudents: lowRows,
            charts: {
              byProgram: groupByField(
                data.filter((r) => {
                  const key = [
                    String(r.studentid || r.regno || r.student || ""),
                    r.coursecode || "", r.semester || "", r.type || ""
                  ].join("||");
                  const row = map.get(key);
                  return row && row.percentage < threshold;
                }),
                "programcode"
              ),
              byCourse: groupByField(
                data.filter((r) => {
                  const key = [
                    String(r.studentid || r.regno || r.student || ""),
                    r.coursecode || "", r.semester || "", r.type || ""
                  ].join("||");
                  const row = map.get(key);
                  return row && row.percentage < threshold;
                }),
                "coursecode"
              )
            }
          }, null, 2)
        }]
      };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 14.  REPORT — DATE-WISE / CLASS-WISE ATTENDANCE
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "report_lms_attendance_datewise",
    "Date-wise / class-wise attendance summary — for each date and class, shows total students, present count, absent count, and percentage.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      facultyemail: z.string().optional(),
      from_date: z.string().optional().describe("YYYY-MM-DD"),
      to_date: z.string().optional().describe("YYYY-MM-DD"),
      attendance_type: z.enum(["Regular", "Supplementary"]).optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const query = { colid };
      if (args.academicyear) query.academicyear = args.academicyear;
      if (args.semester) query.semester = args.semester;
      if (args.coursecode) query.coursecode = args.coursecode;
      if (args.facultyemail) query.facultyemail = new RegExp(t(args.facultyemail), "i");
      if (args.attendance_type) query.type = args.attendance_type;
      if (args.from_date || args.to_date) {
        query.classdate = {};
        if (args.from_date) query.classdate.$gte = args.from_date;
        if (args.to_date) query.classdate.$lte = args.to_date;
      }

      const data = await NepLmsAttendance.find(query).sort({ classdate: 1, classtime: 1 }).lean();

      // Group by classdate + classid + coursecode
      const classMap = new Map();
      data.forEach((row) => {
        const key = [t(row.classdate), String(row.classid || ""), t(row.coursecode)].join("||");
        if (!classMap.has(key)) {
          classMap.set(key, {
            classdate: row.classdate || "", classtime: row.classtime || "",
            classid: row.classid, coursecode: row.coursecode || "",
            course: row.course || "", semester: row.semester || "",
            major: row.major || "", faculty: row.faculty || "",
            facultyemail: row.facultyemail || "", type: row.type || "Regular",
            total: 0, present: 0, absent: 0, percentage: 0
          });
        }
        const item = classMap.get(key);
        item.total += 1;
        if (Number(row.attendance) === 1) item.present += 1;
        else item.absent += 1;
        item.percentage = item.total ? +((item.present / item.total) * 100).toFixed(2) : 0;
      });

      const rows = [...classMap.values()].sort((a, b) => t(a.classdate).localeCompare(t(b.classdate)) || t(a.classtime).localeCompare(t(b.classtime)));
      const summary = {
        totalClasses: rows.length,
        totalRecords: data.length,
        present: data.filter((r) => Number(r.attendance) === 1).length,
        absent: data.filter((r) => Number(r.attendance) !== 1).length
      };
      summary.percentage = summary.totalRecords ? +((summary.present / summary.totalRecords) * 100).toFixed(2) : 0;

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ summary, rows }, null, 2)
        }]
      };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 15.  REPORT — FACULTY COURSE-WISE LOW ATTENDANCE
  //       Mirrors backend getFacultyCoursewiseLowAttendanceReport
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "report_lms_attendance_faculty_course_low",
    "Faculty-wise and course-wise low attendance report — shows each faculty+course combination with average attendance % and flags those below the threshold. Mirrors the Faculty Course Low Attendance Report page.",
    {
      academicyear: z.string().optional(),
      semester: z.string().optional(),
      programcode: z.string().optional(),
      coursecode: z.string().optional(),
      facultyemail: z.string().optional(),
      attendance_type: z.enum(["Regular", "Supplementary"]).optional(),
      threshold: z.number().default(75).optional().describe("Threshold % (default 75)")
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const threshold = args.threshold ?? 75;
      const query = { colid };
      if (args.academicyear) query.academicyear = args.academicyear;
      if (args.semester) query.semester = args.semester;
      if (args.programcode) query.programcode = args.programcode;
      if (args.coursecode) query.coursecode = args.coursecode;
      if (args.facultyemail) query.facultyemail = new RegExp(t(args.facultyemail), "i");
      if (args.attendance_type) query.type = args.attendance_type;

      const data = await NepLmsAttendance.find(query).sort({ faculty: 1, coursecode: 1, classdate: 1 }).lean();

      // Mirror backend: group by faculty+course+program+semester+major+year
      const map = new Map();
      data.forEach((row) => {
        const key = [
          row.facultyemail || row.faculty || "", row.coursecode || "",
          row.programcode || "", row.semester || "",
          row.major || "", row.academicyear || ""
        ].join("||");
        if (!map.has(key)) {
          map.set(key, {
            id: key, faculty: row.faculty || "", facultyemail: row.facultyemail || "",
            course: row.course || "", coursecode: row.coursecode || "",
            program: row.program || "", programcode: row.programcode || "",
            academicyear: row.academicyear || "", semester: row.semester || "",
            major: row.major || "",
            total: 0, present: 0, absent: 0, averageAttendance: 0
          });
        }
        const item = map.get(key);
        item.total += 1;
        if (Number(row.attendance) === 1) item.present += 1;
        else item.absent += 1;
        item.averageAttendance = item.total ? +((item.present / item.total) * 100).toFixed(2) : 0;
      });

      const allRows = [...map.values()].sort((a, b) =>
        t(a.faculty).localeCompare(t(b.faculty)) || t(a.coursecode).localeCompare(t(b.coursecode))
      );
      const lowRows = allRows.filter((r) => r.averageAttendance < threshold);

      const groupCourse = (items, field) => {
        const m = new Map();
        items.forEach((row) => {
          const key = row[field] || "-";
          const cur = m.get(key) || { name: key, courses: 0, total: 0, present: 0, absent: 0, averageAttendance: 0 };
          cur.courses += 1; cur.total += row.total; cur.present += row.present; cur.absent += row.absent;
          cur.averageAttendance = cur.total ? +((cur.present / cur.total) * 100).toFixed(2) : 0;
          m.set(key, cur);
        });
        return [...m.values()].sort((a, b) => t(a.name).localeCompare(t(b.name)));
      };

      const summary = {
        totalCourseRows: allRows.length,
        lowCourseRows: lowRows.length,
        threshold,
        totalEntries: lowRows.reduce((s, r) => s + r.total, 0),
        present: lowRows.reduce((s, r) => s + r.present, 0),
        absent: lowRows.reduce((s, r) => s + r.absent, 0)
      };
      summary.averageAttendance = summary.totalEntries
        ? +((summary.present / summary.totalEntries) * 100).toFixed(2) : 0;

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            summary,
            lowRows,
            allRows,
            charts: {
              byFaculty: groupCourse(lowRows, "faculty"),
              byCourse: groupCourse(lowRows, "coursecode"),
              byProgram: groupCourse(lowRows, "programcode"),
              thresholdSummary: [
                { name: "Below Threshold", value: lowRows.length },
                { name: "At or Above", value: Math.max(allRows.length - lowRows.length, 0) }
              ]
            },
            options: {
              academicyear: uniqSorted(data, "academicyear"),
              programcode: uniqSorted(data, "programcode"),
              semester: uniqSorted(data, "semester"),
              major: uniqSorted(data, "major"),
              coursecode: uniqSorted(data, "coursecode"),
              faculty: uniqSorted(data, "faculty"),
              facultyemail: uniqSorted(data, "facultyemail"),
              type: uniqSorted(data, "type")
            }
          }, null, 2)
        }]
      };
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 16.  STUDENT SEARCH — find students for filtering attendance
  // ═══════════════════════════════════════════════════════════════════════════

  server.tool(
    "search_lms_students",
    "Search the Students list (Users collection) by program, academic year, semester, section, major, or name/regno — same filters used in the Attendance page to find students for a class.",
    {
      academicyear: z.string().optional().describe("Matched against student admissionyear"),
      semester: z.string().optional(),
      programcode: z.string().optional(),
      major: z.string().optional().describe("Matched against student.Major"),
      section: z.string().optional(),
      name: z.string().optional(),
      regno: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      gender: z.string().optional(),
      category: z.string().optional(),
      limit: z.number().int().min(1).max(1000).default(100).optional()
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const { limit = 100, ...rest } = args;
      const query = { colid, role: /^Student$/i };
      if (rest.academicyear) query.admissionyear = t(rest.academicyear);
      if (rest.semester) query.semester = t(rest.semester);
      if (rest.programcode) query.programcode = t(rest.programcode);
      if (rest.major) query.Major = t(rest.major);
      if (rest.section) query.section = t(rest.section);
      if (rest.name) query.name = new RegExp(t(rest.name), "i");
      if (rest.email) query.email = new RegExp(t(rest.email), "i");
      if (rest.regno) query.regno = new RegExp(t(rest.regno), "i");
      if (rest.phone) query.phone = new RegExp(t(rest.phone), "i");
      if (rest.gender) query.gender = t(rest.gender);
      if (rest.category) query.category = t(rest.category);

      const students = await UserModel.find(query)
        .select("name email phone regno admissionyear programcode regulation Major Minor semester section category gender department colid")
        .sort({ name: 1, regno: 1 }).limit(limit).lean();

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ count: students.length, data: students }, null, 2)
        }]
      };
    }
  );
}
