/**
 * Regulation tools — shared between index.js (stdio) and server.js (HTTP)
 *
 * Models   :
 *   regulationmasterds    – regulation registry (name + active flag)
 *   regulationsubjectds   – subjects per regulation/program/type with seat matrix
 *   regulationcoursemapds – individual course→subject mappings with credits
 *   mprograms             – program lookup (for options)
 *
 * Tools registered (25 total):
 *   Master   : list_regulations, add_regulation, update_regulation, delete_regulation
 *   Subjects : list_regulation_subjects, get_regulation_subject_options,
 *              add_regulation_subject, update_regulation_subject, delete_regulation_subject,
 *              bulk_upload_regulation_subjects_from_json,
 *              bulk_upload_regulation_subjects_from_excel,
 *              get_excel_template_regulation_subjects
 *   Courses  : list_regulation_courses, get_regulation_course_options,
 *              add_regulation_course, update_regulation_course, delete_regulation_course,
 *              bulk_upload_regulation_courses_from_json,
 *              bulk_upload_regulation_courses_from_excel,
 *              get_excel_template_regulation_courses
 *   Reports  : report_regulation_overview, report_subjects_by_program,
 *              report_courses_by_program, report_credit_summary, report_seat_matrix
 *
 * Usage:
 *   registerRegulationTools(server, { requireAuth, resolveColid, resolveUser, connectDB })
 */

import { z } from "zod";
import mongoose from "mongoose";
import * as XLSX from "xlsx";
import * as fs from "fs";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const regulationMasterSchema = new mongoose.Schema({
  regulation:  { type: String, trim: true, required: true },
  description: { type: String, trim: true },
  isactive:    { type: String, enum: ["Yes","No"], default: "Yes" },
  colid:       { type: Number, required: true }
}, { timestamps: true });

const regulationSubjectSchema = new mongoose.Schema({
  regulationid: { type: String, trim: true },
  regulation:   { type: String, trim: true, required: true },
  academicyear: { type: String, trim: true, required: true },
  program:      { type: String, trim: true, required: true },
  programcode:  { type: String, trim: true },
  subject:      { type: String, trim: true, required: true },
  type:         { type: String, enum: ["Major","Minor","AEC","SEC","VAC","IDC"], required: true },
  totalseats:   { type: Number, default: 0 },
  general:      { type: Number, default: 0 },
  sc:           { type: Number, default: 0 },
  st:           { type: Number, default: 0 },
  ebc:          { type: Number, default: 0 },
  ews:          { type: Number, default: 0 },
  ph:           { type: Number, default: 0 },
  sportsnccnss: { type: Number, default: 0 },
  supernumerary:{ type: Number, default: 0 },
  samestate:    { type: String, enum: ["Yes","No"], default: "Yes" },
  gender:       { type: String, enum: ["Male","Female","Other"], default: "Other" },
  status:       { type: String, trim: true, default: "Active" },
  colid:        { type: Number, required: true },
  user:         { type: String, trim: true }
}, { timestamps: true });

const regulationCourseMapSchema = new mongoose.Schema({
  academicyear: { type: String, trim: true, required: true },
  regulation:   { type: String, trim: true, required: true },
  subject:      { type: String, trim: true, required: true },
  type:         { type: String, enum: ["Major","Minor","AEC","SEC","VAC","IDC"], required: true },
  semester:     { type: String, trim: true, required: true },
  program:      { type: String, trim: true, required: true },
  programcode:  { type: String, trim: true, required: true },
  course:       { type: String, trim: true, required: true },
  coursecode:   { type: String, trim: true, required: true },
  credit:       { type: Number, default: 0 },
  status:       { type: String, trim: true, default: "Active" },
  colid:        { type: Number, required: true },
  user:         { type: String, trim: true }
}, { timestamps: true });

const mprogramsLookupSchema = new mongoose.Schema({
  name:        { type: String },
  program:     { type: String },
  programcode: { type: String },
  type:        { type: String },
  year:        { type: String },
  colid:       { type: Number }
});

export const RegulationMaster    = mongoose.models.regulationmasterds    || mongoose.model("regulationmasterds",    regulationMasterSchema);
export const RegulationSubject   = mongoose.models.regulationsubjectds   || mongoose.model("regulationsubjectds",   regulationSubjectSchema);
export const RegulationCourseMap = mongoose.models.regulationcoursemapds || mongoose.model("regulationcoursemapds", regulationCourseMapSchema);
export const MPrograms           = mongoose.models.mprograms             || mongoose.model("mprograms",             mprogramsLookupSchema);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const clean      = (v) => String(v ?? "").trim();
const toNum      = (v) => { const n = Number(v); return Number.isNaN(n) ? undefined : n; };
const toSeat     = (v) => { const n = toNum(v); return n === undefined ? 0 : n; };
const uniq       = (arr) => [...new Set(arr.map(clean).filter(Boolean))].sort((a, b) => a.localeCompare(b));
const TYPES      = ["Major","Minor","AEC","SEC","VAC","IDC"];
const FALLBACK_YEARS = ["2026-27","2027-28","2028-29","2029-30","2030-31"];

// ── Regulation Subject payload ─────────────────────────────────────────────────
function subjectPayload(input = {}, colid, user) {
  return {
    regulationid:  clean(input.regulationid),
    regulation:    clean(input.regulation),
    academicyear:  clean(input.academicyear || input.academicYear),
    program:       clean(input.program),
    programcode:   clean(input.programcode),
    subject:       clean(input.subject || input.subjects),
    type:          TYPES.includes(input.type) ? input.type : "",
    totalseats:    toSeat(input.totalseats   || input.total   || input.seats),
    general:       toSeat(input.general),
    sc:            toSeat(input.sc),
    st:            toSeat(input.st),
    ebc:           toSeat(input.ebc),
    ews:           toSeat(input.ews),
    ph:            toSeat(input.ph),
    sportsnccnss:  toSeat(input.sportsnccnss || input.sportsnccnssquota),
    supernumerary: toSeat(input.supernumerary),
    samestate:     ["Yes","No"].includes(input.samestate) ? input.samestate : "Yes",
    gender:        ["Male","Female","Other"].includes(input.gender) ? input.gender : "Other",
    status:        clean(input.status) || "Active",
    colid:         toNum(input.colid || colid),
    user:          clean(input.user  || user)
  };
}
function validateSubject(p) {
  if (p.colid === undefined) return "colid is required";
  if (!p.regulation)   return "Regulation is required";
  if (!p.academicyear) return "Academic year is required";
  if (!p.program)      return "Program is required";
  if (!p.subject)      return "Subject is required";
  if (!p.type)         return "Type (Major/Minor/AEC/SEC/VAC/IDC) is required";
  return "";
}

// ── Regulation Course Map payload ─────────────────────────────────────────────
function coursePayload(input = {}, colid, user) {
  return {
    academicyear: clean(input.academicyear || input.academicYear),
    regulation:   clean(input.regulation),
    subject:      clean(input.subject),
    type:         TYPES.includes(input.type) ? input.type : "",
    semester:     clean(input.semester),
    program:      clean(input.program),
    programcode:  clean(input.programcode),
    course:       clean(input.course),
    coursecode:   clean(input.coursecode),
    credit:       toNum(input.credit || input.credits) || 0,
    status:       clean(input.status) || "Active",
    colid:        toNum(input.colid || colid),
    user:         clean(input.user  || user)
  };
}
function validateCourse(p) {
  if (p.colid === undefined) return "colid is required";
  if (!p.academicyear) return "Academic year is required";
  if (!p.regulation)   return "Regulation is required";
  if (!p.type)         return "Type is required";
  if (!p.subject)      return "Subject is required";
  if (!p.semester)     return "Semester is required";
  if (!p.program)      return "Program is required";
  if (!p.programcode)  return "Program code is required";
  if (!p.course)       return "Course is required";
  if (!p.coursecode)   return "Course code is required";
  return "";
}

// ── Excel normalizer ───────────────────────────────────────────────────────────
const normHdr = (v) => String(v || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const subjectHeaderMap = {
  regulation:   ["regulation"],
  academicyear: ["academicyear","academicyear","year"],
  program:      ["program","programme"],
  programcode:  ["programcode","programcode"],
  subject:      ["subject","subjects"],
  type:         ["type"],
  totalseats:   ["totalseats","total","seats"],
  general:      ["general"],
  sc:           ["sc"],
  st:           ["st"],
  ebc:          ["ebc"],
  ews:          ["ews"],
  ph:           ["ph"],
  sportsnccnss: ["sportsnccnss","sportsnccnssquota"],
  supernumerary:["supernumerary"],
  samestate:    ["samestate"],
  gender:       ["gender"],
  status:       ["status"]
};

const courseHeaderMap = {
  academicyear: ["academicyear","year"],
  regulation:   ["regulation"],
  subject:      ["subject"],
  type:         ["type"],
  semester:     ["semester","sem"],
  program:      ["program","programme"],
  programcode:  ["programcode","programcode"],
  course:       ["course","coursename"],
  coursecode:   ["coursecode","coursecode"],
  credit:       ["credit","credits"],
  status:       ["status"]
};

function excelRowToBody(row, headerMap) {
  const normalized = {};
  for (const [k, v] of Object.entries(row)) normalized[normHdr(k)] = v;
  const body = {};
  for (const [field, aliases] of Object.entries(headerMap)) {
    for (const alias of aliases) {
      if (normalized[alias] !== undefined) { body[field] = normalized[alias]; break; }
    }
  }
  return body;
}

// ── Serialize helpers ──────────────────────────────────────────────────────────
function serializeSubject(d) {
  const doc = d.toObject ? d.toObject() : d;
  return {
    id: String(doc._id), regulation: doc.regulation, academicyear: doc.academicyear,
    program: doc.program, programcode: doc.programcode, subject: doc.subject, type: doc.type,
    totalseats: doc.totalseats, general: doc.general, sc: doc.sc, st: doc.st,
    ebc: doc.ebc, ews: doc.ews, ph: doc.ph, sportsnccnss: doc.sportsnccnss,
    supernumerary: doc.supernumerary, samestate: doc.samestate, gender: doc.gender,
    status: doc.status, colid: doc.colid, user: doc.user
  };
}
function serializeCourse(d) {
  const doc = d.toObject ? d.toObject() : d;
  return {
    id: String(doc._id), academicyear: doc.academicyear, regulation: doc.regulation,
    subject: doc.subject, type: doc.type, semester: doc.semester,
    program: doc.program, programcode: doc.programcode,
    course: doc.course, coursecode: doc.coursecode, credit: doc.credit,
    status: doc.status, colid: doc.colid, user: doc.user
  };
}

// ─── Tool registrar ───────────────────────────────────────────────────────────
export function registerRegulationTools(server, { requireAuth, resolveColid, resolveUser, connectDB }) {
  const text = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });

  // ════════════════════════════════════════════════════════════════════════════
  // REGULATION MASTER
  // ════════════════════════════════════════════════════════════════════════════

  // ── list_regulations ────────────────────────────────────────────────────────
  server.tool(
    "list_regulations",
    "List all regulations (e.g. NEP2020, 2019) for your college. Optionally filter by active status or search by name.",
    {
      isactive: z.enum(["Yes","No"]).optional().describe("Filter: Yes = active only, No = inactive only"),
      search:   z.string().optional().describe("Search text matched against regulation name and description")
    },
    async ({ isactive, search }) => {
      requireAuth();
      await connectDB();
      const colid  = resolveColid(undefined);
      const filter = { colid };
      if (isactive) filter.isactive = isactive;
      if (search) {
        const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [{ regulation: re }, { description: re }];
      }
      const data = await RegulationMaster.find(filter).sort({ regulation: 1 }).lean();
      return text({ success: true, total: data.length, colid,
        regulations: data.map(d => ({ id: String(d._id), regulation: d.regulation, description: d.description, isactive: d.isactive }))
      });
    }
  );

  // ── add_regulation ──────────────────────────────────────────────────────────
  server.tool(
    "add_regulation",
    "Add a new regulation to the master list (e.g. NEP2020, 2019, CBCS2017).",
    {
      regulation:  z.string().min(1).describe("Regulation name e.g. NEP2020, CBCS2019"),
      description: z.string().optional().default("").describe("Description / remarks"),
      isactive:    z.enum(["Yes","No"]).optional().default("Yes")
    },
    async ({ regulation, description, isactive }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      if (!regulation) return text({ error: "Regulation name is required" });
      try {
        const doc = await RegulationMaster.create({ regulation, description, isactive, colid });
        return text({ success: true, message: "Regulation added",
          regulation: { id: String(doc._id), regulation: doc.regulation, description: doc.description, isactive: doc.isactive }
        });
      } catch (e) { return text({ error: e.message }); }
    }
  );

  // ── update_regulation ───────────────────────────────────────────────────────
  server.tool(
    "update_regulation",
    "Update a regulation by its _id. Get the id from list_regulations.",
    {
      id:          z.string().describe("Regulation _id from list_regulations"),
      regulation:  z.string().optional().describe("New regulation name"),
      description: z.string().optional().describe("New description"),
      isactive:    z.enum(["Yes","No"]).optional().describe("Yes = active, No = inactive")
    },
    async ({ id, regulation, description, isactive }) => {
      requireAuth();
      await connectDB();
      const colid  = resolveColid(undefined);
      const update = {};
      if (regulation  !== undefined) update.regulation  = regulation;
      if (description !== undefined) update.description = description;
      if (isactive    !== undefined) update.isactive    = isactive;
      try {
        const doc = await RegulationMaster.findOneAndUpdate({ _id: id, colid }, update, { new: true });
        if (!doc) return text({ error: "Regulation not found or does not belong to your college" });
        return text({ success: true, message: "Regulation updated",
          regulation: { id: String(doc._id), regulation: doc.regulation, description: doc.description, isactive: doc.isactive }
        });
      } catch (e) { return text({ error: e.message }); }
    }
  );

  // ── delete_regulation ───────────────────────────────────────────────────────
  server.tool(
    "delete_regulation",
    "Delete a regulation from the master list by its _id. Warning: this does not cascade-delete related subjects or course maps.",
    {
      id: z.string().describe("Regulation _id from list_regulations")
    },
    async ({ id }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      try {
        const doc = await RegulationMaster.findOneAndDelete({ _id: id, colid });
        if (!doc) return text({ error: "Regulation not found or does not belong to your college" });
        return text({ success: true, message: `Regulation '${doc.regulation}' deleted` });
      } catch (e) { return text({ error: e.message }); }
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // REGULATION SUBJECTS
  // ════════════════════════════════════════════════════════════════════════════

  // ── list_regulation_subjects ────────────────────────────────────────────────
  server.tool(
    "list_regulation_subjects",
    "List regulation subjects (major/minor/AEC etc.) with their seat matrices. Filter by regulation, year, program, type, or status.",
    {
      regulation:  z.string().optional().describe("Filter by regulation"),
      academicyear:z.string().optional().describe("Filter by academic year e.g. 2026-27"),
      programcode: z.string().optional().describe("Filter by program code"),
      program:     z.string().optional().describe("Filter by program name"),
      type:        z.enum(["Major","Minor","AEC","SEC","VAC","IDC"]).optional().describe("Filter by type"),
      status:      z.string().optional().describe("Filter by status: Active / Inactive"),
      limit:       z.number().int().optional().default(300).describe("Max results (default 300)")
    },
    async ({ regulation, academicyear, programcode, program, type, status, limit }) => {
      requireAuth();
      await connectDB();
      const colid  = resolveColid(undefined);
      const filter = { colid };
      if (regulation)   filter.regulation   = regulation;
      if (academicyear) filter.academicyear = academicyear;
      if (programcode)  filter.programcode  = programcode;
      if (program)      filter.program      = program;
      if (type)         filter.type         = type;
      if (status)       filter.status       = status;
      const data = await RegulationSubject.find(filter)
        .sort({ academicyear: 1, regulation: 1, program: 1, type: 1, subject: 1 })
        .limit(Math.min(limit || 300, 2000)).lean();
      return text({ success: true, total: data.length, colid, subjects: data.map(serializeSubject) });
    }
  );

  // ── get_regulation_subject_options ──────────────────────────────────────────
  server.tool(
    "get_regulation_subject_options",
    "Get dropdown options for the regulation subject form: active regulations and all programs from mprograms.",
    {},
    async () => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const [regulations, programs] = await Promise.all([
        RegulationMaster.find({ colid, isactive: "Yes" }).sort({ regulation: 1 }).lean(),
        MPrograms.find({ colid }).sort({ program: 1, programcode: 1 }).lean()
      ]);
      return text({ success: true, colid,
        regulations: regulations.map(r => ({ id: String(r._id), regulation: r.regulation, description: r.description })),
        programs:    programs.map(p => ({ id: String(p._id), program: p.program || p.name || "", programcode: p.programcode, type: p.type, year: p.year })),
        types:       TYPES,
        years:       FALLBACK_YEARS,
        samestate_options: ["Yes","No"],
        gender_options:    ["Male","Female","Other"]
      });
    }
  );

  // ── add_regulation_subject ──────────────────────────────────────────────────
  server.tool(
    "add_regulation_subject",
    "Add a regulation subject (e.g. Commerce under Major for B.Com NEP2020 2026-27). Seat fields default to 0.",
    {
      regulation:   z.string().min(1).describe("Regulation name"),
      academicyear: z.string().min(1).describe("Academic year e.g. 2026-27"),
      program:      z.string().min(1).describe("Program name e.g. B.Com"),
      programcode:  z.string().optional().default("").describe("Program code e.g. BCOM"),
      subject:      z.string().min(1).describe("Subject name e.g. Commerce"),
      type:         z.enum(["Major","Minor","AEC","SEC","VAC","IDC"]).describe("Subject type"),
      totalseats:   z.number().int().optional().default(0),
      general:      z.number().int().optional().default(0),
      sc:           z.number().int().optional().default(0),
      st:           z.number().int().optional().default(0),
      ebc:          z.number().int().optional().default(0),
      ews:          z.number().int().optional().default(0),
      ph:           z.number().int().optional().default(0),
      sportsnccnss: z.number().int().optional().default(0),
      supernumerary:z.number().int().optional().default(0),
      samestate:    z.enum(["Yes","No"]).optional().default("Yes"),
      gender:       z.enum(["Male","Female","Other"]).optional().default("Other"),
      status:       z.string().optional().default("Active")
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid   = resolveColid(undefined);
      const user    = resolveUser(undefined);
      const payload = subjectPayload(args, colid, user);
      const err     = validateSubject(payload);
      if (err) return text({ error: err });
      try {
        const doc = await RegulationSubject.create(payload);
        return text({ success: true, message: "Regulation subject added", subject: serializeSubject(doc) });
      } catch (e) { return text({ error: e.message }); }
    }
  );

  // ── update_regulation_subject ───────────────────────────────────────────────
  server.tool(
    "update_regulation_subject",
    "Update a regulation subject by its _id. Get the id from list_regulation_subjects. Only pass fields to change.",
    {
      id:           z.string().describe("Subject _id from list_regulation_subjects"),
      regulation:   z.string().optional(),
      academicyear: z.string().optional(),
      program:      z.string().optional(),
      programcode:  z.string().optional(),
      subject:      z.string().optional(),
      type:         z.enum(["Major","Minor","AEC","SEC","VAC","IDC"]).optional(),
      totalseats:   z.number().int().optional(),
      general:      z.number().int().optional(),
      sc:           z.number().int().optional(),
      st:           z.number().int().optional(),
      ebc:          z.number().int().optional(),
      ews:          z.number().int().optional(),
      ph:           z.number().int().optional(),
      sportsnccnss: z.number().int().optional(),
      supernumerary:z.number().int().optional(),
      samestate:    z.enum(["Yes","No"]).optional(),
      gender:       z.enum(["Male","Female","Other"]).optional(),
      status:       z.string().optional()
    },
    async ({ id, ...args }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const user  = resolveUser(undefined);
      try {
        const existing = await RegulationSubject.findOne({ _id: id, colid });
        if (!existing) return text({ error: "Subject not found or does not belong to your college" });
        const payload = subjectPayload({ ...existing.toObject(), ...args }, colid, user);
        const err     = validateSubject(payload);
        if (err) return text({ error: err });
        const doc = await RegulationSubject.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
        return text({ success: true, message: "Regulation subject updated", subject: serializeSubject(doc) });
      } catch (e) { return text({ error: e.message }); }
    }
  );

  // ── delete_regulation_subject ───────────────────────────────────────────────
  server.tool(
    "delete_regulation_subject",
    "Delete a regulation subject by its _id. Get the id from list_regulation_subjects.",
    {
      id: z.string().describe("Subject _id from list_regulation_subjects")
    },
    async ({ id }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      try {
        const doc = await RegulationSubject.findOneAndDelete({ _id: id, colid });
        if (!doc) return text({ error: "Subject not found or does not belong to your college" });
        return text({ success: true, message: `Subject '${doc.subject}' deleted`, deleted: serializeSubject(doc) });
      } catch (e) { return text({ error: e.message }); }
    }
  );

  // ── bulk_upload_regulation_subjects_from_json ───────────────────────────────
  server.tool(
    "bulk_upload_regulation_subjects_from_json",
    "Bulk insert regulation subjects from a JSON array. Each object needs: regulation, academicyear, program, subject, type.",
    {
      subjects: z.array(z.object({
        regulation:   z.string(),
        academicyear: z.string(),
        program:      z.string(),
        programcode:  z.string().optional(),
        subject:      z.string(),
        type:         z.string(),
        totalseats:   z.number().optional(),
        general:      z.number().optional(),
        sc:           z.number().optional(),
        st:           z.number().optional(),
        ebc:          z.number().optional(),
        ews:          z.number().optional(),
        ph:           z.number().optional(),
        sportsnccnss: z.number().optional(),
        supernumerary:z.number().optional(),
        samestate:    z.string().optional(),
        gender:       z.string().optional(),
        status:       z.string().optional()
      })).min(1)
    },
    async ({ subjects }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const user  = resolveUser(undefined);
      const errors = [], valid = [];
      for (let i = 0; i < subjects.length; i++) {
        const payload = subjectPayload(subjects[i], colid, user);
        const err     = validateSubject(payload);
        if (err) { errors.push({ row: i + 1, message: err }); continue; }
        valid.push(payload);
      }
      let inserted = 0;
      if (valid.length) {
        try { const r = await RegulationSubject.insertMany(valid, { ordered: false }); inserted = r.length; }
        catch (e) { if (e.insertedDocs) inserted = e.insertedDocs.length; errors.push({ row: "batch", message: e.message }); }
      }
      return text({ success: true, colid, total: subjects.length, inserted, error_count: errors.length, errors: errors.slice(0, 20) });
    }
  );

  // ── bulk_upload_regulation_subjects_from_excel ──────────────────────────────
  server.tool(
    "bulk_upload_regulation_subjects_from_excel",
    "Bulk insert regulation subjects from an Excel file. Required columns: Regulation, Academic Year, Program, Subject, Type.",
    {
      file_path: z.string().describe("Absolute path to the Excel file (.xlsx / .xls)")
    },
    async ({ file_path }) => {
      requireAuth();
      await connectDB();
      if (!fs.existsSync(file_path)) return text({ error: `File not found: ${file_path}` });
      let wb;
      try { wb = XLSX.readFile(file_path); }
      catch (e) { return text({ error: `Cannot read Excel: ${e.message}` }); }
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      if (!rows.length) return text({ error: "No data rows found" });
      const colid = resolveColid(undefined);
      const user  = resolveUser(undefined);
      const errors = [], valid = [];
      for (let i = 0; i < rows.length; i++) {
        const payload = subjectPayload(excelRowToBody(rows[i], subjectHeaderMap), colid, user);
        const err     = validateSubject(payload);
        if (err) { errors.push({ row: i + 2, message: err }); continue; }
        valid.push(payload);
      }
      let inserted = 0;
      if (valid.length) {
        try { const r = await RegulationSubject.insertMany(valid, { ordered: false }); inserted = r.length; }
        catch (e) { if (e.insertedDocs) inserted = e.insertedDocs.length; errors.push({ row: "batch", message: e.message }); }
      }
      return text({ success: true, colid, total_rows: rows.length, inserted, error_count: errors.length, errors: errors.slice(0, 20) });
    }
  );

  // ── get_excel_template_regulation_subjects ──────────────────────────────────
  server.tool(
    "get_excel_template_regulation_subjects",
    "Generate an Excel template for bulk regulation subject upload.",
    {
      output_path: z.string().describe("Absolute path to save the .xlsx file e.g. /tmp/reg_subjects_template.xlsx")
    },
    async ({ output_path }) => {
      const sample = [{
        Regulation: "NEP2020", "Academic Year": "2026-27", Program: "B.Com", "Program Code": "BCOM",
        Subject: "Commerce", Type: "Major",
        "Total Seats": 60, General: 30, SC: 10, ST: 5, EBC: 5, EWS: 5, PH: 2, "Sports NCC NSS": 2, Supernumerary: 1,
        "Same State": "Yes", Gender: "Other", Status: "Active"
      }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sample), "Regulation Subjects");
      XLSX.writeFile(wb, output_path);
      return text({ success: true, path: output_path, columns: Object.keys(sample[0]),
        required: ["Regulation","Academic Year","Program","Subject","Type"],
        types: TYPES, note: "Fill from row 2 onward."
      });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // REGULATION COURSE MAP
  // ════════════════════════════════════════════════════════════════════════════

  // ── list_regulation_courses ─────────────────────────────────────────────────
  server.tool(
    "list_regulation_courses",
    "List course-to-subject mappings in the regulation course map. Filter by year, regulation, program, type, subject, semester, or course code.",
    {
      academicyear: z.string().optional().describe("Academic year e.g. 2026-27"),
      regulation:   z.string().optional().describe("Regulation name"),
      programcode:  z.string().optional().describe("Program code"),
      type:         z.enum(["Major","Minor","AEC","SEC","VAC","IDC"]).optional(),
      subject:      z.string().optional().describe("Subject name exact match"),
      semester:     z.string().optional().describe("Semester e.g. 1, 2, 3"),
      coursecode:   z.string().optional().describe("Course code exact match"),
      status:       z.string().optional().describe("Status filter: Active / Inactive"),
      limit:        z.number().int().optional().default(500).describe("Max results (default 500)")
    },
    async ({ academicyear, regulation, programcode, type, subject, semester, coursecode, status, limit }) => {
      requireAuth();
      await connectDB();
      const colid  = resolveColid(undefined);
      const filter = { colid };
      if (academicyear) filter.academicyear = academicyear;
      if (regulation)   filter.regulation   = regulation;
      if (programcode)  filter.programcode  = programcode;
      if (type)         filter.type         = type;
      if (subject)      filter.subject      = subject;
      if (semester)     filter.semester     = semester;
      if (coursecode)   filter.coursecode   = coursecode;
      if (status)       filter.status       = status;
      const data = await RegulationCourseMap.find(filter)
        .sort({ academicyear: 1, regulation: 1, program: 1, type: 1, subject: 1, semester: 1, course: 1 })
        .limit(Math.min(limit || 500, 5000)).lean();
      return text({ success: true, total: data.length, colid, courses: data.map(serializeCourse) });
    }
  );

  // ── get_regulation_course_options ───────────────────────────────────────────
  server.tool(
    "get_regulation_course_options",
    "Get dropdown values for the course map form: active regulations, programs from mprograms, and distinct subjects from regulation subjects. Optionally filter subjects by type/year/regulation/programcode.",
    {
      type:         z.string().optional().describe("Filter subjects by type"),
      academicyear: z.string().optional().describe("Filter subjects by academic year"),
      regulation:   z.string().optional().describe("Filter subjects by regulation"),
      programcode:  z.string().optional().describe("Filter subjects by program code")
    },
    async ({ type, academicyear, regulation, programcode }) => {
      requireAuth();
      await connectDB();
      const colid        = resolveColid(undefined);
      const subjectQuery = { colid };
      if (type)         subjectQuery.type         = type;
      if (academicyear) subjectQuery.academicyear = academicyear;
      if (regulation)   subjectQuery.regulation   = regulation;
      if (programcode)  subjectQuery.programcode  = programcode;

      const [regulations, programs, subjectList] = await Promise.all([
        RegulationMaster.find({ colid, isactive: "Yes" }).sort({ regulation: 1 }).lean(),
        MPrograms.find({ colid }).sort({ program: 1, programcode: 1 }).lean(),
        RegulationSubject.distinct("subject", subjectQuery)
      ]);

      return text({ success: true, colid,
        regulations: regulations.map(r => ({ id: String(r._id), regulation: r.regulation })),
        programs:    programs.map(p => ({ program: p.program || p.name || "", programcode: p.programcode, type: p.type, year: p.year })),
        subjects:    uniq(subjectList),
        types:       TYPES,
        years:       FALLBACK_YEARS,
        semesters:   ["1","2","3","4","5","6","7","8","9","10"]
      });
    }
  );

  // ── add_regulation_course ───────────────────────────────────────────────────
  server.tool(
    "add_regulation_course",
    "Add a single course-to-subject mapping (e.g. Financial Accounting → Commerce, B.Com, Semester 1, Major). All fields required.",
    {
      academicyear: z.string().min(1).describe("Academic year e.g. 2026-27"),
      regulation:   z.string().min(1).describe("Regulation name"),
      subject:      z.string().min(1).describe("Subject name (must exist in regulation subjects)"),
      type:         z.enum(["Major","Minor","AEC","SEC","VAC","IDC"]).describe("Type"),
      semester:     z.string().min(1).describe("Semester e.g. 1, 2, 3"),
      program:      z.string().min(1).describe("Program name e.g. B.Com"),
      programcode:  z.string().min(1).describe("Program code e.g. BCOM"),
      course:       z.string().min(1).describe("Course name e.g. Financial Accounting"),
      coursecode:   z.string().min(1).describe("Course code e.g. BCOM101"),
      credit:       z.number().optional().default(0).describe("Course credit hours"),
      status:       z.enum(["Active","Inactive"]).optional().default("Active")
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid   = resolveColid(undefined);
      const user    = resolveUser(undefined);
      const payload = coursePayload(args, colid, user);
      const err     = validateCourse(payload);
      if (err) return text({ error: err });
      try {
        const doc = await RegulationCourseMap.create(payload);
        return text({ success: true, message: "Course mapping added", course: serializeCourse(doc) });
      } catch (e) { return text({ error: e.message }); }
    }
  );

  // ── update_regulation_course ────────────────────────────────────────────────
  server.tool(
    "update_regulation_course",
    "Update a course mapping by its _id. Get the id from list_regulation_courses. Only pass fields to change.",
    {
      id:           z.string().describe("Course map _id from list_regulation_courses"),
      academicyear: z.string().optional(),
      regulation:   z.string().optional(),
      subject:      z.string().optional(),
      type:         z.enum(["Major","Minor","AEC","SEC","VAC","IDC"]).optional(),
      semester:     z.string().optional(),
      program:      z.string().optional(),
      programcode:  z.string().optional(),
      course:       z.string().optional().describe("New course name"),
      coursecode:   z.string().optional().describe("New course code"),
      credit:       z.number().optional(),
      status:       z.enum(["Active","Inactive"]).optional()
    },
    async ({ id, ...args }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const user  = resolveUser(undefined);
      try {
        const existing = await RegulationCourseMap.findOne({ _id: id, colid });
        if (!existing) return text({ error: "Course mapping not found or does not belong to your college" });
        const payload = coursePayload({ ...existing.toObject(), ...args }, colid, user);
        const err     = validateCourse(payload);
        if (err) return text({ error: err });
        const doc = await RegulationCourseMap.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
        return text({ success: true, message: "Course mapping updated", course: serializeCourse(doc) });
      } catch (e) { return text({ error: e.message }); }
    }
  );

  // ── delete_regulation_course ────────────────────────────────────────────────
  server.tool(
    "delete_regulation_course",
    "Delete a course mapping by its _id. Get the id from list_regulation_courses.",
    {
      id: z.string().describe("Course map _id from list_regulation_courses")
    },
    async ({ id }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      try {
        const doc = await RegulationCourseMap.findOneAndDelete({ _id: id, colid });
        if (!doc) return text({ error: "Course mapping not found or does not belong to your college" });
        return text({ success: true, message: `Course '${doc.course}' (${doc.coursecode}) deleted` });
      } catch (e) { return text({ error: e.message }); }
    }
  );

  // ── bulk_upload_regulation_courses_from_json ────────────────────────────────
  server.tool(
    "bulk_upload_regulation_courses_from_json",
    "Bulk insert course mappings from a JSON array. Each object needs: academicyear, regulation, subject, type, semester, program, programcode, course, coursecode.",
    {
      courses: z.array(z.object({
        academicyear: z.string(),
        regulation:   z.string(),
        subject:      z.string(),
        type:         z.string(),
        semester:     z.string(),
        program:      z.string(),
        programcode:  z.string(),
        course:       z.string(),
        coursecode:   z.string(),
        credit:       z.number().optional(),
        status:       z.string().optional()
      })).min(1)
    },
    async ({ courses }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const user  = resolveUser(undefined);
      const errors = [], valid = [];
      for (let i = 0; i < courses.length; i++) {
        const payload = coursePayload(courses[i], colid, user);
        const err     = validateCourse(payload);
        if (err) { errors.push({ row: i + 1, message: err }); continue; }
        valid.push(payload);
      }
      let inserted = 0;
      if (valid.length) {
        try { const r = await RegulationCourseMap.insertMany(valid, { ordered: false }); inserted = r.length; }
        catch (e) { if (e.insertedDocs) inserted = e.insertedDocs.length; errors.push({ row: "batch", message: e.message }); }
      }
      return text({ success: true, colid, total: courses.length, inserted, error_count: errors.length, errors: errors.slice(0, 20) });
    }
  );

  // ── bulk_upload_regulation_courses_from_excel ───────────────────────────────
  server.tool(
    "bulk_upload_regulation_courses_from_excel",
    "Bulk insert course mappings from an Excel file. Required columns: Academic Year, Regulation, Subject, Type, Semester, Program, Program Code, Course, Course Code.",
    {
      file_path: z.string().describe("Absolute path to the Excel file (.xlsx / .xls)")
    },
    async ({ file_path }) => {
      requireAuth();
      await connectDB();
      if (!fs.existsSync(file_path)) return text({ error: `File not found: ${file_path}` });
      let wb;
      try { wb = XLSX.readFile(file_path); }
      catch (e) { return text({ error: `Cannot read Excel: ${e.message}` }); }
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      if (!rows.length) return text({ error: "No data rows found" });
      const colid = resolveColid(undefined);
      const user  = resolveUser(undefined);
      const errors = [], valid = [];
      for (let i = 0; i < rows.length; i++) {
        const payload = coursePayload(excelRowToBody(rows[i], courseHeaderMap), colid, user);
        const err     = validateCourse(payload);
        if (err) { errors.push({ row: i + 2, message: err }); continue; }
        valid.push(payload);
      }
      let inserted = 0;
      if (valid.length) {
        try { const r = await RegulationCourseMap.insertMany(valid, { ordered: false }); inserted = r.length; }
        catch (e) { if (e.insertedDocs) inserted = e.insertedDocs.length; errors.push({ row: "batch", message: e.message }); }
      }
      return text({ success: true, colid, total_rows: rows.length, inserted, error_count: errors.length, errors: errors.slice(0, 20) });
    }
  );

  // ── get_excel_template_regulation_courses ───────────────────────────────────
  server.tool(
    "get_excel_template_regulation_courses",
    "Generate an Excel template for bulk regulation course map upload.",
    {
      output_path: z.string().describe("Absolute path to save the .xlsx file e.g. /tmp/reg_courses_template.xlsx")
    },
    async ({ output_path }) => {
      const sample = [{
        "Academic Year": "2026-27", Regulation: "NEP2020", Subject: "Commerce", Type: "Major",
        Semester: "1", Program: "B.Com", "Program Code": "BCOM",
        Course: "Financial Accounting", "Course Code": "BCOM101", Credit: 4, Status: "Active"
      }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sample), "Course Map");
      XLSX.writeFile(wb, output_path);
      return text({ success: true, path: output_path, columns: Object.keys(sample[0]),
        required: ["Academic Year","Regulation","Subject","Type","Semester","Program","Program Code","Course","Course Code"],
        types: TYPES, semesters: ["1","2","3","4","5","6","7","8","9","10"],
        note: "Fill from row 2 onward. Credit is optional (defaults to 0)."
      });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // REPORTS
  // ════════════════════════════════════════════════════════════════════════════

  // ── report_regulation_overview ──────────────────────────────────────────────
  server.tool(
    "report_regulation_overview",
    "Overview of all regulations: for each regulation shows count of subjects, distinct programs, and course map entries.",
    {
      academicyear: z.string().optional().describe("Scope to a specific academic year e.g. 2026-27"),
      isactive:     z.enum(["Yes","No"]).optional().describe("Filter by active flag on regulation master")
    },
    async ({ academicyear, isactive }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const masterFilter = { colid };
      if (isactive) masterFilter.isactive = isactive;
      const subjectMatch  = { colid }; if (academicyear) subjectMatch.academicyear  = academicyear;
      const courseMatch   = { colid }; if (academicyear) courseMatch.academicyear   = academicyear;

      const [regulations, subjectAgg, courseAgg] = await Promise.all([
        RegulationMaster.find(masterFilter).sort({ regulation: 1 }).lean(),
        RegulationSubject.aggregate([
          { $match: subjectMatch },
          { $group: { _id: "$regulation", subject_count: { $sum: 1 }, programs: { $addToSet: "$programcode" } } }
        ]),
        RegulationCourseMap.aggregate([
          { $match: courseMatch },
          { $group: { _id: "$regulation", course_count: { $sum: 1 }, total_credits: { $sum: "$credit" } } }
        ])
      ]);

      const subjectMap = new Map(subjectAgg.map(r => [r._id, r]));
      const courseMap  = new Map(courseAgg.map(r => [r._id, r]));

      return text({ success: true, colid, academicyear,
        regulations: regulations.map(r => ({
          regulation:     r.regulation,
          description:    r.description,
          isactive:       r.isactive,
          subject_count:  subjectMap.get(r.regulation)?.subject_count  || 0,
          program_count:  (subjectMap.get(r.regulation)?.programs || []).filter(Boolean).length,
          course_count:   courseMap.get(r.regulation)?.course_count    || 0,
          total_credits:  courseMap.get(r.regulation)?.total_credits   || 0
        }))
      });
    }
  );

  // ── report_subjects_by_program ──────────────────────────────────────────────
  server.tool(
    "report_subjects_by_program",
    "Subject distribution per program, broken down by type (Major/Minor/AEC/SEC/VAC/IDC) with total seat counts.",
    {
      academicyear: z.string().optional().describe("Filter by academic year e.g. 2026-27"),
      regulation:   z.string().optional().describe("Filter by regulation"),
      type:         z.enum(["Major","Minor","AEC","SEC","VAC","IDC"]).optional().describe("Filter by type")
    },
    async ({ academicyear, regulation, type }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const match = { colid };
      if (academicyear) match.academicyear = academicyear;
      if (regulation)   match.regulation   = regulation;
      if (type)         match.type         = type;

      const rows = await RegulationSubject.aggregate([
        { $match: match },
        { $group: {
          _id:           { programcode: "$programcode", program: "$program", type: "$type" },
          subject_count: { $sum: 1 },
          total_seats:   { $sum: "$totalseats" },
          subjects:      { $push: "$subject" }
        }},
        { $sort: { "_id.programcode": 1, "_id.type": 1 } }
      ]);

      return text({ success: true, colid, academicyear, regulation,
        data: rows.map(r => ({
          programcode:   r._id.programcode,
          program:       r._id.program,
          type:          r._id.type,
          subject_count: r.subject_count,
          total_seats:   r.total_seats,
          subjects:      r.subjects.sort()
        }))
      });
    }
  );

  // ── report_courses_by_program ───────────────────────────────────────────────
  server.tool(
    "report_courses_by_program",
    "Course list for a program grouped by semester: shows all courses, credits, and subject grouping. Ideal for printing a curriculum sheet.",
    {
      academicyear: z.string().min(1).describe("Academic year e.g. 2026-27 (required)"),
      regulation:   z.string().optional().describe("Filter by regulation"),
      programcode:  z.string().optional().describe("Filter by program code"),
      type:         z.enum(["Major","Minor","AEC","SEC","VAC","IDC"]).optional()
    },
    async ({ academicyear, regulation, programcode, type }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const match = { colid, academicyear };
      if (regulation)  match.regulation  = regulation;
      if (programcode) match.programcode = programcode;
      if (type)        match.type        = type;

      const data = await RegulationCourseMap.find(match)
        .sort({ programcode: 1, type: 1, semester: 1, subject: 1, course: 1 }).lean();

      // Group by semester
      const semMap = new Map();
      for (const row of data) {
        const sem = row.semester || "?";
        if (!semMap.has(sem)) semMap.set(sem, { semester: sem, course_count: 0, total_credit: 0, courses: [] });
        const entry = semMap.get(sem);
        entry.course_count++;
        entry.total_credit += (row.credit || 0);
        entry.courses.push({ coursecode: row.coursecode, course: row.course, subject: row.subject, type: row.type, credit: row.credit });
      }

      const semesters = [...semMap.values()].sort((a, b) => String(a.semester).localeCompare(String(b.semester), undefined, { numeric: true }));
      const grandTotal = semesters.reduce((s, r) => ({ course_count: s.course_count + r.course_count, total_credit: s.total_credit + r.total_credit }), { course_count: 0, total_credit: 0 });

      return text({ success: true, colid, academicyear, regulation, programcode, type,
        grand_total: grandTotal, semesters
      });
    }
  );

  // ── report_credit_summary ───────────────────────────────────────────────────
  server.tool(
    "report_credit_summary",
    "Credit summary per program: total credits by semester and type. Useful for curriculum compliance checking.",
    {
      academicyear: z.string().optional().describe("Filter by academic year e.g. 2026-27"),
      regulation:   z.string().optional().describe("Filter by regulation"),
      programcode:  z.string().optional().describe("Filter by program code")
    },
    async ({ academicyear, regulation, programcode }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const match = { colid };
      if (academicyear) match.academicyear = academicyear;
      if (regulation)   match.regulation   = regulation;
      if (programcode)  match.programcode  = programcode;

      const rows = await RegulationCourseMap.aggregate([
        { $match: match },
        { $group: {
          _id: { programcode: "$programcode", program: "$program", semester: "$semester", type: "$type" },
          course_count:  { $sum: 1 },
          total_credits: { $sum: "$credit" }
        }},
        { $sort: { "_id.programcode": 1, "_id.semester": 1, "_id.type": 1 } }
      ]);

      // Nest by program → semester → type
      const programMap = new Map();
      for (const r of rows) {
        const pk = r._id.programcode;
        if (!programMap.has(pk)) programMap.set(pk, { programcode: pk, program: r._id.program, semesters: new Map() });
        const prog = programMap.get(pk);
        const sk   = r._id.semester;
        if (!prog.semesters.has(sk)) prog.semesters.set(sk, { semester: sk, types: [], total_credits: 0, total_courses: 0 });
        const sem = prog.semesters.get(sk);
        sem.types.push({ type: r._id.type, course_count: r.course_count, credits: r.total_credits });
        sem.total_credits += r.total_credits;
        sem.total_courses += r.course_count;
      }

      return text({ success: true, colid, academicyear, regulation,
        programs: [...programMap.values()].map(p => ({
          programcode: p.programcode, program: p.program,
          grand_total_credits: [...p.semesters.values()].reduce((s, r) => s + r.total_credits, 0),
          semesters: [...p.semesters.values()].sort((a, b) => String(a.semester).localeCompare(String(b.semester), undefined, { numeric: true }))
        }))
      });
    }
  );

  // ── report_seat_matrix ──────────────────────────────────────────────────────
  server.tool(
    "report_seat_matrix",
    "Seat matrix report for regulation subjects: total seats, general, SC, ST, EBC, EWS, PH, Sports, Supernumerary — grouped by program and type.",
    {
      academicyear: z.string().optional().describe("Filter by academic year e.g. 2026-27"),
      regulation:   z.string().optional().describe("Filter by regulation"),
      programcode:  z.string().optional().describe("Filter by program code"),
      type:         z.enum(["Major","Minor","AEC","SEC","VAC","IDC"]).optional()
    },
    async ({ academicyear, regulation, programcode, type }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const match = { colid };
      if (academicyear) match.academicyear = academicyear;
      if (regulation)   match.regulation   = regulation;
      if (programcode)  match.programcode  = programcode;
      if (type)         match.type         = type;

      const rows = await RegulationSubject.aggregate([
        { $match: match },
        { $group: {
          _id:           { programcode: "$programcode", program: "$program", type: "$type" },
          subject_count: { $sum: 1 },
          totalseats:    { $sum: "$totalseats" },
          general:       { $sum: "$general" },
          sc:            { $sum: "$sc" },
          st:            { $sum: "$st" },
          ebc:           { $sum: "$ebc" },
          ews:           { $sum: "$ews" },
          ph:            { $sum: "$ph" },
          sportsnccnss:  { $sum: "$sportsnccnss" },
          supernumerary: { $sum: "$supernumerary" }
        }},
        { $sort: { "_id.programcode": 1, "_id.type": 1 } }
      ]);

      const grandTotals = rows.reduce((acc, r) => {
        acc.totalseats    += r.totalseats;
        acc.general       += r.general;
        acc.sc            += r.sc;
        acc.st            += r.st;
        acc.ebc           += r.ebc;
        acc.ews           += r.ews;
        acc.ph            += r.ph;
        acc.sportsnccnss  += r.sportsnccnss;
        acc.supernumerary += r.supernumerary;
        return acc;
      }, { totalseats: 0, general: 0, sc: 0, st: 0, ebc: 0, ews: 0, ph: 0, sportsnccnss: 0, supernumerary: 0 });

      return text({ success: true, colid, academicyear, regulation,
        grand_totals: grandTotals,
        rows: rows.map(r => ({
          programcode: r._id.programcode, program: r._id.program, type: r._id.type,
          subject_count: r.subject_count, totalseats: r.totalseats, general: r.general,
          sc: r.sc, st: r.st, ebc: r.ebc, ews: r.ews, ph: r.ph,
          sportsnccnss: r.sportsnccnss, supernumerary: r.supernumerary
        }))
      });
    }
  );
}
