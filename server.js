/**
 * Student Data Upload — MCP Server (HTTP / Azure deployment)
 *
 * Transport : StreamableHTTPServerTransport  (POST + GET /mcp)
 * Auth      : x-api-key header checked against MCP_API_KEY env var
 * Sessions  : each MCP client connection gets its own McpServer instance
 *             with independent login state (mirrors global1 in the frontend)
 * Deploy    : Azure App Service (Node.js) or Azure Container Apps (Docker)
 */

import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { randomUUID } from "crypto";
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
import { registerRegulationTools } from "./tools/regulation-tools.js";
import { registerNepLmsTools } from "./tools/neplms-tools.js";
import { registerNepLmsAttendanceTools } from "./tools/neplms-attendance-tools.js";

// ─── Config ──────────────────────────────────────────────────────────────────
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const PORT        = process.env.PORT        || 8000;
const MONGODB_URI = process.env.MONGODB_URI;
const MCP_API_KEY = process.env.MCP_API_KEY;   // optional — leave blank to disable auth
const JWT_SECRET  = process.env.JWT_SECRET  || "kumropatash-kuchu-pablo-posto-1980";
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || "200h";

if (!MONGODB_URI) { console.error("FATAL: MONGODB_URI not set"); process.exit(1); }

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

const institutionSchema = new mongoose.Schema({
  colid:           { type: Number },
  institutionname: { type: String },
  institutioncode: { type: String },
  type:            { type: String },
  admincolid:      { type: Number },
  logo:            { type: String },
  status:          { type: String }
}, { collection: "classes" });

const User        = mongoose.models.Users       || mongoose.model("Users",       userSchema);
const Institution = mongoose.models.Institution || mongoose.model("Institution", institutionSchema);

// ─── DB connection ────────────────────────────────────────────────────────────
let dbConnected = false;
async function connectDB() {
  if (dbConnected) return;
  await mongoose.connect(MONGODB_URI);
  dbConnected = true;
  console.log("MongoDB connected");
}
connectDB().catch(err => console.error("MongoDB connection error:", err.message));

// ─── Student helpers ──────────────────────────────────────────────────────────
const clean = (v) => String(v ?? "").trim();

const buildPayload = (body) => ({
  name:           clean(body.name)           || "NA",
  regno:          clean(body.regno)          || "NA",
  email:          clean(body.email),
  phone:          clean(body.phone)          || "NA",
  program:        clean(body.program)        || "NA",
  programcode:    clean(body.programcode)    || "NA",
  regulation:     clean(body.regulation)     || "NA",
  Major:          clean(body.Major || body.major) || "NA",
  Minor:          clean(body.Minor || body.minor) || "NA",
  AEC:            clean(body.AEC  || body.aec)    || "NA",
  SEC:            clean(body.SEC  || body.sec)    || "NA",
  VAC:            clean(body.VAC  || body.vac)    || "NA",
  IDC:            clean(body.IDC  || body.idc)    || "NA",
  academicyear:   clean(body.academicyear)   || "NA",
  admissionyear:  clean(body.admissionyear || body.academicyear) || "NA",
  rollno:         clean(body.rollno)         || "NA",
  gender:         clean(body.gender)         || "Not specified",
  category:       clean(body.category)       || "General",
  state:          clean(body.state)          || "NA",
  city:           clean(body.city)           || "NA",
  district:       clean(body.district)       || "NA",
  pincode:        clean(body.pincode)        || "NA",
  guardianname:   clean(body.guardianname)   || "NA",
  guardianmobile: clean(body.guardianmobile) || "NA",
  guardianemail:  clean(body.guardianemail)  || "NA",
  photo:          clean(body.photo),
  semester:       clean(body.semester)       || "NA",
  section:        clean(body.section)        || "NA",
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
    id: String(d._id),   name: d.name,         regno: d.regno,
    email: d.email,      phone: d.phone,        program: d.program,
    programcode: d.programcode,                 regulation: d.regulation,
    Major: d.Major,      Minor: d.Minor,        AEC: d.AEC,
    SEC: d.SEC,          VAC: d.VAC,            IDC: d.IDC,
    academicyear: d.academicyear,               admissionyear: d.admissionyear,
    rollno: d.rollno,    gender: d.gender,      category: d.category,
    state: d.state,      city: d.city,          district: d.district,
    pincode: d.pincode,  guardianname: d.guardianname,
    guardianmobile: d.guardianmobile,           guardianemail: d.guardianemail,
    photo: d.photo,      semester: d.semester,  section: d.section,
    institution: d.institution,  status: d.status,  colid: d.colid
  };
}

const text = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });

// ─── Session state factory (one per MCP connection) ───────────────────────────
// This mirrors what Loginstud.js stores in global1.
function createLoginSession() {
  return {
    user: "", name: "", colid: 0, role: "", token: "",
    regno: "", semester: "", section: "", department: "",
    programcode: "", category: "",
    insname: "", instype: "", univid: "", collegecode: "", logo: "",
    aqaryear: "2020-21", calendaryear: "2020",
    assessment: "2017-18,2018-19,2019-20,2020-21,2021-22",
    lmsyear: "2024-25",
    loggedIn: false
  };
}

// ─── MCP server factory ───────────────────────────────────────────────────────
// Each HTTP connection gets its own McpServer + independent loginSession.
function createMcpServer() {
  const server  = new McpServer({ name: "student-data-upload", version: "2.0.0" });
  const ls      = createLoginSession();  // this session is private to this connection

  // helpers that read from ls
  const requireAuth = () => {
    if (!ls.loggedIn) throw new Error(
      "Not connected. Call POST /auth with your email and password to get a session_token, " +
      "then call the 'connect' tool with that token."
    );
  };
  const resolveColid  = (arg) => (arg && arg > 0 ? Number(arg) : ls.colid);
  const resolveUser   = (arg) => (arg && arg !== "" ? String(arg) : ls.user);
  const resolveInsname= (arg) => (arg && arg !== "" ? String(arg) : ls.insname);

  // ── connect ────────────────────────────────────────────────────────────────
  // Accepts a JWT session_token from POST /auth — never raw credentials.
  server.tool(
    "connect",
    "Activate your session using a session_token from POST /auth. " +
    "Call POST /auth with your email and password (curl or browser) to get the token, " +
    "then paste it here. Once connected all tools work automatically.",
    {
      session_token: z.string().min(10).describe(
        "JWT session token from POST /auth. Looks like eyJ..."
      )
    },
    async ({ session_token }) => {
      // ── Verify JWT ────────────────────────────────────────────────────
      let decoded;
      try {
        decoded = jwt.verify(session_token, JWT_SECRET);
      } catch (err) {
        return text({
          success: false,
          error: `Invalid or expired token (${err.message}). Call POST /auth again for a fresh one.`
        });
      }

      // ── Load full user record ─────────────────────────────────────────
      await connectDB();
      const found = await User.findOne({ email: decoded.user }).lean();
      if (!found) return text({ success: false, error: "User not found for this token." });
      if (found.status === 0) return text({ success: false, error: "Account is blocked." });

      // ── Populate session (mirrors Loginstud.js global1 assignments) ───
      ls.user        = found.email;
      ls.name        = found.name;
      ls.colid       = Number(found.colid);
      ls.role        = found.role;
      ls.token       = session_token;
      ls.regno       = found.regno       || "";
      ls.semester    = found.semester    || "";
      ls.section     = found.section     || "";
      ls.department  = found.department  || "";
      ls.programcode = found.programcode || "";
      ls.category    = found.category    || "";
      ls.loggedIn    = true;

      // ── Institution info ──────────────────────────────────────────────
      try {
        const inst = await Institution.findOne({ colid: Number(found.colid) }).lean();
        if (inst) {
          ls.insname     = inst.institutionname || "";
          ls.instype     = inst.type            || "";
          ls.univid      = inst.admincolid      || "";
          ls.collegecode = inst.institutioncode || "";
          ls.logo        = inst.logo            || "";
        }
      } catch (_) { /* institution lookup is optional */ }

      return text({
        success: true,
        message: `Connected as ${ls.name}!`,
        session: {
          user: ls.user,           name: ls.name,
          colid: ls.colid,         role: ls.role,
          regno: ls.regno,         semester: ls.semester,
          section: ls.section,     department: ls.department,
          programcode: ls.programcode, category: ls.category,
          insname: ls.insname,     instype: ls.instype,
          collegecode: ls.collegecode
        }
      });
    }
  );

  // ── get_session ────────────────────────────────────────────────────────────
  server.tool(
    "get_session",
    "Show the current session details — who is connected, colid, role, institution name, etc.",
    {},
    async () => {
      if (!ls.loggedIn) return text({ loggedIn: false, message: "Not connected. Call POST /auth, then use the 'connect' tool." });
      return text({ loggedIn: true, session: { ...ls, token: ls.token ? "***set***" : "" } });
    }
  );

  // ── logout ─────────────────────────────────────────────────────────────────
  server.tool(
    "logout",
    "Clear the current session.",
    {},
    async () => {
      const name = ls.name;
      Object.assign(ls, createLoginSession());
      return text({ success: true, message: `Logged out${name ? ` (was: ${name})` : ""}.` });
    }
  );

  // ── list_students ──────────────────────────────────────────────────────────
  server.tool(
    "list_students",
    "List student records for your college. Login required. colid is taken from your session.",
    {
      limit: z.number().int().min(1).max(500).optional().default(100).describe("Max records (default 100)"),
      colid: z.number().int().positive().optional().describe("Override college ID (session default)")
    },
    async ({ limit, colid: colidArg }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(colidArg);
      const students = await User.find({ colid, role: "Student" }).sort({ name: 1 }).limit(limit).lean();
      return text({ total: students.length, colid, students: students.map(serializeStudent) });
    }
  );

  // ── add_student ────────────────────────────────────────────────────────────
  server.tool(
    "add_student",
    "Add a single student record. colid and user come from your login session automatically.",
    {
      email:          z.string().email().describe("Student email (must be unique)"),
      name:           z.string().optional().default("").describe("Full name"),
      regno:          z.string().optional().default("").describe("Registration number"),
      phone:          z.string().optional().default("").describe("Phone"),
      program:        z.string().optional().default("").describe("Program name"),
      programcode:    z.string().optional().default("").describe("Program code"),
      regulation:     z.string().optional().default("").describe("Regulation"),
      academicyear:   z.string().optional().default("").describe("e.g. 2024-25"),
      admissionyear:  z.string().optional().default("").describe("e.g. 2023-24"),
      semester:       z.string().optional().default("").describe("1-10"),
      section:        z.string().optional().default("").describe("e.g. A"),
      rollno:         z.string().optional().default("").describe("Roll number"),
      gender:         z.string().optional().default("").describe("Male / Female / Not specified"),
      category:       z.string().optional().default("").describe("General / SC / ST / OBC"),
      state:          z.string().optional().default("").describe("State"),
      city:           z.string().optional().default("").describe("City"),
      district:       z.string().optional().default("").describe("District"),
      pincode:        z.string().optional().default("").describe("Pincode"),
      guardianname:   z.string().optional().default("").describe("Guardian name"),
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
        institution: resolveInsname(undefined)
      });
      if (!payload.email) return text({ error: "Email is required" });
      try {
        const doc = await User.create(payload);
        return text({ success: true, message: "Student added successfully", student: serializeStudent(doc) });
      } catch (err) {
        const msg = err.code === 11000 ? "Duplicate email — this email is already registered" : err.message;
        return text({ error: msg });
      }
    }
  );

  // ── update_student ─────────────────────────────────────────────────────────
  server.tool(
    "update_student",
    "Update an existing student by MongoDB _id. Get the id from list_students.",
    {
      id:             z.string().describe("Student MongoDB _id"),
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
      const colid   = resolveColid(undefined);
      const payload = buildPayload({
        ...args,
        colid,
        user:        resolveUser(undefined),
        institution: resolveInsname(undefined)
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

  // ── delete_student ─────────────────────────────────────────────────────────
  server.tool(
    "delete_student",
    "Delete a student record by MongoDB _id. colid is taken from your session.",
    { id: z.string().describe("Student MongoDB _id") },
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

  // ── bulk_upload_from_excel ─────────────────────────────────────────────────
  server.tool(
    "bulk_upload_from_excel",
    "Upload students from an Excel file (.xlsx/.xls). First row = headers. Required column: email. colid/user from session.",
    {
      file_path: z.string().describe("Absolute path to the Excel file on the SERVER (not your laptop). For local use, provide the path."),
      upsert:    z.boolean().optional().default(true).describe("true = update existing by email; false = skip duplicates")
    },
    async ({ file_path, upsert }) => {
      requireAuth();
      await connectDB();
      if (!fs.existsSync(file_path)) return text({ error: `File not found on server: ${file_path}` });
      let workbook;
      try { workbook = XLSX.readFile(file_path); } catch (err) { return text({ error: `Cannot read file: ${err.message}` }); }
      const sheet     = workbook.Sheets[workbook.SheetNames[0]];
      const excelRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      if (!excelRows.length) return text({ error: "No data rows found in the file" });

      const colid = resolveColid(undefined), user = resolveUser(undefined), institution = resolveInsname(undefined);
      const errors = []; let saved = 0, skipped = 0;

      for (let i = 0; i < excelRows.length; i++) {
        const rowNumber = i + 2;
        const payload   = buildPayload(rowToStudentBody(excelRows[i], colid, user, institution));
        if (!payload.email) { errors.push({ rowNumber, msg: "Email missing" }); continue; }
        try {
          if (upsert) {
            await User.findOneAndUpdate({ email: payload.email }, payload, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
          } else {
            if (await User.findOne({ email: payload.email }).lean()) { skipped++; continue; }
            await User.create(payload);
          }
          saved++;
        } catch (err) { errors.push({ rowNumber, msg: err.message }); }
      }
      return text({ success: true, colid, total_rows: excelRows.length, saved, skipped, error_count: errors.length, errors: errors.slice(0, 20) });
    }
  );

  // ── bulk_upload_from_json ──────────────────────────────────────────────────
  server.tool(
    "bulk_upload_from_json",
    "Upload multiple students by providing a JSON array. Each object must have 'email'. colid/user from session.",
    {
      students: z.array(z.object({
        email: z.string(), name: z.string().optional(), regno: z.string().optional(),
        phone: z.string().optional(), program: z.string().optional(), programcode: z.string().optional(),
        regulation: z.string().optional(), academicyear: z.string().optional(), admissionyear: z.string().optional(),
        semester: z.string().optional(), section: z.string().optional(), rollno: z.string().optional(),
        gender: z.string().optional(), category: z.string().optional(), state: z.string().optional(),
        city: z.string().optional(), district: z.string().optional(), pincode: z.string().optional(),
        guardianname: z.string().optional(), guardianmobile: z.string().optional(), guardianemail: z.string().optional(),
        Major: z.string().optional(), Minor: z.string().optional(), AEC: z.string().optional(),
        SEC: z.string().optional(), VAC: z.string().optional(), IDC: z.string().optional(),
        photo: z.string().optional()
      })).min(1),
      upsert: z.boolean().optional().default(true)
    },
    async ({ students, upsert }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined), user = resolveUser(undefined), institution = resolveInsname(undefined);
      const errors = []; let saved = 0, skipped = 0;
      for (let i = 0; i < students.length; i++) {
        const rowNumber = i + 1;
        const payload   = buildPayload({ ...students[i], colid, user, institution });
        if (!payload.email) { errors.push({ rowNumber, msg: "Email missing" }); continue; }
        try {
          if (upsert) {
            await User.findOneAndUpdate({ email: payload.email }, payload, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
          } else {
            if (await User.findOne({ email: payload.email }).lean()) { skipped++; continue; }
            await User.create(payload);
          }
          saved++;
        } catch (err) { errors.push({ rowNumber, msg: err.message }); }
      }
      return text({ success: true, colid, total: students.length, saved, skipped, error_count: errors.length, errors: errors.slice(0, 20) });
    }
  );

  // ── download_excel_template ────────────────────────────────────────────────
  server.tool(
    "download_excel_template",
    "Generate a blank Excel template with all required column headers for bulk student upload.",
    { output_path: z.string().describe("Absolute path where the file should be saved on the server, e.g. /tmp/student_template.xlsx") },
    async ({ output_path }) => {
      const headers = {
        name: "", regno: "", email: "", phone: "", program: "", programcode: "",
        regulation: "", Major: "", Minor: "", AEC: "", SEC: "", VAC: "", IDC: "",
        academicyear: "", admissionyear: "", rollno: "", gender: "", category: "",
        state: "", city: "", district: "", pincode: "", guardianname: "",
        guardianmobile: "", guardianemail: "", semester: "", section: ""
      };
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([headers]), "Students");
      XLSX.writeFile(wb, output_path);
      return text({ success: true, path: output_path, columns: Object.keys(headers) });
    }
  );

  // ── Program management tools (no delete) ──────────────────────────────────
  registerProgramTools(server, { requireAuth, resolveColid, resolveUser, connectDB });

  // ── CRM tools ─────────────────────────────────────────────────────────────
  registerCrmTools(server, { requireAuth, resolveColid, resolveUser, connectDB });

  // ── Workload Assignment tools ─────────────────────────────────────────────
  registerWorkloadTools(server, { requireAuth, resolveColid, resolveUser, connectDB });

  // ── Regulation tools ──────────────────────────────────────────────────────
  registerRegulationTools(server, { requireAuth, resolveColid, resolveUser, connectDB });

  // ── NEP-LMS Course Workspace tools ────────────────────────────────────────
  registerNepLmsTools(server, { requireAuth, resolveColid, resolveUser, connectDB });

  // ── NEP-LMS Attendance tools ──────────────────────────────────────────────
  registerNepLmsAttendanceTools(server, { requireAuth, resolveColid, resolveUser, connectDB });

  return server;
}

// ─── Express app ──────────────────────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: "10mb" }));

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

// API key middleware — protects /mcp and /messages endpoints
const apiKeyGuard = (req, res, next) => {
  if (!MCP_API_KEY) return next();
  const provided = req.headers["x-api-key"] || req.query.api_key;
  if (!provided || provided !== MCP_API_KEY) {
    return res.status(401).json({ error: "Unauthorized — invalid or missing x-api-key header" });
  }
  next();
};
app.use("/mcp", apiKeyGuard);
app.use("/messages", apiKeyGuard);

// ── POST /auth ────────────────────────────────────────────────────────────────
// Token generation endpoint — NOT an MCP tool.
// The user calls this directly (curl / browser) to get a JWT session_token,
// then pastes the token into Claude via the 'connect' MCP tool.
// This keeps raw credentials completely out of the Claude conversation.
//
// Example:
//   curl -X POST https://yourserver/auth \
//        -H "Content-Type: application/json" \
//        -d '{"email":"you@college.edu","password":"yourpass"}'
//
app.post("/auth", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }
  try {
    await connectDB();
    const found = await User.findOne({ email: email.toLowerCase().trim() }).lean();
    if (!found)                    return res.status(401).json({ error: "User not found" });
    if (found.password !== password) return res.status(401).json({ error: "Incorrect password" });
    if (found.status === 0)        return res.status(403).json({ error: "Account is blocked" });

    const session_token = jwt.sign(
      { user: found.email, colid: String(found.colid) },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      session_token,
      user:    found.email,
      name:    found.name,
      role:    found.role,
      colid:   found.colid,
      hint:    "Copy session_token and paste into Claude: connect <token>"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Active Streamable HTTP sessions: sessionId → { transport, mcpServer }
const activeSessions = new Map();
// Active SSE sessions (mcp-remote fallback): sessionId → { transport, mcpServer }
const sseSessions = new Map();

// POST /mcp — new connection or resume existing Streamable HTTP session
app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"];

  if (sessionId && activeSessions.has(sessionId)) {
    // Resume known session
    await activeSessions.get(sessionId).transport.handleRequest(req, res, req.body);
    return;
  }

  // No session ID  →  brand new connection
  // Stale/unknown session ID  →  Azure restarted and lost in-memory state; treat as new
  if (sessionId) {
    console.log(`Stale session ${sessionId.slice(0, 8)}… — creating fresh session`);
    delete req.headers["mcp-session-id"]; // strip stale ID so transport initialises cleanly
  }

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID() });
  const mcpServer = createMcpServer();
  transport.onclose = () => {
    console.log(`StreamableHTTP session closed: ${transport.sessionId}`);
    activeSessions.delete(transport.sessionId);
  };
  await mcpServer.connect(transport);

  // sessionId is assigned by the SDK inside handleRequest (when 'initialize' is processed)
  // so we MUST await handleRequest first, then store with the real session ID
  await transport.handleRequest(req, res, req.body);

  if (transport.sessionId) {
    activeSessions.set(transport.sessionId, { transport, mcpServer });
    console.log(`New StreamableHTTP session: ${transport.sessionId}  (active: ${activeSessions.size})`);
  }
});

// GET /mcp — two modes:
//   • With valid mcp-session-id  →  Streamable HTTP SSE stream (existing session)
//   • Without session ID         →  SSE-only fallback (mcp-remote auto-strategy)
app.get("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"];

  if (sessionId && activeSessions.has(sessionId)) {
    // Streamable HTTP: stream server→client messages for this session
    await activeSessions.get(sessionId).transport.handleRequest(req, res);
    return;
  }

  // SSE fallback mode — mcp-remote uses this when Streamable HTTP fails
  // SSEServerTransport opens the stream on this response and sends an 'endpoint' event
  // telling the client where to POST messages (/messages?sessionId=xxx)
  console.log("SSE fallback: creating new SSE session");
  const sseTransport = new SSEServerTransport("/messages", res);
  const mcpServer    = createMcpServer();
  sseSessions.set(sseTransport.sessionId, { transport: sseTransport, mcpServer });
  sseTransport.onclose = () => {
    console.log(`SSE session closed: ${sseTransport.sessionId}`);
    sseSessions.delete(sseTransport.sessionId);
  };
  await mcpServer.connect(sseTransport);  // opens the SSE stream, sends endpoint event
});

// POST /messages — SSE message relay (used by mcp-remote SSE fallback)
app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  const entry     = sseSessions.get(sessionId);
  if (!entry) {
    return res.status(404).json({ error: "SSE session not found or expired. Reconnect via GET /mcp." });
  }
  await entry.transport.handlePostMessage(req, res, req.body);
});

// DELETE /mcp — explicit session close (both transport types)
app.delete("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"];
  if (sessionId) {
    const http = activeSessions.get(sessionId);
    if (http) { await http.transport.close(); activeSessions.delete(sessionId); }
    const sse  = sseSessions.get(sessionId);
    if (sse)  { await sse.transport.close();  sseSessions.delete(sessionId); }
  }
  res.status(200).json({ success: true });
});

// GET /health — Azure App Service health probe
app.get("/health", (req, res) => {
  res.json({
    status:            "ok",
    streamableSessions: activeSessions.size,
    sseSessions:        sseSessions.size,
    dbConnected:        mongoose.connection.readyState === 1,
    uptime:             Math.floor(process.uptime())
  });
});

// Root
app.get("/", (req, res) => {
  res.json({ name: "student-data-upload MCP server", version: "2.0.0", endpoint: "/mcp" });
});

// GET /token — browser UI for generating a session token
// Open this page in any browser, fill in email + password, copy the token.
app.get("/token", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Get Session Token — MCP Server</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f0f4f8;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
      padding: 36px 40px;
      width: 100%;
      max-width: 460px;
    }
    h1 { font-size: 1.3rem; color: #1a202c; margin-bottom: 6px; }
    .subtitle { font-size: 0.85rem; color: #718096; margin-bottom: 28px; }
    label { display: block; font-size: 0.82rem; font-weight: 600; color: #4a5568; margin-bottom: 6px; }
    input {
      width: 100%;
      padding: 10px 14px;
      border: 1.5px solid #cbd5e0;
      border-radius: 8px;
      font-size: 0.95rem;
      margin-bottom: 16px;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus { border-color: #667eea; }
    button {
      width: 100%;
      padding: 11px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #5a67d8; }
    button:disabled { background: #a0aec0; cursor: not-allowed; }
    .result { margin-top: 24px; display: none; }
    .result.show { display: block; }
    .result-label { font-size: 0.82rem; font-weight: 600; color: #4a5568; margin-bottom: 6px; }
    .token-box {
      background: #1a202c;
      color: #68d391;
      padding: 14px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 0.78rem;
      word-break: break-all;
      white-space: pre-wrap;
      max-height: 120px;
      overflow-y: auto;
    }
    .copy-btn {
      margin-top: 10px;
      background: #38a169;
      font-size: 0.85rem;
      padding: 8px;
    }
    .copy-btn:hover { background: #2f855a; }
    .claude-box {
      margin-top: 16px;
      background: #ebf8ff;
      border: 1.5px solid #90cdf4;
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 0.82rem;
      color: #2b6cb0;
    }
    .claude-box strong { display: block; margin-bottom: 4px; }
    .error-box {
      margin-top: 16px;
      background: #fff5f5;
      border: 1.5px solid #fc8181;
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 0.85rem;
      color: #c53030;
      display: none;
    }
    .error-box.show { display: block; }
    .user-info { margin-top: 12px; font-size: 0.82rem; color: #4a5568; }
    .user-info span { font-weight: 600; color: #2d3748; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🔑 Get Session Token</h1>
    <p class="subtitle">Sign in to generate a token for Claude MCP sessions.</p>

    <label for="email">Email</label>
    <input type="email" id="email" placeholder="you@institution.edu" autocomplete="email" />

    <label for="password">Password</label>
    <input type="password" id="password" placeholder="Your password" autocomplete="current-password" />

    <button id="btn" onclick="getToken()">Generate Token</button>

    <div class="error-box" id="err"></div>

    <div class="result" id="result">
      <div class="user-info" id="userInfo"></div>
      <div class="result-label" style="margin-top:14px;">Session Token</div>
      <div class="token-box" id="tokenBox"></div>
      <button class="copy-btn" onclick="copyToken()">📋 Copy Token</button>
      <div class="claude-box">
        <strong>Paste into Claude:</strong>
        connect &lt;paste token here&gt;
      </div>
    </div>
  </div>

  <script>
    let currentToken = "";

    async function getToken() {
      const email    = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const btn      = document.getElementById("btn");
      const err      = document.getElementById("err");
      const result   = document.getElementById("result");

      err.classList.remove("show");
      result.classList.remove("show");

      if (!email || !password) {
        err.textContent = "Please enter both email and password.";
        err.classList.add("show");
        return;
      }

      btn.disabled = true;
      btn.textContent = "Generating…";

      try {
        const resp = await fetch("/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await resp.json();

        if (!resp.ok) {
          err.textContent = data.error || "Authentication failed.";
          err.classList.add("show");
          return;
        }

        currentToken = data.session_token;
        document.getElementById("tokenBox").textContent = currentToken;
        document.getElementById("userInfo").innerHTML =
          "Signed in as <span>" + data.name + "</span> &nbsp;·&nbsp; " +
          "Role: <span>" + data.role + "</span> &nbsp;·&nbsp; " +
          "College ID: <span>" + data.colid + "</span>";
        result.classList.add("show");

      } catch (e) {
        err.textContent = "Network error: " + e.message;
        err.classList.add("show");
      } finally {
        btn.disabled = false;
        btn.textContent = "Generate Token";
      }
    }

    function copyToken() {
      navigator.clipboard.writeText(currentToken).then(() => {
        const btn = document.querySelector(".copy-btn");
        btn.textContent = "✅ Copied!";
        setTimeout(() => btn.textContent = "📋 Copy Token", 2000);
      });
    }

    // Allow Enter key to submit
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter") getToken();
    });
  </script>
</body>
</html>`);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Student MCP server running on port ${PORT}`);
  console.log(`MCP endpoint : POST/GET http://0.0.0.0:${PORT}/mcp`);
  console.log(`Health check : GET  http://0.0.0.0:${PORT}/health`);
  if (MCP_API_KEY) console.log("API key auth : enabled (x-api-key header required)");
  else             console.log("API key auth : DISABLED — set MCP_API_KEY env var in production");
});
