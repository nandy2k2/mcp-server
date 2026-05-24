/**
 * Student Data Upload — MCP Server
 *
 * Authentication mirrors Loginstud.js / facapicontroller.loginapi:
 *   • login tool: email + password → authenticate against MongoDB Users collection
 *   • All session fields (colid, user, name, role, token, insname, …) are stored
 *     in-memory, exactly like global1 in the frontend.
 *   • Every other tool uses the stored session for colid / user automatically.
 *     Callers may still override colid/user explicitly if needed.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import * as url from "url";
import dotenv from "dotenv";
import { registerProgramTools } from "./tools/program-tools.js";
import { registerCrmTools } from "./tools/crm-tools.js";
import { registerWorkloadTools } from "./tools/workload-tools.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

// ─── Global session  (mirrors frontend global1) ──────────────────────────────
const session = {
  // auth fields
  user:        "",   // email — global1.user / global1.studid
  name:        "",   // global1.name / global1.name1
  colid:       0,    // global1.colid / global1.admincolid
  role:        "",   // global1.role
  token:       "",   // global1.token
  regno:       "",   // global1.regno
  semester:    "",   // global1.semester
  section:     "",   // global1.section
  department:  "",   // global1.department
  programcode: "",   // global1.programcode
  category:    "",   // global1.category
  // institution fields (fetched separately in Loginstud.js)
  insname:     "",   // global1.insname
  instype:     "",   // global1.instype
  univid:      "",   // global1.univid
  collegecode: "",   // global1.collegecode
  logo:        "",   // global1.logo
  // fixed values set by Loginstud.js
  aqaryear:    "2020-21",
  calendaryear:"2020",
  assessment:  "2017-18,2018-19,2019-20,2020-21,2021-22",
  lmsyear:     "2024-25",
  // status
  loggedIn:    false
};

// ─── MongoDB Schemas ─────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  email:          { type: String, required: true, unique: true },
  name:           { type: String, default: "NA" },
  phone:          { type: String, default: "NA" },
  password:       { type: String, default: "NA" },
  role:           { type: String, default: "Student" },
  regno:          { type: String, default: "NA" },
  program:        { type: String, default: "NA" },
  programcode:    { type: String, default: "NA" },
  admissionyear:  { type: String, default: "NA" },
  academicyear:   { type: String },
  rollno:         { type: String },
  semester:       { type: String, default: "NA" },
  section:        { type: String, default: "NA" },
  gender:         { type: String },
  state:          { type: String },
  city:           { type: String },
  district:       { type: String },
  pincode:        { type: String },
  department:     { type: String, default: "NA" },
  photo:          { type: String },
  guardianname:   { type: String },
  guardianmobile: { type: String },
  guardianemail:  { type: String },
  category:       { type: String },
  address:        { type: String },
  quota:          { type: String },
  user:           { type: String },
  addedby:        { type: String },
  status1:        { type: String },
  comments:       { type: String },
  lastlogin:      { type: Date },
  colid:          { type: Number, required: true },
  status:         { type: Number, default: 1 },
  fathername:     { type: String },
  mothername:     { type: String },
  dob:            { type: String },
  regulation:     { type: String },
  institution:    { type: String },
  Major:          { type: String },
  Minor:          { type: String },
  AEC:            { type: String },
  SEC:            { type: String },
  VAC:            { type: String },
  IDC:            { type: String },
  customFields:   { type: Map, of: mongoose.Schema.Types.Mixed, default: {} }
});

// Institution schema — used in Loginstud.js getinstitutionname call
const institutionSchema = new mongoose.Schema({
  colid:           { type: Number },
  institutionname: { type: String },
  institutioncode: { type: String },
  type:            { type: String },
  admincolid:      { type: Number },
  logo:            { type: String },
  status:          { type: String }
}, { collection: "classes" });

const User        = mongoose.models.Users        || mongoose.model("Users",        userSchema);
const Institution = mongoose.models.Institution  || mongoose.model("Institution",  institutionSchema);

// ─── DB connection ────────────────────────────────────────────────────────────
let dbConnected = false;

async function connectDB() {
  if (dbConnected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set in .env");
  await mongoose.connect(uri);
  dbConnected = true;
}

// ─── Auth guard ───────────────────────────────────────────────────────────────
function requireAuth() {
  if (!session.loggedIn) {
    throw new Error("Not authenticated. Please run the 'login' tool first with your email and password.");
  }
}

// ─── Resolve colid / user from session (override allowed) ────────────────────
function resolveColid(arg)  { return arg && arg > 0   ? Number(arg)   : session.colid; }
function resolveUser(arg)   { return arg && arg !== "" ? String(arg)   : session.user; }
function resolveInstitution(arg) { return arg && arg !== "" ? String(arg) : session.insname; }

// ─── Student helpers (match backend studentdatauploadctlrds.js) ───────────────
const clean = (v) => String(v ?? "").trim();

const buildPayload = (body) => ({
  name:           clean(body.name)          || "NA",
  regno:          clean(body.regno)         || "NA",
  email:          clean(body.email),
  phone:          clean(body.phone)         || "NA",
  program:        clean(body.program)       || "NA",
  programcode:    clean(body.programcode)   || "NA",
  regulation:     clean(body.regulation)    || "NA",
  Major:          clean(body.Major || body.major) || "NA",
  Minor:          clean(body.Minor || body.minor) || "NA",
  AEC:            clean(body.AEC  || body.aec)    || "NA",
  SEC:            clean(body.SEC  || body.sec)    || "NA",
  VAC:            clean(body.VAC  || body.vac)    || "NA",
  IDC:            clean(body.IDC  || body.idc)    || "NA",
  academicyear:   clean(body.academicyear)  || "NA",
  admissionyear:  clean(body.admissionyear || body.academicyear) || "NA",
  rollno:         clean(body.rollno)        || "NA",
  gender:         clean(body.gender)        || "Not specified",
  category:       clean(body.category)      || "General",
  state:          clean(body.state)         || "NA",
  city:           clean(body.city)          || "NA",
  district:       clean(body.district)      || "NA",
  pincode:        clean(body.pincode)       || "NA",
  guardianname:   clean(body.guardianname)  || "NA",
  guardianmobile: clean(body.guardianmobile)|| "NA",
  guardianemail:  clean(body.guardianemail) || "NA",
  photo:          clean(body.photo),
  semester:       clean(body.semester)      || "NA",
  section:        clean(body.section)       || "NA",
  password:       "NA",
  role:           "Student",
  department:     "NA",
  status:         1,
  colid:          Number(body.colid),
  user:           clean(body.user),
  addedby:        clean(body.user),
  institution:    clean(body.institution),
  lastlogin:      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
});

const normalizeKey = (key) => String(key || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const aliasMap = {
  name:           ["name"],
  regno:          ["regno", "registrationno", "registrationnumber", "regid"],
  email:          ["email", "emailid", "emailaddress"],
  phone:          ["phone", "mobile", "mobileno", "phoneno"],
  program:        ["program", "programmename", "programme"],
  programcode:    ["programcode", "programmecode"],
  regulation:     ["regulation"],
  Major:          ["major"],
  Minor:          ["minor"],
  AEC:            ["aec"],
  SEC:            ["sec"],
  VAC:            ["vac"],
  IDC:            ["idc"],
  academicyear:   ["academicyear", "acadyear"],
  admissionyear:  ["admissionyear", "admyear"],
  rollno:         ["rollno", "rollnumber"],
  gender:         ["gender"],
  category:       ["category"],
  state:          ["state"],
  city:           ["city"],
  district:       ["district"],
  pincode:        ["pincode", "pin"],
  guardianname:   ["guardianname", "parentname"],
  guardianmobile: ["guardianmobile", "guardianphone", "parentmobile"],
  guardianemail:  ["guardianemail", "parentemail"],
  photo:          ["photo", "photolink", "photourl"],
  semester:       ["semester"],
  section:        ["section"]
};

function valueFromRow(row, field) {
  const normalized = {};
  for (const [k, v] of Object.entries(row)) normalized[normalizeKey(k)] = v;
  const keys = aliasMap[field] || [field.toLowerCase()];
  for (const key of keys) if (normalized[key] !== undefined) return normalized[key];
  return "";
}

function rowToStudentBody(row, colid, user, institution) {
  const body = { colid, user, institution };
  for (const field of Object.keys(aliasMap)) body[field] = valueFromRow(row, field);
  return body;
}

function serializeStudent(doc) {
  const d = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(d._id),
    name: d.name,        regno: d.regno,       email: d.email,
    phone: d.phone,      program: d.program,   programcode: d.programcode,
    regulation: d.regulation,
    Major: d.Major,      Minor: d.Minor,       AEC: d.AEC,
    SEC: d.SEC,          VAC: d.VAC,           IDC: d.IDC,
    academicyear: d.academicyear,  admissionyear: d.admissionyear,
    rollno: d.rollno,    gender: d.gender,     category: d.category,
    state: d.state,      city: d.city,         district: d.district,
    pincode: d.pincode,  guardianname: d.guardianname,
    guardianmobile: d.guardianmobile,          guardianemail: d.guardianemail,
    photo: d.photo,      semester: d.semester, section: d.section,
    institution: d.institution,  status: d.status,  colid: d.colid
  };
}

// ─── Text helper ──────────────────────────────────────────────────────────────
const text = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });

// ─── MCP Server ───────────────────────────────────────────────────────────────
const server = new McpServer({ name: "student-data-upload", version: "2.0.0" });

// ════════════════════════════════════════════════════════════════════════════════
// AUTH TOOLS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * login
 * Mirrors Loginstud.js → ep1.get('/api/v1/loginapi')
 * Authenticates directly against MongoDB (same logic as facapicontroller.loginapi).
 * Populates all session fields (global1 equivalent).
 */
server.tool(
  "login",
  "Sign in with your institutional email and password. This must be called before any other tool. Stores colid, user, name, role, insname and all session fields automatically — you will not need to provide them in subsequent calls.",
  {
    email:    z.string().email().describe("Your institutional email address"),
    password: z.string().min(1).describe("Your password")
  },
  async ({ email, password }) => {
    await connectDB();

    const found = await User.findOne({ email: email.toLowerCase().trim() }).lean();
    if (!found) return text({ success: false, error: "User not found. Check your email address." });
    if (found.password !== password) return text({ success: false, error: "Incorrect password." });
    if (found.status === 0) return text({ success: false, error: "Account is blocked. Contact your administrator." });

    // Generate JWT — same secret as backend config.env
    const jwtSecret = process.env.JWT_SECRET || "kumropatash-kuchu-pablo-posto-1980";
    const jwtExpires = process.env.JWT_EXPIRES_IN || "200h";
    const token = jwt.sign(
      { user: found.email, colid: String(found.colid) },
      jwtSecret,
      { expiresIn: jwtExpires }
    );

    // Populate session — mirrors global1 assignments in Loginstud.js
    session.user        = found.email;         // global1.user / global1.studid
    session.name        = found.name;          // global1.name / global1.name1
    session.colid       = Number(found.colid); // global1.colid / global1.admincolid
    session.role        = found.role;          // global1.role
    session.token       = token;               // global1.token
    session.regno       = found.regno || "";   // global1.regno
    session.semester    = found.semester || "";// global1.semester
    session.section     = found.section || ""; // global1.section
    session.department  = found.department || "";// global1.department
    session.programcode = found.programcode || "";// global1.programcode
    session.category    = found.category || ""; // global1.category
    session.loggedIn    = true;

    // Fetch institution info (mirrors the getinstitutionname call in Loginstud.js)
    try {
      const inst = await Institution.findOne({ colid: Number(found.colid) }).lean();
      if (inst) {
        session.insname     = inst.institutionname || ""; // global1.insname
        session.instype     = inst.type || "";            // global1.instype
        session.univid      = inst.admincolid || "";      // global1.univid
        session.collegecode = inst.institutioncode || ""; // global1.collegecode
        session.logo        = inst.logo || "";            // global1.logo
      }
    } catch (_) {
      // institution lookup is optional — don't fail login if it errors
    }

    return text({
      success:     true,
      message:     `Welcome, ${session.name}!`,
      session: {
        user:        session.user,
        name:        session.name,
        colid:       session.colid,
        role:        session.role,
        regno:       session.regno,
        semester:    session.semester,
        section:     session.section,
        department:  session.department,
        programcode: session.programcode,
        category:    session.category,
        insname:     session.insname,
        instype:     session.instype,
        collegecode: session.collegecode,
        token:       session.token
      }
    });
  }
);

// ── get_session ───────────────────────────────────────────────────────────────
server.tool(
  "get_session",
  "Show the currently logged-in user's session details (colid, name, role, insname, etc.). Equivalent to reading all global1 fields.",
  {},
  async () => {
    if (!session.loggedIn) return text({ loggedIn: false, message: "Not logged in. Use the 'login' tool first." });
    return text({ loggedIn: true, session: { ...session, token: session.token ? "***set***" : "" } });
  }
);

// ── logout ────────────────────────────────────────────────────────────────────
server.tool(
  "logout",
  "Clear the current session. After this, the login tool must be called again before using any student tools.",
  {},
  async () => {
    const name = session.name;
    Object.assign(session, {
      user: "", name: "", colid: 0, role: "", token: "", regno: "",
      semester: "", section: "", department: "", programcode: "", category: "",
      insname: "", instype: "", univid: "", collegecode: "", logo: "", loggedIn: false
    });
    return text({ success: true, message: `Logged out${name ? ` (was: ${name})` : ""}.` });
  }
);

// ════════════════════════════════════════════════════════════════════════════════
// STUDENT DATA TOOLS  (all auto-use session.colid + session.user)
// ════════════════════════════════════════════════════════════════════════════════

// ── list_students ─────────────────────────────────────────────────────────────
server.tool(
  "list_students",
  "List student records. Uses the logged-in user's college (colid) automatically. Login first.",
  {
    limit: z.number().int().min(1).max(500).optional().default(100).describe("Max records to return (default 100)"),
    colid: z.number().int().positive().optional().describe("Override college ID (uses session colid by default)")
  },
  async ({ limit, colid: colidArg }) => {
    requireAuth();
    await connectDB();
    const colid = resolveColid(colidArg);
    const students = await User.find({ colid, role: "Student" }).sort({ name: 1 }).limit(limit).lean();
    return text({ total: students.length, colid, students: students.map(serializeStudent) });
  }
);

// ── add_student ───────────────────────────────────────────────────────────────
server.tool(
  "add_student",
  "Add a single student record. colid and user are taken from your login session automatically.",
  {
    email:          z.string().email().describe("Student email (must be unique)"),
    name:           z.string().optional().default("").describe("Full name"),
    regno:          z.string().optional().default("").describe("Registration number"),
    phone:          z.string().optional().default("").describe("Phone number"),
    program:        z.string().optional().default("").describe("Program name e.g. B.Sc Computer Science"),
    programcode:    z.string().optional().default("").describe("Program code e.g. BSCS"),
    regulation:     z.string().optional().default("").describe("Regulation e.g. 2021"),
    academicyear:   z.string().optional().default("").describe("e.g. 2024-25"),
    admissionyear:  z.string().optional().default("").describe("e.g. 2023-24"),
    semester:       z.string().optional().default("").describe("Semester number 1-10"),
    section:        z.string().optional().default("").describe("Section e.g. A"),
    rollno:         z.string().optional().default("").describe("Roll number"),
    gender:         z.string().optional().default("").describe("Male / Female / Not specified"),
    category:       z.string().optional().default("").describe("General / SC / ST / OBC"),
    state:          z.string().optional().default("").describe("State"),
    city:           z.string().optional().default("").describe("City"),
    district:       z.string().optional().default("").describe("District"),
    pincode:        z.string().optional().default("").describe("Pincode"),
    guardianname:   z.string().optional().default("").describe("Guardian / parent name"),
    guardianmobile: z.string().optional().default("").describe("Guardian mobile"),
    guardianemail:  z.string().optional().default("").describe("Guardian email"),
    Major:          z.string().optional().default("").describe("Major subject"),
    Minor:          z.string().optional().default("").describe("Minor subject"),
    AEC:            z.string().optional().default("").describe("Ability Enhancement Course"),
    SEC:            z.string().optional().default("").describe("Skill Enhancement Course"),
    VAC:            z.string().optional().default("").describe("Value Added Course"),
    IDC:            z.string().optional().default("").describe("Interdisciplinary Course"),
    photo:          z.string().optional().default("").describe("Photo URL")
  },
  async (args) => {
    requireAuth();
    await connectDB();
    const payload = buildPayload({
      ...args,
      colid:       resolveColid(undefined),
      user:        resolveUser(undefined),
      institution: resolveInstitution(undefined)
    });
    if (!payload.email) return text({ error: "Email is required" });
    try {
      const doc = await User.create(payload);
      return text({ success: true, message: "Student added successfully", student: serializeStudent(doc) });
    } catch (err) {
      const msg = err.code === 11000 ? "Duplicate email — a student with this email already exists" : err.message;
      return text({ error: msg });
    }
  }
);

// ── update_student ────────────────────────────────────────────────────────────
server.tool(
  "update_student",
  "Update an existing student by MongoDB _id. Get the id from list_students. colid is taken from your session.",
  {
    id:             z.string().describe("Student MongoDB _id (from list_students)"),
    email:          z.string().email().describe("Student email"),
    name:           z.string().optional().default("").describe("Full name"),
    regno:          z.string().optional().default("").describe("Registration number"),
    phone:          z.string().optional().default("").describe("Phone"),
    program:        z.string().optional().default("").describe("Program name"),
    programcode:    z.string().optional().default("").describe("Program code"),
    regulation:     z.string().optional().default("").describe("Regulation"),
    academicyear:   z.string().optional().default("").describe("Academic year"),
    admissionyear:  z.string().optional().default("").describe("Admission year"),
    semester:       z.string().optional().default("").describe("Semester"),
    section:        z.string().optional().default("").describe("Section"),
    rollno:         z.string().optional().default("").describe("Roll number"),
    gender:         z.string().optional().default("").describe("Gender"),
    category:       z.string().optional().default("").describe("Category"),
    state:          z.string().optional().default("").describe("State"),
    city:           z.string().optional().default("").describe("City"),
    district:       z.string().optional().default("").describe("District"),
    pincode:        z.string().optional().default("").describe("Pincode"),
    guardianname:   z.string().optional().default("").describe("Guardian name"),
    guardianmobile: z.string().optional().default("").describe("Guardian mobile"),
    guardianemail:  z.string().optional().default("").describe("Guardian email"),
    Major:          z.string().optional().default("").describe("Major subject"),
    Minor:          z.string().optional().default("").describe("Minor subject"),
    AEC:            z.string().optional().default("").describe("AEC"),
    SEC:            z.string().optional().default("").describe("SEC"),
    VAC:            z.string().optional().default("").describe("VAC"),
    IDC:            z.string().optional().default("").describe("IDC"),
    photo:          z.string().optional().default("").describe("Photo URL")
  },
  async (args) => {
    requireAuth();
    await connectDB();
    const colid = resolveColid(undefined);
    const payload = buildPayload({
      ...args,
      colid,
      user:        resolveUser(undefined),
      institution: resolveInstitution(undefined)
    });
    if (!payload.email) return text({ error: "Email is required" });

    const duplicate = await User.findOne({ _id: { $ne: args.id }, email: payload.email }).lean();
    if (duplicate) return text({ error: "Duplicate email — another student already uses this email" });

    try {
      const doc = await User.findOneAndUpdate(
        { _id: args.id, colid, role: "Student" },
        payload,
        { new: true, runValidators: true }
      );
      if (!doc) return text({ error: "Student not found or does not belong to your college" });
      return text({ success: true, message: "Student updated", student: serializeStudent(doc) });
    } catch (err) {
      return text({ error: err.message });
    }
  }
);

// ── delete_student ────────────────────────────────────────────────────────────
server.tool(
  "delete_student",
  "Delete a student record by MongoDB _id. colid is taken from your session.",
  {
    id: z.string().describe("Student MongoDB _id (from list_students)")
  },
  async ({ id }) => {
    requireAuth();
    await connectDB();
    const colid = resolveColid(undefined);
    try {
      const doc = await User.findOneAndDelete({ _id: id, colid, role: "Student" });
      if (!doc) return text({ error: "Student not found or does not belong to your college" });
      return text({ success: true, message: "Student deleted", deleted: serializeStudent(doc) });
    } catch (err) {
      return text({ error: err.message });
    }
  }
);

// ── bulk_upload_from_excel ─────────────────────────────────────────────────────
server.tool(
  "bulk_upload_from_excel",
  "Upload multiple students from an Excel (.xlsx/.xls) file. First row = headers. Required column: email. colid and user come from your session automatically.",
  {
    file_path: z.string().describe("Absolute path to the Excel file, e.g. /Users/suman/Desktop/students.xlsx"),
    upsert:    z.boolean().optional().default(true).describe("true (default) = update existing students by email; false = skip duplicates")
  },
  async ({ file_path, upsert }) => {
    requireAuth();
    await connectDB();

    if (!fs.existsSync(file_path)) return text({ error: `File not found: ${file_path}` });

    let workbook;
    try {
      workbook = XLSX.readFile(file_path);
    } catch (err) {
      return text({ error: `Cannot read Excel file: ${err.message}` });
    }

    const sheet    = workbook.Sheets[workbook.SheetNames[0]];
    const excelRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    if (!excelRows.length) return text({ error: "Excel file has no data rows" });

    const colid       = resolveColid(undefined);
    const user        = resolveUser(undefined);
    const institution = resolveInstitution(undefined);
    const errors = [];
    let saved = 0, skipped = 0;

    for (let i = 0; i < excelRows.length; i++) {
      const rowNumber = i + 2;
      const body    = rowToStudentBody(excelRows[i], colid, user, institution);
      const payload = buildPayload(body);

      if (!payload.email) { errors.push({ rowNumber, msg: "Email is missing" }); continue; }

      try {
        if (upsert) {
          await User.findOneAndUpdate(
            { email: payload.email },
            payload,
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
          );
        } else {
          const exists = await User.findOne({ email: payload.email }).lean();
          if (exists) { skipped++; continue; }
          await User.create(payload);
        }
        saved++;
      } catch (err) {
        errors.push({ rowNumber, msg: err.message });
      }
    }

    return text({
      success:     true,
      file:        file_path,
      colid,
      user,
      total_rows:  excelRows.length,
      saved,
      skipped,
      error_count: errors.length,
      errors:      errors.slice(0, 20)
    });
  }
);

// ── bulk_upload_from_json ──────────────────────────────────────────────────────
server.tool(
  "bulk_upload_from_json",
  "Upload multiple students by providing a JSON array. Each object must have at least 'email'. colid and user come from your session automatically.",
  {
    students: z.array(z.object({
      email:          z.string(),
      name:           z.string().optional(),
      regno:          z.string().optional(),
      phone:          z.string().optional(),
      program:        z.string().optional(),
      programcode:    z.string().optional(),
      regulation:     z.string().optional(),
      academicyear:   z.string().optional(),
      admissionyear:  z.string().optional(),
      semester:       z.string().optional(),
      section:        z.string().optional(),
      rollno:         z.string().optional(),
      gender:         z.string().optional(),
      category:       z.string().optional(),
      state:          z.string().optional(),
      city:           z.string().optional(),
      district:       z.string().optional(),
      pincode:        z.string().optional(),
      guardianname:   z.string().optional(),
      guardianmobile: z.string().optional(),
      guardianemail:  z.string().optional(),
      Major:          z.string().optional(),
      Minor:          z.string().optional(),
      AEC:            z.string().optional(),
      SEC:            z.string().optional(),
      VAC:            z.string().optional(),
      IDC:            z.string().optional(),
      photo:          z.string().optional()
    })).min(1).describe("Array of student objects, each with at least 'email'"),
    upsert: z.boolean().optional().default(true).describe("Update existing by email if true")
  },
  async ({ students, upsert }) => {
    requireAuth();
    await connectDB();

    const colid       = resolveColid(undefined);
    const user        = resolveUser(undefined);
    const institution = resolveInstitution(undefined);
    const errors = [];
    let saved = 0, skipped = 0;

    for (let i = 0; i < students.length; i++) {
      const rowNumber = i + 1;
      const payload = buildPayload({ ...students[i], colid, user, institution });
      if (!payload.email) { errors.push({ rowNumber, msg: "Email is missing" }); continue; }

      try {
        if (upsert) {
          await User.findOneAndUpdate(
            { email: payload.email },
            payload,
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
          );
        } else {
          const exists = await User.findOne({ email: payload.email }).lean();
          if (exists) { skipped++; continue; }
          await User.create(payload);
        }
        saved++;
      } catch (err) {
        errors.push({ rowNumber, msg: err.message });
      }
    }

    return text({ success: true, colid, user, total: students.length, saved, skipped, error_count: errors.length, errors: errors.slice(0, 20) });
  }
);

// ── download_excel_template ───────────────────────────────────────────────────
server.tool(
  "download_excel_template",
  "Generate a blank Excel template (.xlsx) with all required student column headers for bulk upload.",
  {
    output_path: z.string().describe("Full path where the file should be saved, e.g. /Users/suman/Desktop/student_template.xlsx")
  },
  async ({ output_path }) => {
    const headers = {
      name: "", regno: "", email: "", phone: "", program: "", programcode: "",
      regulation: "", Major: "", Minor: "", AEC: "", SEC: "", VAC: "", IDC: "",
      academicyear: "", admissionyear: "", rollno: "", gender: "", category: "",
      state: "", city: "", district: "", pincode: "", guardianname: "",
      guardianmobile: "", guardianemail: "", semester: "", section: ""
    };
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([headers]);
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, output_path);
    return text({ success: true, path: output_path, columns: Object.keys(headers) });
  }
);

// ─── Program management tools ─────────────────────────────────────────────────
registerProgramTools(server, { requireAuth, resolveColid, resolveUser, connectDB });

// ─── CRM tools ────────────────────────────────────────────────────────────────
registerCrmTools(server, { requireAuth, resolveColid, resolveUser, connectDB });

// ─── Workload Assignment tools ────────────────────────────────────────────────
registerWorkloadTools(server, { requireAuth, resolveColid, resolveUser, connectDB });

// ─── Start ────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
