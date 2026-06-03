/**
 * admission-application-tools.js
 *
 * MCP tools mirroring admissionapplicationmanagementctlrds.js
 *
 * Collection: admissionapplicationdynamics  (AdmissionApplication model)
 *
 * Tools:
 *   get_admission_application_options    – all filterable fields + distinct values
 *   search_admission_applications        – search/filter applications
 *   get_general_admission_options        – academic years, regulations, programs for admit panel
 *   update_admission_application_status  – bulk status change (Draft/Applied/Admitted)
 *   admit_applications_to_students       – ⚠️ WRITE: convert applicants → User accounts
 *   send_admission_email                 – ⚠️ WRITE: email selected applicants
 *
 * Note: No delete tools per policy.
 */

import mongoose from "mongoose";
import { z } from "zod";
import nodemailer from "nodemailer";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const appSchema = new mongoose.Schema(
  {
    colid: Number, formid: String, academicyear: String,
    name: String, applicationid: String, applicationnumber: String,
    username: String, password: String, email: String, phone: String,
    regno: String, address: String, pin: String,
    country_form: String, state_form: String, district_form: String,
    result_status_12th: String, board_12th: String, marks_type_12th: String,
    marks_12: Number, cgpa_12: String,
    result_status_10th: String, board_10th: String, marks_type_10th: String,
    marks_10: Number, cgpa_10: String,
    University_UG: String, result_status_UG: String, marks_type_UG: String,
    marks_UG: Number, cgpa_UG: String,
    University_PG: String, result_status_PG: String, marks_type_PG: String,
    marks_PG: Number, cgpa_PG: String,
    gender: String, category: String, ews: String, ph: String, minority: String,
    tenthmarks: Number, twelvemarks: Number, externaltheorymarks: Number, englishmarks: Number,
    dateofbirth: String, dateofapplication: String, age: Number,
    twelvesubjects: String, level: String, programtype: String,
    programapplied: String, programcode: String,
    applicationstatus: { type: String, default: "Applied" },
    validationstatus: String, validationcomments: String,
    extraFields: mongoose.Schema.Types.Mixed,
    applicationfeeamount: Number, paymentstatus: String,
    paymentrefno: String, paidamount: Number, paiddate: Date,
    provisionalfeeamount: Number, provisionalpaymentstatus: String,
    provisionalpaymentrefno: String, provisionalpaidamount: Number, provisionalpaiddate: Date,
    user: String
  },
  { strict: false, timestamps: true, collection: "admissionapplicationdynamics" }
);

const formFieldSchema = new mongoose.Schema(
  { colid: Number, fieldname: String, label: String, formid: String,
    page: String, section: String, order: Number, isactive: String },
  { strict: false, collection: "admissionformfields" }
);

const emailConfigSchema = new mongoose.Schema(
  { colid: Number, provider: String, smtp: String, smptp: String,
    port: mongoose.Schema.Types.Mixed, secure: String,
    username: String, password: String, isactive: String, default: String },
  { strict: false, collection: "emailconfigurationds" }
);

const regulationMasterSchema = new mongoose.Schema(
  { colid: Number, regulation: String, isactive: String },
  { strict: false, collection: "regulationmasterds" }
);

const regulationSubjectSchema = new mongoose.Schema(
  { colid: Number, regulation: String, academicyear: String,
    program: String, programcode: String, subject: String, type: String },
  { strict: false, collection: "regulationsubjectds" }
);

const mprogramsSchema = new mongoose.Schema(
  { colid: Number, program: String, name: String, programcode: String, year: String, Order: Number },
  { strict: false, collection: "mprograms" }
);

const userSchema = new mongoose.Schema(
  {
    email: String, name: String, phone: String, password: String, role: String,
    regno: String, program: String, programcode: String,
    admissionyear: String, academicyear: String, rollno: String,
    semester: String, section: String, gender: String,
    state: String, city: String, district: String, pincode: String,
    department: String, photo: String, category: String, address: String,
    guardianname: String, guardianmobile: String, guardianemail: String,
    fathername: String, mothername: String, dob: String,
    colid: Number, status: Number, user: String, addedby: String,
    institution: String, regulation: String,
    Major: String, Minor: String, AEC: String, SEC: String, VAC: String, IDC: String,
    isdisabled: String, admissionapplicationid: String, lastlogin: Date
  },
  { strict: false, collection: "users" }
);

// ── Guarded model registrations ───────────────────────────────────────────────
const AdmApp   = mongoose.models.AdmAppMgmt      || mongoose.model("AdmAppMgmt",      appSchema,             "admissionapplicationdynamics");
const AdmField = mongoose.models.AdmFieldMgmt    || mongoose.model("AdmFieldMgmt",    formFieldSchema,       "admissionformfields");
const EmailCfg = mongoose.models.EmailCfgAdm     || mongoose.model("EmailCfgAdm",     emailConfigSchema,     "emailconfigurationds");
const RegMaster= mongoose.models.RegMasterAdm    || mongoose.model("RegMasterAdm",    regulationMasterSchema,"regulationmasterds");
const RegSubj  = mongoose.models.RegSubjAdm      || mongoose.model("RegSubjAdm",      regulationSubjectSchema,"regulationsubjectds");
const MProgAdm = mongoose.models.MProgramsAdm    || mongoose.model("MProgramsAdm",    mprogramsSchema,       "mprograms");
const UserAdm  = mongoose.models.UserAdmission   || mongoose.model("UserAdmission",   userSchema,            "users");

// ─── Helpers (mirrors controller exactly) ────────────────────────────────────
function safeNum(v)     { const n = Number(v ?? 0); return Number.isNaN(n) ? 0 : n; }
function cleanStr(v)    { return String(v ?? "").trim(); }
function escRx(v)       { return cleanStr(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function safeHtml(v)    {
  return cleanStr(v).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
function randPass() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// Build a Mongoose query from a filter descriptor {field, value}
// field: base field name OR "extraFields.<fieldname>"
// value: string (regex) or array ($in)
function applyFilter(query, filter) {
  if (!filter?.field) return;
  const { field, value } = filter;
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    const vals = value.map(cleanStr).filter(Boolean);
    if (vals.length) query[field] = { $in: vals };
    return;
  }
  if (cleanStr(value) === "") return;
  query[field] = { $regex: escRx(value), $options: "i" };
}

function getSmtpHost(cfg) {
  if (cfg.smtp)  return cfg.smtp;
  if (cfg.smptp) return cfg.smptp;
  if (/gmail/i.test(cfg.provider || "")) return "smtp.gmail.com";
  return "";
}

const BASE_FIELDS = [
  "formid","academicyear","name","username","email","phone","regno","address","pin",
  "country_form","state_form","district_form",
  "result_status_12th","board_12th","marks_type_12th","marks_12","cgpa_12",
  "result_status_10th","board_10th","marks_type_10th","marks_10","cgpa_10",
  "University_UG","result_status_UG","marks_type_UG","marks_UG","cgpa_UG",
  "University_PG","result_status_PG","marks_type_PG","marks_PG","cgpa_PG",
  "gender","category","ews","ph","minority",
  "tenthmarks","twelvemarks","externaltheorymarks","englishmarks",
  "dateofbirth","dateofapplication","age","twelvesubjects",
  "programtype","programapplied","programcode",
  "applicationstatus","validationstatus",
  "applicationfeeamount","paymentstatus","paymentrefno","paidamount","paiddate",
  "provisionalfeeamount","provisionalpaymentstatus","provisionalpaymentrefno",
  "provisionalpaidamount","provisionalpaiddate","user","createdAt","updatedAt"
];

// ─── Tool registration ────────────────────────────────────────────────────────
export function registerAdmissionApplicationTools(server, { requireAuth, resolveColid, resolveUser, connectDB }) {
  const text = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });

  // ════════════════════════════════════════════════════════════════════════════
  // 1. get_admission_application_options
  //    Mirrors getOptions — returns all filterable fields + distinct values.
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "get_admission_application_options",
    "Get all filterable field definitions and their distinct values for the admission " +
    "application management search. Returns base fields plus any custom extraFields " +
    "configured via admission form fields. Use this to know what values are valid " +
    "before calling search_admission_applications.",
    { colid: z.number().optional().describe("College ID (from session)") },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);

      // Custom form fields
      const customFields = await AdmField.find({ colid, isactive: /^Yes$/i })
        .select("fieldname label formid page section order")
        .sort({ formid: 1, order: 1 })
        .lean();

      // Also discover extraFields keys from actual applications
      const apps = await AdmApp.find({ colid }).select("extraFields").lean();
      const observedKeys = [...new Set(apps.flatMap((a) => {
        if (!a.extraFields || typeof a.extraFields !== "object" || Array.isArray(a.extraFields)) return [];
        return Object.keys(a.extraFields);
      }))].sort();

      const customMap = new Map();
      customFields.forEach((f) => {
        if (!f.fieldname) return;
        customMap.set(f.fieldname, {
          field: `extraFields.${f.fieldname}`,
          label: f.label || f.fieldname,
          source: "custom",
          formid: f.formid || "", page: f.page || "", section: f.section || ""
        });
      });
      observedKeys.forEach((k) => {
        if (!k || customMap.has(k)) return;
        customMap.set(k, { field: `extraFields.${k}`, label: k, source: "custom", formid: "", page: "", section: "" });
      });

      const fields = [
        ...BASE_FIELDS.map((f) => ({ field: f, label: f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), source: "base" })),
        ...Array.from(customMap.values())
      ];

      // Fetch distinct values for all fields except password/validationcomments
      const options = {};
      await Promise.all(
        fields
          .filter(({ field }) => field !== "password" && field !== "validationcomments")
          .map(async ({ field }) => {
            const vals = await AdmApp.distinct(field, { colid });
            options[field] = vals.map(cleanStr).filter(Boolean).sort((a, b) => a.localeCompare(b));
          })
      );

      return text({ success: true, fieldCount: fields.length, fields, options });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 2. search_admission_applications
  //    Mirrors searchApplications — filter with field/value pairs.
  //    field: base field name OR "extraFields.<fieldname>" for custom fields.
  //    value: string (regex match, case-insensitive) OR array (exact $in match).
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "search_admission_applications",
    "Search and filter admission applications. " +
    "Each filter has a field (base field name or 'extraFields.<name>' for custom) " +
    "and a value (string for regex match, or array for exact multi-value match). " +
    "Returns applications sorted by submission date descending. " +
    "Use get_admission_application_options to discover valid field names and values.",
    {
      colid:   z.number().optional().describe("College ID (from session)"),
      filters: z.array(z.object({
        field: z.string().describe(
          "Field name e.g. 'applicationstatus', 'programcode', 'academicyear', " +
          "'gender', 'paymentstatus', or 'extraFields.fieldname' for custom fields"
        ),
        value: z.union([
          z.string(),
          z.array(z.string())
        ]).describe("String for regex match, or array of strings for exact $in match")
      })).optional().describe("Filter criteria — omit for all applications"),
      limit: z.number().int().min(1).max(5000).optional().default(200)
        .describe("Max applications to return (default 200)")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);
      const query = { colid };
      (params.filters || []).forEach((f) => applyFilter(query, f));

      const data = await AdmApp.find(query)
        .sort({ createdAt: -1 })
        .limit(params.limit ?? 200)
        .lean();

      return text({
        success: true,
        count:   data.length,
        data: data.map((a) => ({
          _id:                  String(a._id),
          academicyear:         a.academicyear         || "",
          formid:               a.formid               || "",
          name:                 a.name                 || "",
          email:                a.email                || "",
          phone:                a.phone                || "",
          regno:                a.regno                || "",
          gender:               a.gender               || "",
          category:             a.category             || "",
          programapplied:       a.programapplied       || "",
          programcode:          a.programcode          || "",
          applicationstatus:    a.applicationstatus    || "",
          validationstatus:     a.validationstatus     || "",
          paymentstatus:        a.paymentstatus        || "",
          paidamount:           safeNum(a.paidamount),
          provisionalpaymentstatus: a.provisionalpaymentstatus || "",
          provisionalpaidamount:    safeNum(a.provisionalpaidamount),
          marks_10:             safeNum(a.marks_10),
          marks_12:             safeNum(a.marks_12),
          marks_UG:             safeNum(a.marks_UG),
          dateofbirth:          a.dateofbirth          || "",
          dateofapplication:    a.dateofapplication    || "",
          state_form:           a.state_form           || "",
          district_form:        a.district_form        || "",
          extraFields:          a.extraFields          || {},
          documentCount:        Array.isArray(a.documents) ? a.documents.length : 0,
          createdAt:            a.createdAt ? new Date(a.createdAt).toISOString().slice(0, 10) : "",
          updatedAt:            a.updatedAt ? new Date(a.updatedAt).toISOString().slice(0, 10) : ""
        }))
      });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 3. get_general_admission_options
  //    Mirrors getGeneralAdmissionOptions — academic years, regulations, programs
  //    for the "General Admit" / bulk admit panel.
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "get_general_admission_options",
    "Get academic years, regulations, and programs available for the general admission " +
    "(bulk admit) process. Optionally scope regulations and programs by academicyear and regulation.",
    {
      colid:        z.number().optional().describe("College ID (from session)"),
      academicyear: z.string().optional().describe("Filter regulations and programs by academic year"),
      regulation:   z.string().optional().describe("Filter programs by regulation")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);

      // Academic years from 3 sources
      const [appYears, subjYears, progYears] = await Promise.all([
        AdmApp.distinct("academicyear",         { colid }),
        RegSubj.distinct("academicyear",        { colid }),
        MProgAdm.distinct("year",               { colid })
      ]);
      const academicyears = [...new Set([...appYears, ...subjYears, ...progYears].map(cleanStr).filter(Boolean))].sort();

      // Regulations — prefer from regulation subjects for the given year
      let regVals = params.academicyear
        ? await RegSubj.distinct("regulation", { colid, academicyear: params.academicyear })
        : [];
      if (!regVals.length) {
        const masters = await RegMaster.find({ colid, isactive: /^Yes$/i }).select("regulation").lean();
        regVals = masters.map((m) => m.regulation);
      }
      const regulations = [...new Set(regVals.map(cleanStr).filter(Boolean))].sort();

      // Programs — prefer from regulation subjects
      const subjQ = { colid };
      if (params.academicyear) subjQ.academicyear = params.academicyear;
      if (params.regulation)   subjQ.regulation   = params.regulation;
      const subjProgs = await RegSubj.find(subjQ).select("program programcode").lean();
      const programMap = new Map();
      subjProgs.forEach((p) => {
        const pc = cleanStr(p.programcode), pr = cleanStr(p.program);
        if (pc || pr) programMap.set(pc || pr, { program: pr, programcode: pc });
      });
      if (!programMap.size) {
        const progQ = { colid };
        if (params.academicyear) progQ.year = params.academicyear;
        const progs = await MProgAdm.find(progQ).sort({ Order: 1, program: 1 }).lean();
        progs.forEach((p) => {
          const pc = cleanStr(p.programcode), pr = cleanStr(p.program || p.name);
          if (pc || pr) programMap.set(pc || pr, { program: pr, programcode: pc });
        });
      }
      const programs = [...programMap.values()].sort((a, b) =>
        `${a.program} ${a.programcode}`.localeCompare(`${b.program} ${b.programcode}`)
      );

      return text({ success: true, academicyears, regulations, programs });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 4. update_admission_application_status
  //    Mirrors bulkUpdateApplicationStatus — change status for selected apps.
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "update_admission_application_status",
    "Change the applicationstatus of selected admission applications. " +
    "fromStatus and to_status must both be one of: Draft, Applied, Admitted — and different. " +
    "Only applications currently at fromStatus are updated. " +
    "Get application _id values from search_admission_applications.",
    {
      colid:       z.number().optional().describe("College ID (from session)"),
      ids:         z.array(z.string()).min(1).max(500)
        .describe("Application _id values to update"),
      fromStatus:  z.enum(["Draft", "Applied", "Admitted"])
        .describe("Current status — only applications at this status are updated"),
      to_status:   z.enum(["Draft", "Applied", "Admitted"])
        .describe("New status to set")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);

      if (params.fromStatus === params.to_status) {
        return text({ success: false, error: "fromStatus and to_status must be different" });
      }

      const result = await AdmApp.updateMany(
        { colid, _id: { $in: params.ids }, applicationstatus: params.fromStatus },
        { $set: { applicationstatus: params.to_status } }
      );

      return text({
        success:      true,
        message:      `Status changed from '${params.fromStatus}' to '${params.to_status}'`,
        matched:      result.matchedCount  || 0,
        modified:     result.modifiedCount || 0,
        fromStatus:   params.fromStatus,
        to_status:    params.to_status
      });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 5. admit_applications_to_students  ⚠️ WRITE
  //    Mirrors generalAdmissionBulkAdmit — converts applicants to User accounts.
  //    For each application:
  //      • Generates regno = <academicyear>-<programcode>-<seq> (zero-padded)
  //      • Creates a User record (role=Student)
  //      • Updates application status → Admitted
  //    contactOverrides lets you fix email/phone per applicant before creating.
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "admit_applications_to_students",
    "⚠️ WRITE — Bulk admit applicants by converting them to Student user accounts. " +
    "For each selected application: generates a regno, creates a User record (role=Student), " +
    "and sets applicationstatus to 'Admitted'. " +
    "Skips applications not at 'Applied' status and emails already in Users. " +
    "Get application _ids from search_admission_applications. " +
    "Get valid field values from get_general_admission_options.",
    {
      colid:        z.number().optional().describe("College ID (from session)"),
      applicationIds: z.array(z.string()).min(1).max(200)
        .describe("Application _id values to admit (max 200)"),
      academicyear: z.string().min(1).describe("Academic year for admitted students e.g. 2025-26"),
      regulation:   z.string().min(1).describe("Regulation e.g. R2021"),
      program:      z.string().min(1).describe("Program name e.g. Bachelor of Technology"),
      programcode:  z.string().min(1).describe("Program code e.g. BTECH-CSE"),
      semester:     z.string().min(1).describe("Starting semester e.g. 1"),
      section:      z.string().min(1).describe("Section e.g. A"),
      institution:  z.string().optional().describe("Institution name (stored on User record)"),
      contactOverrides: z.record(
        z.string(),
        z.object({
          email: z.string().email().optional(),
          phone: z.string().optional()
        })
      ).optional().describe(
        "Override email/phone per application: { '<applicationId>': { email, phone } }. " +
        "Use when application has missing or incorrect contact info."
      )
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid   = resolveColid(params.colid);
      const user    = resolveUser();
      const overrides = params.contactOverrides || {};

      const applications = await AdmApp.find({ colid, _id: { $in: params.applicationIds } }).lean();
      const appMap = new Map(applications.map((a) => [String(a._id), a]));

      const created = [];
      const errors  = [];

      // Sequential rollno starting after existing students in this program/year
      let seq = await UserAdm.countDocuments({
        colid, role: /^Student$/i,
        academicyear: params.academicyear,
        programcode:  params.programcode
      });

      for (const appId of params.applicationIds) {
        const app = appMap.get(String(appId));
        if (!app) { errors.push({ applicationId: appId, msg: "Application not found" }); continue; }
        if (app.applicationstatus && !/^Applied$/i.test(app.applicationstatus)) {
          errors.push({ applicationId: appId, name: app.name, msg: `Status is '${app.applicationstatus}', expected 'Applied'` });
          continue;
        }

        const over  = overrides[String(appId)] || {};
        const email = cleanStr(over.email || app.email).toLowerCase();
        const phone = cleanStr(over.phone || app.phone);
        if (!email || !phone) {
          errors.push({ applicationId: appId, name: app.name, msg: "Email and phone are required" });
          continue;
        }

        const duplicate = await UserAdm.findOne({ email }).select("_id").lean();
        if (duplicate) {
          errors.push({ applicationId: appId, name: app.name, email, msg: "User already exists with this email" });
          continue;
        }

        seq += 1;
        const rollno   = String(seq).padStart(4, "0");
        const regno    = `${params.academicyear}-${params.programcode}-${rollno}`;
        const password = randPass();

        const userPayload = {
          name:          cleanStr(app.name) || email,
          email, phone, password,
          role:          "Student",
          regno,
          program:       params.program,
          programcode:   params.programcode,
          admissionyear: params.academicyear,
          academicyear:  params.academicyear,
          rollno,
          semester:      params.semester,
          section:       params.section,
          gender:        cleanStr(app.gender)                                               || "NA",
          state:         cleanStr(app.state       || app.extraFields?.state)                || "NA",
          city:          cleanStr(app.city        || app.extraFields?.city)                 || "NA",
          district:      cleanStr(app.district    || app.extraFields?.district)             || "NA",
          pincode:       cleanStr(app.pincode     || app.pin || app.extraFields?.pincode)   || "NA",
          department:    params.program,
          category:      cleanStr(app.category)                                             || "NA",
          address:       cleanStr(app.address)                                              || "NA",
          guardianname:  cleanStr(app.guardianname   || app.extraFields?.guardianname)      || "NA",
          guardianmobile:cleanStr(app.guardianmobile || app.extraFields?.guardianmobile)    || "NA",
          guardianemail: cleanStr(app.guardianemail  || app.extraFields?.guardianemail)     || "NA",
          fathername:    cleanStr(app.fathername     || app.extraFields?.fathername)        || "NA",
          mothername:    cleanStr(app.mothername     || app.extraFields?.mothername)        || "NA",
          dob:           cleanStr(app.dateofbirth    || app.dob || app.extraFields?.dob)    || "NA",
          colid,
          status:        1,
          user:          email,
          addedby:       cleanStr(user),
          institution:   cleanStr(params.institution),
          regulation:    params.regulation,
          Major:         cleanStr(app.Major || app.major || app.extraFields?.Major || app.extraFields?.major)   || "NA",
          Minor:         cleanStr(app.Minor || app.minor || app.extraFields?.Minor || app.extraFields?.minor)   || "NA",
          AEC:           cleanStr(app.AEC   || app.aec   || app.extraFields?.AEC   || app.extraFields?.aec)     || "NA",
          SEC:           cleanStr(app.SEC   || app.sec   || app.extraFields?.SEC   || app.extraFields?.sec)     || "NA",
          VAC:           cleanStr(app.VAC   || app.vac   || app.extraFields?.VAC   || app.extraFields?.vac)     || "NA",
          IDC:           cleanStr(app.IDC   || app.idc   || app.extraFields?.IDC   || app.extraFields?.idc)     || "NA",
          isdisabled:    "No",
          admissionapplicationid: String(app._id),
          lastlogin:     new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        };

        try {
          const newUser = await UserAdm.create(userPayload);
          await AdmApp.updateOne(
            { _id: app._id, colid },
            { $set: { applicationstatus: "Admitted", regno, email, phone, username: email, password } }
          );
          created.push({
            applicationId: String(app._id),
            userId: String(newUser._id),
            name: newUser.name,
            email, phone, rollno, regno, password
          });
        } catch (err) {
          seq -= 1;
          errors.push({ applicationId: appId, name: app.name, email, msg: err.message });
        }
      }

      return text({
        success:       true,
        admitted:      created.length,
        errorCount:    errors.length,
        message:       `Admitted ${created.length} applicant(s)`,
        created,
        errors
      });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 6. send_admission_email  ⚠️ WRITE
  //    Mirrors sendEmail — email selected applicants via institution Gmail config.
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "send_admission_email",
    "⚠️ WRITE — Send an email to selected admission applicants using the institution's " +
    "Gmail SMTP configuration. Optionally include login credentials in the email body. " +
    "Requires a default active Gmail configuration in the email settings. " +
    "Get application _ids from search_admission_applications.",
    {
      colid:               z.number().optional().describe("College ID (from session)"),
      ids:                 z.array(z.string()).min(1).max(500)
        .describe("Application _id values to email"),
      subject:             z.string().min(1).describe("Email subject line"),
      message:             z.string().min(1).describe("Email body text (plain text, newlines preserved)"),
      include_credentials: z.boolean().optional().default(false)
        .describe("If true, appends username and password to the email body"),
      institution:         z.string().optional().describe("Institution name shown as sender display name")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);

      const applications = await AdmApp.find({ colid, _id: { $in: params.ids } })
        .select("name email username password")
        .lean();
      const recipients = applications.filter((a) => /\S+@\S+\.\S+/.test(a.email || ""));
      if (!recipients.length) {
        return text({ success: false, error: "No selected application has a valid email address" });
      }

      // Load default active Gmail config
      const baseQ = { colid, provider: /^gmail$/i, isactive: /^Yes$/i };
      const cfg = await EmailCfg.findOne({ ...baseQ, default: /^Yes$/i }).sort({ updatedAt: -1 }).lean()
        || await EmailCfg.findOne(baseQ).sort({ updatedAt: -1 }).lean();

      if (!cfg?.username || !cfg?.password || !getSmtpHost(cfg)) {
        return text({ success: false, error: "Default active Gmail configuration is missing or incomplete. Configure it in email settings." });
      }

      const port   = Number(cfg.port) || (/gmail/i.test(cfg.provider || "") ? 465 : 587);
      const secure = ["yes","true"].includes(String(cfg.secure || "").toLowerCase()) || port === 465;
      const transporter = nodemailer.createTransport({
        host: getSmtpHost(cfg), port, secure,
        auth: { user: cfg.username, pass: cfg.password }
      });

      const institution = cleanStr(params.institution) || "Institution";
      const errors = [];
      let sent = 0;

      for (const recipient of recipients) {
        const credText = params.include_credentials
          ? `\n\nUsername: ${cleanStr(recipient.username || recipient.email)}\nPassword: ${cleanStr(recipient.password)}`
          : "";
        const body = `${params.message}${credText}`;
        const html = body.split("\n").map((l) => `<p>${safeHtml(l) || "&nbsp;"}</p>`).join("");
        try {
          await transporter.sendMail({
            from:    `"${institution}" <${cfg.username}>`,
            to:      recipient.email,
            subject: params.subject,
            text:    body,
            html:    `<div>${html}</div>`
          });
          sent += 1;
        } catch (err) {
          errors.push({ email: recipient.email, name: recipient.name, msg: err.message });
        }
      }

      return text({
        success:      true,
        sent,
        failed:       errors.length,
        message:      `Email sent to ${sent} recipient(s)`,
        errors
      });
    }
  );
}
