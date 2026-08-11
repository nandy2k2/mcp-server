/**
 * academic-config-tools.js
 *
 * MCP tools for:
 *   regulationseats      → regulationseatds
 *   syllabus             → syllabusds
 *   colist (outcomes)    → courseoutcomeds
 *   academiccalendar     → macadcals  (model name: macadcal → collection: macadcals)
 *   gracemarkspolicy     → gracemarkspolicyds
 *   atktrules            → atktruleds
 *
 * NO delete tools (policy). All limits ≥ 1000.
 */

import mongoose from "mongoose";
import { z } from "zod";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const regulationSeatSchema = new mongoose.Schema(
  {
    colid: Number,
    academicyear: String,
    regulationid: String,
    regulation: String,
    program: String,
    programcode: String,
    subject: String,
    type: { type: String },
    category: { type: String },
    noofseats: { type: Number, default: 0 },
    samestate: { type: String, default: "Yes" },
    user: String
  },
  { strict: false, timestamps: true, collection: "regulationseatds" }
);

const syllabusSchema = new mongoose.Schema(
  {
    colid: Number,
    academicyear: String,
    regulation: String,
    program: String,
    programcode: String,
    type: String,
    subject: String,
    semester: String,
    course: String,
    coursecode: String,
    module: String,
    syllabus: String,
    user: String
  },
  { strict: false, timestamps: true, collection: "syllabusds" }
);

const courseOutcomeSchema = new mongoose.Schema(
  {
    colid: Number,
    academicyear: String,
    regulation: String,
    program: String,
    programcode: String,
    type: String,
    subject: String,
    semester: String,
    course: String,
    coursecode: String,
    modules: [String],
    topics: [String],
    bloomlevels: [String],
    conumber: String,
    co: String,
    status: { type: String, default: "Active" },
    user: String
  },
  { strict: false, timestamps: true, collection: "courseoutcomeds" }
);

// Academic calendar model: mongoose.model('macadcal') → collection 'macadcals'
const academicCalendarSchema = new mongoose.Schema(
  {
    colid: Number,
    name: String,
    user: String,
    academicyear: String,
    program: String,
    programcode: String,
    regulation: String,
    semester: String,
    ativity: String,        // intentional typo from the original model
    description: String,
    activitydate: Date,
    type: String,
    level: String,
    status1: String,
    comments: String
  },
  { strict: false, collection: "macadcals" }
);

const graceMarksPolicySchema = new mongoose.Schema(
  {
    colid: Number,
    academicyear: String,
    regulation: String,
    program: String,
    programcode: String,
    semester: String,
    course: String,
    coursecode: String,
    gracemark: { type: Number, default: 0 },
    user: String
  },
  { strict: false, timestamps: true, collection: "gracemarkspolicyds" }
);

const atktRuleSchema = new mongoose.Schema(
  {
    colid: Number,
    academicyear: String,
    regulation: String,
    program: String,
    programcode: String,
    semester: String,
    maxbacklog: { type: Number, default: 0 },
    user: String
  },
  { strict: false, timestamps: true, collection: "atktruleds" }
);

// Shared reference for regulation subjects (cascading dropdowns)
const RegSubjectRefSchema = new mongoose.Schema(
  { colid: Number, regulation: String, academicyear: String, program: String, programcode: String, subject: String, type: String, semester: String, course: String, coursecode: String },
  { strict: false, collection: "regulationcoursemapds" }
);

const RegMasterRefSchema = new mongoose.Schema(
  { colid: Number, regulation: String, isactive: String },
  { strict: false, collection: "regulationmasterds" }
);

const ProgramRefSchema = new mongoose.Schema(
  { colid: Number, program: String, programcode: String, year: String, level: String, type: String, status1: String },
  { strict: false, collection: "mprograms" }
);

// ─── Guarded model registrations ─────────────────────────────────────────────

const RegulationSeatMcp      = mongoose.models.RegulationSeatMcp      || mongoose.model("RegulationSeatMcp",      regulationSeatSchema,    "regulationseatds");
const SyllabusMcp            = mongoose.models.SyllabusMcp            || mongoose.model("SyllabusMcp",            syllabusSchema,          "syllabusds");
const CourseOutcomeMcp       = mongoose.models.CourseOutcomeMcp       || mongoose.model("CourseOutcomeMcp",       courseOutcomeSchema,     "courseoutcomeds");
const AcademicCalendarMcp    = mongoose.models.AcademicCalendarMcp    || mongoose.model("AcademicCalendarMcp",    academicCalendarSchema,  "macadcals");
const GraceMarksPolicyMcp    = mongoose.models.GraceMarksPolicyMcp    || mongoose.model("GraceMarksPolicyMcp",    graceMarksPolicySchema,  "gracemarkspolicyds");
const AtktRuleMcp            = mongoose.models.AtktRuleMcp            || mongoose.model("AtktRuleMcp",            atktRuleSchema,          "atktruleds");
const RegSubjectRefMcp       = mongoose.models.RegSubjectRefMcp       || mongoose.model("RegSubjectRefMcp",       RegSubjectRefSchema,     "regulationcoursemapds");
const RegMasterRefMcp        = mongoose.models.RegMasterRefMcp        || mongoose.model("RegMasterRefMcp",        RegMasterRefSchema,      "regulationmasterds");
const ProgramRefMcp          = mongoose.models.ProgramRefMcp          || mongoose.model("ProgramRefMcp",          ProgramRefSchema,        "mprograms");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rx = (s) => new RegExp(String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort();

/** Load cascading dropdown options shared by several pages. */
const loadOptions = async (colid) => {
  const [regs, progs] = await Promise.all([
    RegMasterRefMcp.find({ colid }).select("regulation isactive").lean(),
    ProgramRefMcp.find({ colid }).select("program programcode year level type status1").lean()
  ]);
  return {
    regulations: regs.map((r) => r.regulation),
    activeRegulations: regs.filter((r) => r.isactive !== "No").map((r) => r.regulation),
    programs: progs.map((p) => ({ program: p.program, programcode: p.programcode }))
  };
};

// ─── Tool registration ────────────────────────────────────────────────────────

export function registerAcademicConfigTools(server, { requireAuth, resolveColid, connectDB }) {

  // ══════════════════════════════════════════════════════════════════════════════
  //   REGULATION SEATS
  // ══════════════════════════════════════════════════════════════════════════════

  // ── 1. list_regulation_seats ──────────────────────────────────────────────────
  server.tool(
    "list_regulation_seats",
    "List regulation seat records. Filter by academicyear, regulation, programcode, subject, type (Major/Minor/AEC/SEC/VAC/IDC), or category (General/SC/ST/OBC/EWS/EBC/PH/Sports/Supernumerary).",
    {
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      programcode: z.string().optional(),
      program: z.string().optional(),
      subject: z.string().optional(),
      type: z.string().optional().describe("Major, Minor, AEC, SEC, VAC, IDC"),
      category: z.string().optional().describe("General, SC, ST, OBC, EWS, EBC, PH, Sports, Supernumerary"),
      samestate: z.string().optional().describe("Yes or No"),
      limit: z.number().int().min(1).max(5000).optional().default(1000)
    },
    async ({ academicyear, regulation, programcode, program, subject, type, category, samestate, limit }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (academicyear) filter.academicyear = academicyear;
      if (regulation) filter.regulation = rx(regulation);
      if (programcode) filter.programcode = programcode;
      if (program) filter.program = rx(program);
      if (subject) filter.subject = rx(subject);
      if (type) filter.type = type;
      if (category) filter.category = category;
      if (samestate) filter.samestate = samestate;
      const data = await RegulationSeatMcp.find(filter).sort({ programcode: 1, type: 1, subject: 1, category: 1 }).limit(limit || 1000).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 2. save_regulation_seat ───────────────────────────────────────────────────
  server.tool(
    "save_regulation_seat",
    "Create or update a regulation seat record. Provide id to update directly. Upserts on (colid, academicyear, regulation, programcode, subject, type, category).",
    {
      id: z.string().optional(),
      academicyear: z.string().optional(),
      regulationid: z.string().optional(),
      regulation: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      subject: z.string().optional(),
      type: z.enum(["Major", "Minor", "AEC", "SEC", "VAC", "IDC"]).optional(),
      category: z.enum(["General", "SC", "ST", "OBC", "EWS", "EBC", "PH", "Sports", "Supernumerary"]).optional(),
      noofseats: z.number().int().optional().default(0),
      samestate: z.enum(["Yes", "No"]).optional().default("Yes"),
      user: z.string().optional()
    },
    async ({ id, academicyear, regulationid, regulation, program, programcode, subject, type, category, noofseats, samestate, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { colid, academicyear, regulationid, regulation, program, programcode, subject, type, category, noofseats, samestate, user };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id
        ? await RegulationSeatMcp.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true })
        : await RegulationSeatMcp.findOneAndUpdate({ colid, academicyear, regulation, programcode, subject, type, category }, payload, { new: true, upsert: true, setDefaultsOnInsert: true });
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 3. get_regulation_seat_options ────────────────────────────────────────────
  server.tool(
    "get_regulation_seat_options",
    "Get cascading dropdown options for the regulation seats form: active regulations, programs, and subjects scoped by program/type/year. Optionally pass programcode, type, and academicyear to get subjects for that combination.",
    {
      programcode: z.string().optional(),
      type: z.string().optional(),
      academicyear: z.string().optional(),
      regulation: z.string().optional()
    },
    async ({ programcode, type, academicyear, regulation }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const opts = await loadOptions(colid);
      let subjects = [];
      if (programcode && type) {
        const filter = { colid, programcode, type };
        if (academicyear) filter.academicyear = academicyear;
        if (regulation) filter.regulation = regulation;
        const rows = await RegSubjectRefMcp.find(filter).select("subject").lean();
        subjects = uniq(rows.map((r) => r.subject));
      }
      return {
        content: [{
          type: "text", text: JSON.stringify({
            ...opts,
            subjects,
            types: ["Major", "Minor", "AEC", "SEC", "VAC", "IDC"],
            categories: ["General", "SC", "ST", "OBC", "EWS", "EBC", "PH", "Sports", "Supernumerary"],
            samestateOptions: ["Yes", "No"]
          }, null, 2)
        }]
      };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════════
  //   SYLLABUS
  // ══════════════════════════════════════════════════════════════════════════════

  // ── 4. list_syllabus ─────────────────────────────────────────────────────────
  server.tool(
    "list_syllabus",
    "List syllabus records. Filter by academicyear, regulation, programcode, coursecode, semester, module, or type. Returns syllabus content for each module.",
    {
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      programcode: z.string().optional(),
      type: z.string().optional().describe("Major, Minor, AEC, SEC, VAC, IDC"),
      subject: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      course: z.string().optional(),
      module: z.string().optional(),
      search: z.string().optional().describe("Search syllabus content"),
      limit: z.number().int().min(1).max(5000).optional().default(1000)
    },
    async ({ academicyear, regulation, programcode, type, subject, semester, coursecode, course, module, search, limit }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (academicyear) filter.academicyear = academicyear;
      if (regulation) filter.regulation = regulation;
      if (programcode) filter.programcode = programcode;
      if (type) filter.type = type;
      if (subject) filter.subject = rx(subject);
      if (semester) filter.semester = semester;
      if (coursecode) filter.coursecode = coursecode;
      if (course) filter.course = rx(course);
      if (module) filter.module = rx(module);
      if (search) filter.syllabus = rx(search);
      const data = await SyllabusMcp.find(filter).sort({ coursecode: 1, module: 1 }).limit(limit || 1000).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 5. save_syllabus ─────────────────────────────────────────────────────────
  server.tool(
    "save_syllabus",
    "Create or update a syllabus record. Provide id to update directly. No upsert key — always provide id to update, or omit to create new.",
    {
      id: z.string().optional(),
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      type: z.string().optional(),
      subject: z.string().optional(),
      semester: z.string().optional(),
      course: z.string().optional(),
      coursecode: z.string().optional(),
      module: z.string().optional().describe("Module name or number, e.g. 'Module 1'"),
      syllabus: z.string().optional().describe("Full syllabus text for this module"),
      user: z.string().optional()
    },
    async ({ id, academicyear, regulation, program, programcode, type, subject, semester, course, coursecode, module, syllabus, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { colid, academicyear, regulation, program, programcode, type, subject, semester, course, coursecode, module, syllabus, user };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id
        ? await SyllabusMcp.findOneAndUpdate({ _id: id, colid }, { $set: payload }, { new: true, runValidators: true })
        : await SyllabusMcp.create(payload);
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 6. get_syllabus_options ───────────────────────────────────────────────────
  server.tool(
    "get_syllabus_options",
    "Get cascading dropdown options for the syllabus form. Optionally pass programcode + type + academicyear + regulation to get courses for that scope.",
    {
      programcode: z.string().optional(),
      type: z.string().optional(),
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      subject: z.string().optional()
    },
    async ({ programcode, type, academicyear, regulation, subject }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const opts = await loadOptions(colid);
      let courses = [];
      if (programcode) {
        const filter = { colid, programcode };
        if (type) filter.type = type;
        if (academicyear) filter.academicyear = academicyear;
        if (regulation) filter.regulation = regulation;
        if (subject) filter.subject = subject;
        const rows = await RegSubjectRefMcp.find(filter).select("course coursecode semester subject").lean();
        courses = rows.map((r) => ({ course: r.course, coursecode: r.coursecode, semester: r.semester, subject: r.subject }));
      }
      return { content: [{ type: "text", text: JSON.stringify({ ...opts, courses }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════════
  //   COURSE OUTCOMES (CO LIST)
  // ══════════════════════════════════════════════════════════════════════════════

  // ── 7. list_course_outcomes ───────────────────────────────────────────────────
  server.tool(
    "list_course_outcomes",
    "List course outcomes (CO list). Filter by academicyear, programcode, coursecode, status, or Bloom's taxonomy levels.",
    {
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      programcode: z.string().optional(),
      type: z.string().optional(),
      subject: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      course: z.string().optional(),
      conumber: z.string().optional().describe("CO number filter, e.g. CO1"),
      status: z.string().optional(),
      search: z.string().optional().describe("Search CO text"),
      limit: z.number().int().min(1).max(5000).optional().default(1000)
    },
    async ({ academicyear, regulation, programcode, type, subject, semester, coursecode, course, conumber, status, search, limit }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (academicyear) filter.academicyear = academicyear;
      if (regulation) filter.regulation = regulation;
      if (programcode) filter.programcode = programcode;
      if (type) filter.type = type;
      if (subject) filter.subject = rx(subject);
      if (semester) filter.semester = semester;
      if (coursecode) filter.coursecode = coursecode;
      if (course) filter.course = rx(course);
      if (conumber) filter.conumber = rx(conumber);
      if (status) filter.status = rx(status);
      if (search) filter.co = rx(search);
      const data = await CourseOutcomeMcp.find(filter).sort({ coursecode: 1, conumber: 1 }).limit(limit || 1000).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 8. save_course_outcome ────────────────────────────────────────────────────
  server.tool(
    "save_course_outcome",
    "Create or update a course outcome (CO). Provide id to update. Required for create: academicyear, programcode, coursecode, conumber, co (outcome text). modules/topics/bloomlevels are arrays.",
    {
      id: z.string().optional(),
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      type: z.string().optional(),
      subject: z.string().optional(),
      semester: z.string().optional(),
      course: z.string().optional(),
      coursecode: z.string().optional(),
      conumber: z.string().optional().describe("CO number, e.g. CO1, CO2"),
      co: z.string().optional().describe("Course outcome statement"),
      modules: z.array(z.string()).optional().describe("Modules this CO belongs to"),
      topics: z.array(z.string()).optional().describe("Specific topics within the modules"),
      bloomlevels: z.array(z.string()).optional().describe("Bloom's taxonomy levels, e.g. ['Remember','Understand']"),
      status: z.string().optional().default("Active"),
      user: z.string().optional()
    },
    async ({ id, academicyear, regulation, program, programcode, type, subject, semester, course, coursecode, conumber, co, modules, topics, bloomlevels, status, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { colid, academicyear, regulation, program, programcode, type, subject, semester, course, coursecode, conumber, co, modules, topics, bloomlevels, status, user };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id
        ? await CourseOutcomeMcp.findOneAndUpdate({ _id: id, colid }, { $set: payload }, { new: true, runValidators: true })
        : await CourseOutcomeMcp.create(payload);
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════════
  //   ACADEMIC CALENDAR
  // ══════════════════════════════════════════════════════════════════════════════

  // ── 9. list_academic_calendar ─────────────────────────────────────────────────
  server.tool(
    "list_academic_calendar",
    "List academic calendar events. Filter by academicyear, regulation, programcode, semester, type, level, or status1. The 'ativity' field is the activity/event name (note: original field name has typo).",
    {
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      programcode: z.string().optional(),
      program: z.string().optional(),
      semester: z.string().optional(),
      type: z.string().optional().describe("Category/type of event"),
      level: z.string().optional(),
      status1: z.string().optional(),
      search: z.string().optional().describe("Search activity name or description"),
      fromdate: z.string().optional().describe("ISO date — filter events from this date"),
      todate: z.string().optional().describe("ISO date — filter events up to this date"),
      limit: z.number().int().min(1).max(5000).optional().default(1000)
    },
    async ({ academicyear, regulation, programcode, program, semester, type, level, status1, search, fromdate, todate, limit }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (academicyear) filter.academicyear = academicyear;
      if (regulation) filter.regulation = regulation;
      if (programcode) filter.programcode = programcode;
      if (program) filter.program = rx(program);
      if (semester) filter.semester = semester;
      if (type) filter.type = rx(type);
      if (level) filter.level = rx(level);
      if (status1) filter.status1 = rx(status1);
      if (search) { const s = rx(search); filter.$or = [{ ativity: s }, { description: s }]; }
      if (fromdate || todate) {
        filter.activitydate = {};
        if (fromdate) filter.activitydate.$gte = new Date(fromdate);
        if (todate) filter.activitydate.$lte = new Date(todate);
      }
      const data = await AcademicCalendarMcp.find(filter).sort({ activitydate: 1 }).limit(limit || 1000).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 10. save_academic_calendar ────────────────────────────────────────────────
  server.tool(
    "save_academic_calendar",
    "Create or update an academic calendar event. Provide id to update. Required for create: academicyear, ativity (activity name), activitydate. Note: field name is 'ativity' (original typo preserved).",
    {
      id: z.string().optional(),
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      semester: z.string().optional(),
      ativity: z.string().optional().describe("Activity / event name"),
      description: z.string().optional(),
      activitydate: z.string().optional().describe("ISO date string"),
      type: z.string().optional().describe("Event type/category"),
      level: z.string().optional(),
      status1: z.string().optional(),
      comments: z.string().optional(),
      user: z.string().optional(),
      name: z.string().optional().describe("Name field (legacy, usually same as ativity)")
    },
    async ({ id, academicyear, regulation, program, programcode, semester, ativity, description, activitydate, type, level, status1, comments, user, name }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { colid, academicyear, regulation, program, programcode, semester, ativity, description, activitydate: activitydate ? new Date(activitydate) : undefined, type, level, status1, comments, user, name: name || ativity || "" };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id
        ? await AcademicCalendarMcp.findOneAndUpdate({ _id: id, colid }, { $set: payload }, { new: true })
        : await AcademicCalendarMcp.create(payload);
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════════
  //   GRACE MARKS POLICY
  // ══════════════════════════════════════════════════════════════════════════════

  // ── 11. list_grace_marks_policies ────────────────────────────────────────────
  server.tool(
    "list_grace_marks_policies",
    "List grace marks policies. Filter by academicyear, regulation, programcode, semester, or coursecode. Grace marks define the extra marks that can be added to help a student pass.",
    {
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      programcode: z.string().optional(),
      program: z.string().optional(),
      semester: z.string().optional(),
      coursecode: z.string().optional(),
      course: z.string().optional(),
      limit: z.number().int().min(1).max(5000).optional().default(1000)
    },
    async ({ academicyear, regulation, programcode, program, semester, coursecode, course, limit }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (academicyear) filter.academicyear = academicyear;
      if (regulation) filter.regulation = regulation;
      if (programcode) filter.programcode = programcode;
      if (program) filter.program = rx(program);
      if (semester) filter.semester = semester;
      if (coursecode) filter.coursecode = coursecode;
      if (course) filter.course = rx(course);
      const data = await GraceMarksPolicyMcp.find(filter).sort({ programcode: 1, semester: 1, coursecode: 1 }).limit(limit || 1000).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 12. save_grace_marks_policy ──────────────────────────────────────────────
  server.tool(
    "save_grace_marks_policy",
    "Create or update a grace marks policy. Upserts on (colid, academicyear, regulation, programcode, semester, coursecode). Required: academicyear, regulation, programcode, semester, coursecode, gracemark.",
    {
      id: z.string().optional(),
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      semester: z.string().optional(),
      course: z.string().optional(),
      coursecode: z.string().optional(),
      gracemark: z.number().int().optional().default(0).describe("Number of grace marks allowed for this course"),
      user: z.string().optional()
    },
    async ({ id, academicyear, regulation, program, programcode, semester, course, coursecode, gracemark, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { colid, academicyear, regulation, program, programcode, semester, course, coursecode, gracemark, user };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id
        ? await GraceMarksPolicyMcp.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true })
        : await GraceMarksPolicyMcp.findOneAndUpdate({ colid, academicyear, regulation, programcode, semester, coursecode }, payload, { new: true, upsert: true, setDefaultsOnInsert: true });
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ══════════════════════════════════════════════════════════════════════════════
  //   ATKT RULES
  // ══════════════════════════════════════════════════════════════════════════════

  // ── 13. list_atkt_rules ───────────────────────────────────────────────────────
  server.tool(
    "list_atkt_rules",
    "List ATKT (Allowed To Keep Term) rules. Filter by academicyear, regulation, programcode, or semester. maxbacklog defines the maximum allowed backlogs a student may carry.",
    {
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      programcode: z.string().optional(),
      program: z.string().optional(),
      semester: z.string().optional(),
      limit: z.number().int().min(1).max(2000).optional().default(1000)
    },
    async ({ academicyear, regulation, programcode, program, semester, limit }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (academicyear) filter.academicyear = academicyear;
      if (regulation) filter.regulation = regulation;
      if (programcode) filter.programcode = programcode;
      if (program) filter.program = rx(program);
      if (semester) filter.semester = semester;
      const data = await AtktRuleMcp.find(filter).sort({ programcode: 1, semester: 1 }).limit(limit || 1000).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 14. save_atkt_rule ────────────────────────────────────────────────────────
  server.tool(
    "save_atkt_rule",
    "Create or update an ATKT rule. Upserts on (colid, academicyear, regulation, programcode, semester). Required: academicyear, regulation, programcode, semester, maxbacklog.",
    {
      id: z.string().optional(),
      academicyear: z.string().optional(),
      regulation: z.string().optional(),
      program: z.string().optional(),
      programcode: z.string().optional(),
      semester: z.string().optional(),
      maxbacklog: z.number().int().optional().default(0).describe("Maximum allowed backlog courses"),
      user: z.string().optional()
    },
    async ({ id, academicyear, regulation, program, programcode, semester, maxbacklog, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { colid, academicyear, regulation, program, programcode, semester, maxbacklog, user };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id
        ? await AtktRuleMcp.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true })
        : await AtktRuleMcp.findOneAndUpdate({ colid, academicyear, regulation, programcode, semester }, payload, { new: true, upsert: true, setDefaultsOnInsert: true });
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 15. get_atkt_rule_options ─────────────────────────────────────────────────
  server.tool(
    "get_atkt_rule_options",
    "Get cascading dropdown options for the ATKT rule form: active regulations, programs, and semester values.",
    { programcode: z.string().optional(), regulation: z.string().optional(), academicyear: z.string().optional() },
    async ({ programcode, regulation, academicyear }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const opts = await loadOptions(colid);
      let semesters = [];
      if (programcode) {
        const filter = { colid, programcode };
        if (regulation) filter.regulation = regulation;
        if (academicyear) filter.academicyear = academicyear;
        const rows = await RegSubjectRefMcp.find(filter).select("semester").lean();
        semesters = uniq(rows.map((r) => r.semester));
      }
      return { content: [{ type: "text", text: JSON.stringify({ ...opts, semesters }, null, 2) }] };
    }
  );
}
