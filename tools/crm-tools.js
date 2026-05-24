/**
 * CRM management tools — shared between index.js (stdio) and server.js (HTTP)
 *
 * Models   : crmh1, PipelineStageag, sourceds, Users (for assignment lookup)
 * No delete tool for leads (by design).
 *
 * Tools registered (24 total):
 *   Sources     : list_sources, add_source, update_source
 *   Pipeline    : list_pipeline_stages, add_pipeline_stage, update_pipeline_stage
 *   Leads       : search_leads, get_lead, add_lead, update_lead,
 *                 update_lead_stage, update_lead_followup, update_lead_assignee,
 *                 bulk_upload_leads_from_excel, bulk_upload_leads_from_json,
 *                 get_excel_template_leads
 *   Users       : list_users_for_crm
 *   Reports     : report_lead_analytics, report_followups_today,
 *                 report_followups_overdue, report_stage_funnel,
 *                 report_leads_by_counsellor, report_leads_by_source,
 *                 report_hot_leads
 *
 * Usage:
 *   registerCrmTools(server, { requireAuth, resolveColid, resolveUser, connectDB })
 */

import { z } from "zod";
import mongoose from "mongoose";
import * as XLSX from "xlsx";
import * as fs from "fs";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const crmh1Schema = new mongoose.Schema({
  name:            { type: String, required: true },
  user:            { type: String, required: true },
  colid:           { type: Number, required: true },
  phone:           { type: String },
  email:           { type: String },
  address:         { type: String },
  city:            { type: String },
  state:           { type: String },
  country:         { type: String },
  pin:             { type: String },
  qualification:   { type: String },
  passout_year:    { type: String },
  category:        { type: String, required: true },
  course_interested:       { type: String },
  preferred_mode:          { type: String },
  expected_admission_year: { type: String },
  institution:     { type: String },
  program_type:    { type: String },
  program:         { type: String },
  scores_10th:     { type: String },
  scores_12th:     { type: String },
  budget:          { type: String },
  scholarship_interest: { type: String },
  source:          { type: String, required: true },
  form_url:        { type: String },
  source_campaign_id: { type: String },
  utm_source:      { type: String },
  utm_medium:      { type: String },
  utm_campaign:    { type: String },
  landing_page_url: { type: String },
  sourceemp:       { type: String },
  lead_score:      { type: Number, default: 0 },
  lead_temperature: { type: String, default: "Cold" },
  assignedto:      { type: String, required: true },
  assigned_date:   { type: Date, default: Date.now },
  reassignment_count: { type: Number, default: 0 },
  pipeline_stage:  { type: String, default: "New Lead" },
  leadstatus:      { type: String, default: "Active" },
  lost_reason:     { type: String },
  leadtype:        { type: String },
  last_contact_date:       { type: Date },
  followupdate:            { type: Date },
  next_followup_date:      { type: Date },
  fcomments:               { type: String },
  campus_visit_date:       { type: Date },
  campus_visit_completed:  { type: String, default: "No" },
  counselling_session_booked: { type: String, default: "No" },
  application_form_sent:       { type: String, default: "No" },
  application_form_sent_date:  { type: Date },
  application_submitted:       { type: String, default: "No" },
  application_submitted_date:  { type: Date },
  brochure_downloaded:     { type: String, default: "No" },
  fee_details_requested:   { type: String, default: "No" },
  lead:        { type: String },
  company:     { type: String },
  designation: { type: String },
  year:        { type: String },
  product:     { type: String },
  amount:      { type: Number },
  status1:     { type: String },
  comments:    { type: String }
}, { timestamps: true });

const pipelineStageSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  user:           { type: String, required: true },
  colid:          { type: Number, required: true },
  stagename:      { type: String },
  description:    { type: String },
  isactive:       { type: Boolean, default: true },
  is_final_stage: { type: Boolean, default: false }
}, { timestamps: true });

const sourcedsSchema = new mongoose.Schema({
  colid:       { type: Number, required: true },
  source_name: { type: String, required: true },
  source_type: { type: String, enum: ["Organic","Paid","Referral","Direct","Social Media","Other"], default: "Other" },
  description: { type: String },
  is_active:   { type: String, enum: ["Yes","No"], default: "Yes" },
  created_by:  { type: String }
}, { timestamps: true });

const userLookupSchema = new mongoose.Schema({
  email: { type: String },
  name:  { type: String },
  phone: { type: String },
  role:  { type: String },
  colid: { type: Number },
  status: { type: Number }
});

export const CrmLead   = mongoose.models.crmh1         || mongoose.model("crmh1",         crmh1Schema);
export const PipelineStage = mongoose.models.PipelineStageag || mongoose.model("PipelineStageag", pipelineStageSchema);
export const SourceDs  = mongoose.models.sourceds       || mongoose.model("sourceds",       sourcedsSchema);
export const UserCrm   = mongoose.models.Users          || mongoose.model("Users",          userLookupSchema);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const clean = (v) => String(v ?? "").trim();
const toNum = (v) => { const n = Number(v); return Number.isNaN(n) ? 0 : n; };

function calculateLeadScore(lead) {
  let score = 0;
  if (lead.phone)                            score += 5;
  if (lead.email)                            score += 5;
  if (lead.course_interested)                score += 10;
  if (lead.brochure_downloaded === "Yes")    score += 10;
  if (lead.fee_details_requested === "Yes")  score += 5;
  if (lead.counselling_session_booked === "Yes") score += 20;
  if (lead.scholarship_interest === "Yes")   score += 10;
  if (lead.campus_visit_completed === "Yes") score += 15;
  return score;
}

function getLeadTemperature(score) {
  if (score >= 40) return "Hot";
  if (score >= 20) return "Warm";
  return "Cold";
}

/** Auto-update related fields when pipeline stage changes (mirrors backend) */
function stageAutoFields(stage) {
  const f = {};
  switch (stage) {
    case "Counselling Scheduled":
      f.counselling_session_booked = "Yes";
      break;
    case "Campus Visited":
      f.campus_visit_completed = "Yes";
      f.counselling_session_booked = "Yes";
      break;
    case "Application Sent":
    case "Application Submitted":
    case "Fee Paid":
    case "Admitted":
      f.campus_visit_completed = "Yes";
      f.counselling_session_booked = "Yes";
      f.brochure_downloaded = "Yes";
      f.fee_details_requested = "Yes";
      break;
  }
  return f;
}

function serializeLead(d) {
  const doc = d.toObject ? d.toObject() : d;
  return {
    id:          String(doc._id),
    name:        doc.name,
    phone:       doc.phone,
    email:       doc.email,
    city:        doc.city,
    state:       doc.state,
    category:    doc.category,
    course_interested: doc.course_interested,
    qualification:     doc.qualification,
    program:     doc.program,
    source:      doc.source,
    sourceemp:   doc.sourceemp,
    pipeline_stage:   doc.pipeline_stage,
    leadstatus:       doc.leadstatus,
    lead_score:       doc.lead_score,
    lead_temperature: doc.lead_temperature,
    assignedto:  doc.assignedto,
    assigned_date: doc.assigned_date,
    followupdate:       doc.followupdate,
    next_followup_date: doc.next_followup_date,
    fcomments:   doc.fcomments,
    lost_reason: doc.lost_reason,
    campus_visit_completed: doc.campus_visit_completed,
    counselling_session_booked: doc.counselling_session_booked,
    application_submitted: doc.application_submitted,
    comments:    doc.comments,
    year:        doc.year,
    colid:       doc.colid,
    user:        doc.user,
    createdAt:   doc.createdAt,
    updatedAt:   doc.updatedAt
  };
}

// ─── Excel alias map for leads ─────────────────────────────────────────────────
const normalizeKey = (k) => String(k || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const leadAliasMap = {
  name:            ["name", "fullname", "leadname"],
  phone:           ["phone", "mobile", "phonenumber", "mobilenumber", "contact"],
  email:           ["email", "emailid", "emailaddress"],
  address:         ["address"],
  city:            ["city"],
  state:           ["state"],
  country:         ["country"],
  pin:             ["pin", "pincode", "zipcode"],
  qualification:   ["qualification", "qual"],
  passout_year:    ["passoutyear", "passout", "passingyear"],
  category:        ["category", "dept", "department"],
  course_interested: ["courseinterested", "course", "interestedcourse"],
  preferred_mode:  ["preferredmode", "mode"],
  expected_admission_year: ["expectedadmissionyear", "admissionyear", "joiningYear"],
  program_type:    ["programtype", "type"],
  program:         ["program", "programme"],
  scores_10th:     ["scores10th", "10th", "tenthscore", "10thmarks"],
  scores_12th:     ["scores12th", "12th", "twelthscore", "12thmarks"],
  budget:          ["budget", "feebudget"],
  scholarship_interest: ["scholarshipinterest", "scholarship"],
  source:          ["source", "leadsource"],
  sourceemp:       ["sourceemp", "sourceemployee", "referredby"],
  utm_source:      ["utmsource"],
  utm_medium:      ["utmmedium"],
  utm_campaign:    ["utmcampaign"],
  assignedto:      ["assignedto", "assigned", "counsellor", "counselor"],
  pipeline_stage:  ["pipelinestage", "stage"],
  leadstatus:      ["leadstatus", "status"],
  leadtype:        ["leadtype", "type"],
  followupdate:    ["followupdate", "followup"],
  next_followup_date: ["nextfollowupdate", "nextfollowup"],
  fcomments:       ["fcomments", "followupcomments"],
  comments:        ["comments", "remarks", "notes"],
  company:         ["company"],
  designation:     ["designation"],
  budget2:         ["amount"],
  status1:         ["status1"],
  year:            ["year", "academicyear", "acadyear", "enquiryyear"]
};

function valueFromRow(row, field) {
  const normalized = {};
  for (const [k, v] of Object.entries(row)) normalized[normalizeKey(k)] = v;
  const keys = leadAliasMap[field] || [field.toLowerCase()];
  for (const key of keys) if (normalized[key] !== undefined) return normalized[key];
  return "";
}

function excelRowToLeadBody(row) {
  const body = {};
  for (const field of Object.keys(leadAliasMap)) body[field] = valueFromRow(row, field);
  return body;
}

function leadPayload(body = {}, colid, user) {
  const payload = {
    name:            clean(body.name),
    user:            clean(body.user || user),
    colid:           toNum(body.colid || colid),
    phone:           clean(body.phone),
    email:           clean(body.email),
    address:         clean(body.address),
    city:            clean(body.city),
    state:           clean(body.state),
    country:         clean(body.country),
    pin:             clean(body.pin),
    qualification:   clean(body.qualification),
    passout_year:    clean(body.passout_year),
    category:        clean(body.category),
    course_interested: clean(body.course_interested),
    preferred_mode:  clean(body.preferred_mode),
    expected_admission_year: clean(body.expected_admission_year),
    institution:     clean(body.institution),
    program_type:    clean(body.program_type),
    program:         clean(body.program),
    scores_10th:     clean(body.scores_10th),
    scores_12th:     clean(body.scores_12th),
    budget:          clean(body.budget),
    scholarship_interest: clean(body.scholarship_interest),
    source:          clean(body.source),
    sourceemp:       clean(body.sourceemp),
    utm_source:      clean(body.utm_source),
    utm_medium:      clean(body.utm_medium),
    utm_campaign:    clean(body.utm_campaign),
    assignedto:      clean(body.assignedto || user),
    pipeline_stage:  clean(body.pipeline_stage) || "New Lead",
    leadstatus:      clean(body.leadstatus)  || "Active",
    leadtype:        clean(body.leadtype),
    fcomments:       clean(body.fcomments),
    comments:        clean(body.comments),
    company:         clean(body.company),
    designation:     clean(body.designation),
    status1:         clean(body.status1),
    year:            clean(body.year)
  };
  if (body.followupdate)      payload.followupdate      = new Date(body.followupdate);
  if (body.next_followup_date) payload.next_followup_date = new Date(body.next_followup_date);
  const score = calculateLeadScore(payload);
  payload.lead_score       = score;
  payload.lead_temperature = getLeadTemperature(score);
  return payload;
}

// ─── Tool registrar ───────────────────────────────────────────────────────────
/**
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server
 * @param {{ requireAuth, resolveColid, resolveUser, connectDB }} helpers
 */
export function registerCrmTools(server, { requireAuth, resolveColid, resolveUser, connectDB }) {
  const text = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });

  // ════════════════════════════════════════════════════════════════════════════
  // SOURCE TOOLS
  // ════════════════════════════════════════════════════════════════════════════

  // ── list_sources ────────────────────────────────────────────────────────────
  server.tool(
    "list_sources",
    "List all lead sources configured for your college. Login required. Optionally include inactive sources.",
    {
      include_inactive: z.boolean().optional().default(false).describe("Set true to also return inactive sources")
    },
    async ({ include_inactive }) => {
      requireAuth();
      await connectDB();
      const colid  = resolveColid(undefined);
      const filter = include_inactive ? { colid } : { colid, is_active: "Yes" };
      const data   = await SourceDs.find(filter).sort({ source_name: 1 }).lean();
      return text({ success: true, total: data.length, colid, sources: data.map(d => ({
        id: String(d._id), source_name: d.source_name, source_type: d.source_type,
        description: d.description, is_active: d.is_active, created_by: d.created_by
      })) });
    }
  );

  // ── add_source ──────────────────────────────────────────────────────────────
  server.tool(
    "add_source",
    "Add a new lead source (e.g. Facebook, Google Ads, Website). colid and created_by taken from session.",
    {
      source_name: z.string().min(1).describe("Source name e.g. Facebook, Google Ads, Website"),
      source_type: z.enum(["Organic","Paid","Referral","Direct","Social Media","Other"]).optional().default("Other"),
      description: z.string().optional().default("").describe("Optional description"),
      is_active:   z.enum(["Yes","No"]).optional().default("Yes")
    },
    async ({ source_name, source_type, description, is_active }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const user  = resolveUser(undefined);
      try {
        const doc = await SourceDs.create({ colid, source_name, source_type, description, is_active, created_by: user });
        return text({ success: true, message: "Source added", source: { id: String(doc._id), source_name: doc.source_name, source_type: doc.source_type, is_active: doc.is_active } });
      } catch (err) {
        return text({ error: err.message });
      }
    }
  );

  // ── update_source ────────────────────────────────────────────────────────────
  server.tool(
    "update_source",
    "Update a lead source by its MongoDB _id. Get the id from list_sources.",
    {
      id:          z.string().describe("Source _id from list_sources"),
      source_name: z.string().optional().describe("New source name"),
      source_type: z.enum(["Organic","Paid","Referral","Direct","Social Media","Other"]).optional(),
      description: z.string().optional(),
      is_active:   z.enum(["Yes","No"]).optional()
    },
    async ({ id, source_name, source_type, description, is_active }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const update = {};
      if (source_name !== undefined) update.source_name = source_name;
      if (source_type !== undefined) update.source_type = source_type;
      if (description !== undefined) update.description = description;
      if (is_active   !== undefined) update.is_active   = is_active;
      try {
        const doc = await SourceDs.findOneAndUpdate({ _id: id, colid }, update, { new: true });
        if (!doc) return text({ error: "Source not found or does not belong to your college" });
        return text({ success: true, message: "Source updated", source: { id: String(doc._id), source_name: doc.source_name, source_type: doc.source_type, is_active: doc.is_active } });
      } catch (err) {
        return text({ error: err.message });
      }
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // PIPELINE STAGE TOOLS
  // ════════════════════════════════════════════════════════════════════════════

  // ── list_pipeline_stages ────────────────────────────────────────────────────
  server.tool(
    "list_pipeline_stages",
    "List all CRM pipeline stages for your college. Login required. Optionally include inactive stages.",
    {
      include_inactive: z.boolean().optional().default(false).describe("Include inactive stages if true")
    },
    async ({ include_inactive }) => {
      requireAuth();
      await connectDB();
      const colid  = resolveColid(undefined);
      const filter = include_inactive ? { colid } : { colid, isactive: true };
      const data   = await PipelineStage.find(filter).sort({ createdAt: 1 }).lean();
      return text({ success: true, total: data.length, colid, stages: data.map(d => ({
        id: String(d._id), stagename: d.stagename || d.name,
        description: d.description, isactive: d.isactive, is_final_stage: d.is_final_stage
      })) });
    }
  );

  // ── add_pipeline_stage ──────────────────────────────────────────────────────
  server.tool(
    "add_pipeline_stage",
    "Add a new CRM pipeline stage for your college.",
    {
      stagename:      z.string().min(1).describe("Stage name e.g. 'Qualified', 'Seat Booked'"),
      description:    z.string().optional().default("").describe("Stage description"),
      is_final_stage: z.boolean().optional().default(false).describe("Mark as final/terminal stage"),
      isactive:       z.boolean().optional().default(true)
    },
    async ({ stagename, description, is_final_stage, isactive }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const user  = resolveUser(undefined);
      try {
        const doc = await PipelineStage.create({ name: stagename, stagename, colid, user, description, is_final_stage, isactive });
        return text({ success: true, message: "Pipeline stage added", stage: { id: String(doc._id), stagename: doc.stagename, isactive: doc.isactive, is_final_stage: doc.is_final_stage } });
      } catch (err) {
        return text({ error: err.message });
      }
    }
  );

  // ── update_pipeline_stage ───────────────────────────────────────────────────
  server.tool(
    "update_pipeline_stage",
    "Update a pipeline stage by its MongoDB _id. Get the id from list_pipeline_stages.",
    {
      id:             z.string().describe("Stage _id from list_pipeline_stages"),
      stagename:      z.string().optional().describe("New stage name"),
      description:    z.string().optional(),
      is_final_stage: z.boolean().optional(),
      isactive:       z.boolean().optional()
    },
    async ({ id, stagename, description, is_final_stage, isactive }) => {
      requireAuth();
      await connectDB();
      const colid  = resolveColid(undefined);
      const update = {};
      if (stagename      !== undefined) { update.stagename = stagename; update.name = stagename; }
      if (description    !== undefined) update.description    = description;
      if (is_final_stage !== undefined) update.is_final_stage = is_final_stage;
      if (isactive       !== undefined) update.isactive       = isactive;
      try {
        const doc = await PipelineStage.findOneAndUpdate({ _id: id, colid }, update, { new: true });
        if (!doc) return text({ error: "Stage not found or does not belong to your college" });
        return text({ success: true, message: "Stage updated", stage: { id: String(doc._id), stagename: doc.stagename, isactive: doc.isactive, is_final_stage: doc.is_final_stage } });
      } catch (err) {
        return text({ error: err.message });
      }
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // LEAD TOOLS
  // ════════════════════════════════════════════════════════════════════════════

  // ── search_leads ────────────────────────────────────────────────────────────
  server.tool(
    "search_leads",
    "Search and filter CRM leads. Supports free-text search (name/phone/email) plus multiple filter dimensions. Returns up to 200 leads sorted by most recently updated.",
    {
      search:          z.string().optional().describe("Free-text search across name, phone, email, category"),
      year:            z.string().optional().describe("Academic year e.g. 2026-27, 2025-26"),
      pipeline_stage:  z.string().optional().describe("Filter by pipeline stage name"),
      lead_temperature: z.enum(["Hot","Warm","Cold"]).optional().describe("Filter by temperature"),
      leadstatus:      z.enum(["Active","Converted","Lost"]).optional().describe("Filter by lead status"),
      source:          z.string().optional().describe("Filter by source name"),
      category:        z.string().optional().describe("Filter by category/department"),
      assignedto:      z.string().optional().describe("Filter by assignee email"),
      city:            z.string().optional().describe("Filter by city"),
      state:           z.string().optional().describe("Filter by state"),
      from_date:       z.string().optional().describe("Created from date YYYY-MM-DD"),
      to_date:         z.string().optional().describe("Created to date YYYY-MM-DD"),
      limit:           z.number().int().optional().default(50).describe("Max results (1-200, default 50)")
    },
    async ({ search, year, pipeline_stage, lead_temperature, leadstatus, source, category, assignedto, city, state, from_date, to_date, limit }) => {
      requireAuth();
      await connectDB();
      const colid    = resolveColid(undefined);
      const maxLimit = Math.min(Math.max(limit || 50, 1), 200);

      let filter = { colid };

      if (search) {
        const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [{ name: re }, { phone: re }, { email: re }, { category: re }, { course_interested: re }];
      }
      if (year)            filter.year            = year;
      if (pipeline_stage)  filter.pipeline_stage  = pipeline_stage;
      if (lead_temperature) filter.lead_temperature = lead_temperature;
      if (leadstatus)      filter.leadstatus       = leadstatus;
      if (source)          filter.source           = new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (category)        filter.category         = new RegExp(category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (assignedto)      filter.assignedto       = assignedto;
      if (city)            filter.city             = new RegExp(city, "i");
      if (state)           filter.state            = new RegExp(state, "i");
      if (from_date || to_date) {
        filter.createdAt = {};
        if (from_date) filter.createdAt.$gte = new Date(from_date);
        if (to_date)   filter.createdAt.$lte = new Date(to_date + "T23:59:59.999Z");
      }

      const data = await CrmLead.find(filter).sort({ updatedAt: -1 }).limit(maxLimit).lean();
      return text({ success: true, total: data.length, colid, leads: data.map(serializeLead) });
    }
  );

  // ── get_lead ─────────────────────────────────────────────────────────────────
  server.tool(
    "get_lead",
    "Get full details of a single CRM lead by its MongoDB _id. Get the id from search_leads.",
    {
      id: z.string().describe("Lead _id from search_leads")
    },
    async ({ id }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      try {
        const lead = await CrmLead.findOne({ _id: id, colid }).lean();
        if (!lead) return text({ error: "Lead not found or does not belong to your college" });
        const fullLead = lead.toObject ? lead.toObject() : lead;
        return text({ success: true, lead: { ...serializeLead(fullLead),
          address: fullLead.address, pin: fullLead.pin, country: fullLead.country,
          qualification: fullLead.qualification, passout_year: fullLead.passout_year,
          preferred_mode: fullLead.preferred_mode, expected_admission_year: fullLead.expected_admission_year,
          program_type: fullLead.program_type, scores_10th: fullLead.scores_10th, scores_12th: fullLead.scores_12th,
          budget: fullLead.budget, utm_source: fullLead.utm_source, utm_medium: fullLead.utm_medium,
          utm_campaign: fullLead.utm_campaign, form_url: fullLead.form_url,
          campus_visit_date: fullLead.campus_visit_date, application_form_sent: fullLead.application_form_sent,
          application_submitted: fullLead.application_submitted, brochure_downloaded: fullLead.brochure_downloaded,
          fee_details_requested: fullLead.fee_details_requested, reassignment_count: fullLead.reassignment_count,
          leadtype: fullLead.leadtype, lost_reason: fullLead.lost_reason, institution: fullLead.institution
        }});
      } catch (err) {
        return text({ error: err.message });
      }
    }
  );

  // ── add_lead ─────────────────────────────────────────────────────────────────
  server.tool(
    "add_lead",
    "Add a new CRM lead. Required: name, category, source, assignedto. colid and user taken from session.",
    {
      name:            z.string().min(1).describe("Lead name"),
      category:        z.string().min(1).describe("Category e.g. Engineering, Nursing, Law"),
      source:          z.string().min(1).describe("Lead source e.g. Facebook, Website"),
      assignedto:      z.string().email().describe("Counsellor email to assign this lead to"),
      year:            z.string().optional().default("").describe("Academic year e.g. 2026-27, 2025-26"),
      phone:           z.string().optional().default("").describe("Phone number"),
      email:           z.string().optional().default("").describe("Email address"),
      city:            z.string().optional().default(""),
      state:           z.string().optional().default(""),
      address:         z.string().optional().default(""),
      qualification:   z.string().optional().default("").describe("12th pass / Graduate / Post Graduate"),
      passout_year:    z.string().optional().default(""),
      course_interested: z.string().optional().default("").describe("Specific course of interest"),
      program:         z.string().optional().default(""),
      program_type:    z.string().optional().default(""),
      expected_admission_year: z.string().optional().default(""),
      budget:          z.string().optional().default(""),
      scholarship_interest: z.enum(["Yes","No",""]).optional().default(""),
      pipeline_stage:  z.string().optional().default("New Lead"),
      leadstatus:      z.enum(["Active","Converted","Lost"]).optional().default("Active"),
      followupdate:    z.string().optional().default("").describe("Follow-up date YYYY-MM-DD"),
      next_followup_date: z.string().optional().default("").describe("Next follow-up date YYYY-MM-DD"),
      fcomments:       z.string().optional().default("").describe("Follow-up comments"),
      comments:        z.string().optional().default(""),
      sourceemp:       z.string().optional().default("").describe("Employee who brought the lead"),
      utm_source:      z.string().optional().default(""),
      utm_medium:      z.string().optional().default(""),
      utm_campaign:    z.string().optional().default("")
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid   = resolveColid(undefined);
      const user    = resolveUser(undefined);
      const payload = leadPayload(args, colid, user);
      if (!payload.name || !payload.category || !payload.source || !payload.assignedto) {
        return text({ error: "name, category, source, and assignedto are required" });
      }
      try {
        const doc = await CrmLead.create(payload);
        return text({ success: true, message: "Lead added", lead: serializeLead(doc) });
      } catch (err) {
        return text({ error: err.message });
      }
    }
  );

  // ── update_lead ──────────────────────────────────────────────────────────────
  server.tool(
    "update_lead",
    "Update any fields of an existing CRM lead by its _id. Only pass fields you want to change. Lead score is auto-recalculated.",
    {
      id:              z.string().describe("Lead _id from search_leads"),
      name:            z.string().optional(),
      year:            z.string().optional().describe("Academic year e.g. 2026-27, 2025-26"),
      phone:           z.string().optional(),
      email:           z.string().optional(),
      city:            z.string().optional(),
      state:           z.string().optional(),
      address:         z.string().optional(),
      category:        z.string().optional(),
      course_interested: z.string().optional(),
      qualification:   z.string().optional(),
      passout_year:    z.string().optional(),
      program:         z.string().optional(),
      program_type:    z.string().optional(),
      budget:          z.string().optional(),
      scholarship_interest: z.enum(["Yes","No"]).optional(),
      source:          z.string().optional(),
      sourceemp:       z.string().optional(),
      pipeline_stage:  z.string().optional(),
      leadstatus:      z.enum(["Active","Converted","Lost"]).optional(),
      lost_reason:     z.string().optional(),
      assignedto:      z.string().optional().describe("Reassign to this email"),
      followupdate:    z.string().optional().describe("YYYY-MM-DD"),
      next_followup_date: z.string().optional().describe("YYYY-MM-DD"),
      fcomments:       z.string().optional(),
      comments:        z.string().optional(),
      campus_visit_completed: z.enum(["Yes","No"]).optional(),
      counselling_session_booked: z.enum(["Yes","No"]).optional(),
      application_form_sent: z.enum(["Yes","No"]).optional(),
      application_submitted: z.enum(["Yes","No"]).optional(),
      brochure_downloaded: z.enum(["Yes","No"]).optional(),
      fee_details_requested: z.enum(["Yes","No"]).optional()
    },
    async ({ id, ...args }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      try {
        const existing = await CrmLead.findOne({ _id: id, colid });
        if (!existing) return text({ error: "Lead not found or does not belong to your college" });

        const update = {};
        const fields = ["name","year","phone","email","city","state","address","category","course_interested",
          "qualification","passout_year","program","program_type","budget","scholarship_interest",
          "source","sourceemp","pipeline_stage","leadstatus","lost_reason","assignedto",
          "fcomments","comments","campus_visit_completed","counselling_session_booked",
          "application_form_sent","application_submitted","brochure_downloaded","fee_details_requested"];
        for (const f of fields) {
          if (args[f] !== undefined) update[f] = args[f];
        }
        if (args.followupdate)       update.followupdate       = new Date(args.followupdate);
        if (args.next_followup_date) update.next_followup_date = new Date(args.next_followup_date);

        // Stage auto-fields
        if (update.pipeline_stage) Object.assign(update, stageAutoFields(update.pipeline_stage));

        // Recalculate score
        const merged  = { ...existing.toObject(), ...update };
        update.lead_score       = calculateLeadScore(merged);
        update.lead_temperature = getLeadTemperature(update.lead_score);

        const doc = await CrmLead.findByIdAndUpdate(id, update, { new: true, runValidators: true });
        return text({ success: true, message: "Lead updated", lead: serializeLead(doc) });
      } catch (err) {
        return text({ error: err.message });
      }
    }
  );

  // ── update_lead_stage ────────────────────────────────────────────────────────
  server.tool(
    "update_lead_stage",
    "Change the pipeline stage of a lead. Use list_pipeline_stages to see available stages. Score is auto-recalculated.",
    {
      id:             z.string().describe("Lead _id from search_leads"),
      pipeline_stage: z.string().min(1).describe("New pipeline stage name"),
      notes:          z.string().optional().default("").describe("Optional note about this stage change")
    },
    async ({ id, pipeline_stage, notes }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const user  = resolveUser(undefined);
      try {
        const existing = await CrmLead.findOne({ _id: id, colid });
        if (!existing) return text({ error: "Lead not found" });

        const autoFields = stageAutoFields(pipeline_stage);
        const merged     = { ...existing.toObject(), ...autoFields, pipeline_stage };
        const newScore   = calculateLeadScore(merged);
        const update     = { pipeline_stage, ...autoFields, lead_score: newScore, lead_temperature: getLeadTemperature(newScore) };
        const doc        = await CrmLead.findByIdAndUpdate(id, update, { new: true });
        return text({ success: true, message: `Stage changed to '${pipeline_stage}'`, previous_stage: existing.pipeline_stage, lead: serializeLead(doc) });
      } catch (err) {
        return text({ error: err.message });
      }
    }
  );

  // ── update_lead_followup ─────────────────────────────────────────────────────
  server.tool(
    "update_lead_followup",
    "Update the follow-up date and comments for a lead.",
    {
      id:                  z.string().describe("Lead _id from search_leads"),
      next_followup_date:  z.string().describe("Next follow-up date YYYY-MM-DD"),
      followupdate:        z.string().optional().describe("Last follow-up date YYYY-MM-DD (defaults to today)"),
      fcomments:           z.string().optional().default("").describe("Follow-up notes / comments")
    },
    async ({ id, next_followup_date, followupdate, fcomments }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      try {
        const update = {
          next_followup_date: new Date(next_followup_date),
          followupdate: followupdate ? new Date(followupdate) : new Date(),
          last_contact_date: new Date(),
          fcomments
        };
        const doc = await CrmLead.findOneAndUpdate({ _id: id, colid }, update, { new: true });
        if (!doc) return text({ error: "Lead not found or does not belong to your college" });
        return text({ success: true, message: "Follow-up updated", lead: { id: String(doc._id), name: doc.name, next_followup_date: doc.next_followup_date, followupdate: doc.followupdate, fcomments: doc.fcomments } });
      } catch (err) {
        return text({ error: err.message });
      }
    }
  );

  // ── update_lead_assignee ─────────────────────────────────────────────────────
  server.tool(
    "update_lead_assignee",
    "Reassign a lead to a different counsellor. Use list_users_for_crm to find valid user emails.",
    {
      id:             z.string().describe("Lead _id from search_leads"),
      assignedto:     z.string().email().describe("New assignee email — use list_users_for_crm to find valid emails"),
      reason:         z.string().optional().default("").describe("Reason for reassignment")
    },
    async ({ id, assignedto, reason }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const user  = resolveUser(undefined);
      try {
        const existing = await CrmLead.findOne({ _id: id, colid });
        if (!existing) return text({ error: "Lead not found" });

        const prevAssignee = existing.assignedto;
        const doc = await CrmLead.findByIdAndUpdate(id, {
          assignedto,
          assigned_date: new Date(),
          $inc: { reassignment_count: 1 }
        }, { new: true });
        return text({ success: true, message: `Lead reassigned from ${prevAssignee} to ${assignedto}`, reason, lead: serializeLead(doc) });
      } catch (err) {
        return text({ error: err.message });
      }
    }
  );

  // ── list_users_for_crm ───────────────────────────────────────────────────────
  server.tool(
    "list_users_for_crm",
    "Search users in your college for lead assignment. Returns name, email and role. Use the email as 'assignedto' value.",
    {
      search: z.string().optional().default("").describe("Search by name or email (leave blank to list all)"),
      role:   z.string().optional().describe("Filter by role e.g. Counsellor, Admin, CRM")
    },
    async ({ search, role }) => {
      requireAuth();
      await connectDB();
      const colid  = resolveColid(undefined);
      const filter = { colid, status: 1 };
      if (search) {
        const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [{ name: re }, { email: re }];
      }
      if (role) filter.role = new RegExp(role, "i");
      const users = await UserCrm.find(filter).select("name email role phone").limit(50).lean();
      return text({ success: true, total: users.length, users: users.map(u => ({ name: u.name, email: u.email, role: u.role, phone: u.phone })) });
    }
  );

  // ── bulk_upload_leads_from_json ──────────────────────────────────────────────
  server.tool(
    "bulk_upload_leads_from_json",
    "Bulk upload CRM leads by providing a JSON array. Each object must have name, category, source, assignedto. colid and user taken from session.",
    {
      leads: z.array(z.object({
        name:       z.string(),
        category:   z.string(),
        source:     z.string(),
        assignedto: z.string(),
        year:       z.string().optional(),
        phone:      z.string().optional(),
        email:      z.string().optional(),
        city:       z.string().optional(),
        state:      z.string().optional(),
        course_interested: z.string().optional(),
        qualification:     z.string().optional(),
        pipeline_stage:    z.string().optional(),
        leadstatus:        z.string().optional(),
        followupdate:      z.string().optional(),
        next_followup_date: z.string().optional(),
        fcomments:  z.string().optional(),
        comments:   z.string().optional()
      })).min(1).describe("Array of lead objects — each needs at least name, category, source, assignedto"),
      upsert: z.boolean().optional().default(false)
               .describe("false (default) = insert new. true = update existing if phone+colid matches")
    },
    async ({ leads, upsert }) => {
      requireAuth();
      await connectDB();
      const colid  = resolveColid(undefined);
      const user   = resolveUser(undefined);
      const errors = [];
      let inserted = 0, updated = 0;

      for (let i = 0; i < leads.length; i++) {
        const payload = leadPayload(leads[i], colid, user);
        if (!payload.name || !payload.category || !payload.source || !payload.assignedto) {
          errors.push({ row: i + 1, message: "name, category, source, and assignedto are required" });
          continue;
        }
        try {
          if (upsert && payload.phone) {
            const res = await CrmLead.updateOne(
              { colid, phone: payload.phone },
              { $set: payload },
              { upsert: true, runValidators: true }
            );
            res.upsertedCount > 0 ? inserted++ : updated++;
          } else {
            await CrmLead.create(payload);
            inserted++;
          }
        } catch (err) {
          errors.push({ row: i + 1, message: err.message });
        }
      }
      return text({ success: true, colid, total: leads.length, inserted, updated, error_count: errors.length, errors: errors.slice(0, 20) });
    }
  );

  // ── bulk_upload_leads_from_excel ─────────────────────────────────────────────
  server.tool(
    "bulk_upload_leads_from_excel",
    "Upload CRM leads from an Excel file (.xlsx/.xls). First row must be headers. Required columns: name, category, source, assignedto.",
    {
      file_path: z.string().describe("Absolute path to the Excel file on disk"),
      upsert:    z.boolean().optional().default(false)
                  .describe("false (default) = always insert. true = update if phone+colid exists")
    },
    async ({ file_path, upsert }) => {
      requireAuth();
      await connectDB();
      if (!fs.existsSync(file_path)) return text({ error: `File not found: ${file_path}` });
      let workbook;
      try { workbook = XLSX.readFile(file_path); }
      catch (err) { return text({ error: `Cannot read Excel file: ${err.message}` }); }

      const sheet     = workbook.Sheets[workbook.SheetNames[0]];
      const excelRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      if (!excelRows.length) return text({ error: "No data rows found in the file" });

      const colid  = resolveColid(undefined);
      const user   = resolveUser(undefined);
      const errors = [];
      let inserted = 0, updated = 0;

      for (let i = 0; i < excelRows.length; i++) {
        const rowNum  = i + 2;
        const payload = leadPayload(excelRowToLeadBody(excelRows[i]), colid, user);
        if (!payload.name || !payload.category || !payload.source || !payload.assignedto) {
          errors.push({ row: rowNum, message: "name, category, source, and assignedto are required" });
          continue;
        }
        try {
          if (upsert && payload.phone) {
            const res = await CrmLead.updateOne(
              { colid, phone: payload.phone },
              { $set: payload },
              { upsert: true, runValidators: true }
            );
            res.upsertedCount > 0 ? inserted++ : updated++;
          } else {
            await CrmLead.create(payload);
            inserted++;
          }
        } catch (err) {
          errors.push({ row: rowNum, message: err.message });
        }
      }
      return text({ success: true, colid, total_rows: excelRows.length, inserted, updated, error_count: errors.length, errors: errors.slice(0, 20) });
    }
  );

  // ── get_excel_template_leads ─────────────────────────────────────────────────
  server.tool(
    "get_excel_template_leads",
    "Generate a sample Excel template file for bulk CRM lead upload with all column headers and one example row.",
    {
      output_path: z.string().describe("Absolute path where the .xlsx template should be saved e.g. /tmp/leads_template.xlsx")
    },
    async ({ output_path }) => {
      const sample = [{
        name: "Rahul Sharma", phone: "9876543210", email: "rahul@example.com",
        year: "2026-27", city: "Pune", state: "Maharashtra", address: "", qualification: "12th pass",
        passout_year: "2024", category: "Engineering", course_interested: "B.Tech CSE",
        program: "B.Tech", program_type: "UG", expected_admission_year: "2025",
        budget: "3-5 Lakhs", scholarship_interest: "Yes",
        source: "Facebook", sourceemp: "", utm_source: "fb", utm_medium: "cpc", utm_campaign: "",
        assignedto: "counsellor@college.edu", pipeline_stage: "New Lead",
        leadstatus: "Active", next_followup_date: "2025-06-01", fcomments: "", comments: ""
      }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sample), "Leads");
      XLSX.writeFile(wb, output_path);
      return text({ success: true, path: output_path, columns: Object.keys(sample[0]),
        note: "Fill from row 2. Required: name, category, source, assignedto." });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // REPORT TOOLS
  // ════════════════════════════════════════════════════════════════════════════

  // ── get_crm_options ──────────────────────────────────────────────────────────
  server.tool(
    "get_crm_options",
    "Get all distinct values for dropdown filters: academic years, categories, sources, pipeline stages, lead statuses, and temperatures. Use these to populate year/category/source filters in other tools.",
    {},
    async () => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const [years, categories, sources, stages, statuses, temperatures] = await Promise.all([
        CrmLead.distinct("year",             { colid }),
        CrmLead.distinct("category",         { colid }),
        CrmLead.distinct("source",           { colid }),
        CrmLead.distinct("pipeline_stage",   { colid }),
        CrmLead.distinct("leadstatus",       { colid }),
        CrmLead.distinct("lead_temperature", { colid })
      ]);
      const defaultYears = ["2023-24","2024-25","2025-26","2026-27","2027-28","2028-29","2029-30","2030-31"];
      const allYears = [...new Set([...defaultYears, ...years.filter(Boolean)])].sort();
      return text({ success: true, colid,
        years:        allYears,
        categories:   categories.filter(Boolean).sort(),
        sources:      sources.filter(Boolean).sort(),
        stages:       stages.filter(Boolean).sort(),
        statuses:     statuses.filter(Boolean).sort(),
        temperatures: temperatures.filter(Boolean).sort(),
        note: "Pass 'year' e.g. '2026-27' to any search/report tool to scope results to that academic year."
      });
    }
  );

  // ── report_lead_analytics ────────────────────────────────────────────────────
  server.tool(
    "report_lead_analytics",
    "Overall CRM dashboard analytics: total leads, temperature breakdown, conversion rate, leads by stage / source / category / location. Filter by academic year and/or date range.",
    {
      year:      z.string().optional().describe("Academic year e.g. 2026-27, 2025-26"),
      from_date: z.string().optional().describe("Filter from date YYYY-MM-DD"),
      to_date:   z.string().optional().describe("Filter to date YYYY-MM-DD")
    },
    async ({ year, from_date, to_date }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const match = { colid };
      if (year) match.year = year;
      if (from_date || to_date) {
        match.createdAt = {};
        if (from_date) match.createdAt.$gte = new Date(from_date);
        if (to_date)   match.createdAt.$lte = new Date(to_date + "T23:59:59.999Z");
      }

      const [total, hot, warm, cold, converted, byStage, bySource, byCategory, byLocation, byCounsellor] = await Promise.all([
        CrmLead.countDocuments(match),
        CrmLead.countDocuments({ ...match, lead_temperature: "Hot" }),
        CrmLead.countDocuments({ ...match, lead_temperature: "Warm" }),
        CrmLead.countDocuments({ ...match, lead_temperature: "Cold" }),
        CrmLead.countDocuments({ ...match, leadstatus: "Converted" }),
        CrmLead.aggregate([{ $match: match }, { $group: { _id: "$pipeline_stage", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
        CrmLead.aggregate([{ $match: match }, { $group: { _id: "$source", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
        CrmLead.aggregate([{ $match: match }, { $group: { _id: "$category", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
        CrmLead.aggregate([{ $match: match }, { $group: { _id: { city: "$city", state: "$state" }, count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 15 }, { $project: { _id: 0, city: "$_id.city", state: "$_id.state", count: 1 } }]),
        CrmLead.aggregate([{ $match: match }, { $group: { _id: "$assignedto", count: { $sum: 1 } } }, { $sort: { count: -1 } }])
      ]);

      const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(2) : "0.00";
      return text({ success: true, colid, period: { year, from_date, to_date },
        summary: { total, hot, warm, cold, converted, conversionRate: `${conversionRate}%` },
        byStage: byStage.map(r => ({ stage: r._id, count: r.count })),
        bySource: bySource.map(r => ({ source: r._id, count: r.count })),
        byCategory: byCategory.map(r => ({ category: r._id, count: r.count })),
        byLocation,
        byCounsellor: byCounsellor.map(r => ({ counsellor: r._id, count: r.count }))
      });
    }
  );

  // ── report_followups_today ───────────────────────────────────────────────────
  server.tool(
    "report_followups_today",
    "List all leads with a follow-up scheduled for today. Filter by academic year and/or assignee.",
    {
      year:       z.string().optional().describe("Academic year e.g. 2026-27"),
      assignedto: z.string().optional().describe("Filter by counsellor email")
    },
    async ({ year, assignedto }) => {
      requireAuth();
      await connectDB();
      const colid    = resolveColid(undefined);
      const today    = new Date(); today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      const filter   = { colid, next_followup_date: { $gte: today, $lt: tomorrow } };
      if (year)       filter.year       = year;
      if (assignedto) filter.assignedto = assignedto;
      const data = await CrmLead.find(filter).sort({ next_followup_date: 1 }).lean();
      return text({ success: true, date: today.toISOString().slice(0, 10), year, total: data.length, leads: data.map(d => ({
        id: String(d._id), name: d.name, phone: d.phone, email: d.email, year: d.year,
        category: d.category, pipeline_stage: d.pipeline_stage, assignedto: d.assignedto,
        next_followup_date: d.next_followup_date, fcomments: d.fcomments
      })) });
    }
  );

  // ── report_followups_overdue ─────────────────────────────────────────────────
  server.tool(
    "report_followups_overdue",
    "List all active leads whose follow-up date is in the past (overdue). Filter by academic year and/or assignee.",
    {
      year:       z.string().optional().describe("Academic year e.g. 2026-27"),
      assignedto: z.string().optional().describe("Filter by counsellor email")
    },
    async ({ year, assignedto }) => {
      requireAuth();
      await connectDB();
      const colid  = resolveColid(undefined);
      const today  = new Date(); today.setHours(0, 0, 0, 0);
      const filter = { colid, next_followup_date: { $lt: today }, leadstatus: "Active" };
      if (year)       filter.year       = year;
      if (assignedto) filter.assignedto = assignedto;
      const data = await CrmLead.find(filter).sort({ next_followup_date: 1 }).lean();
      return text({ success: true, year, total: data.length, leads: data.map(d => ({
        id: String(d._id), name: d.name, phone: d.phone, category: d.category, year: d.year,
        pipeline_stage: d.pipeline_stage, assignedto: d.assignedto,
        next_followup_date: d.next_followup_date, days_overdue: Math.floor((today - new Date(d.next_followup_date)) / 86400000)
      })) });
    }
  );

  // ── report_stage_funnel ──────────────────────────────────────────────────────
  server.tool(
    "report_stage_funnel",
    "Stage-by-stage funnel report showing lead count and percentage at each pipeline stage. Filter by academic year.",
    {
      year:      z.string().optional().describe("Academic year e.g. 2026-27"),
      from_date: z.string().optional().describe("Filter from date YYYY-MM-DD"),
      to_date:   z.string().optional().describe("Filter to date YYYY-MM-DD")
    },
    async ({ year, from_date, to_date }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const match = { colid };
      if (year) match.year = year;
      if (from_date || to_date) {
        match.createdAt = {};
        if (from_date) match.createdAt.$gte = new Date(from_date);
        if (to_date)   match.createdAt.$lte = new Date(to_date + "T23:59:59.999Z");
      }
      const [total, byStage] = await Promise.all([
        CrmLead.countDocuments(match),
        CrmLead.aggregate([
          { $match: match },
          { $group: { _id: "$pipeline_stage", count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ])
      ]);
      const funnel = byStage.map(r => ({
        stage: r._id || "(No Stage)",
        count: r.count,
        pct: total > 0 ? ((r.count / total) * 100).toFixed(1) + "%" : "0%"
      }));
      return text({ success: true, colid, year, total, funnel });
    }
  );

  // ── report_leads_by_counsellor ───────────────────────────────────────────────
  server.tool(
    "report_leads_by_counsellor",
    "Report showing how many leads each counsellor has, broken down by temperature and status. Filter by academic year.",
    {
      year:      z.string().optional().describe("Academic year e.g. 2026-27"),
      from_date: z.string().optional().describe("Filter from date YYYY-MM-DD"),
      to_date:   z.string().optional().describe("Filter to date YYYY-MM-DD")
    },
    async ({ year, from_date, to_date }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const match = { colid };
      if (year) match.year = year;
      if (from_date || to_date) {
        match.createdAt = {};
        if (from_date) match.createdAt.$gte = new Date(from_date);
        if (to_date)   match.createdAt.$lte = new Date(to_date + "T23:59:59.999Z");
      }
      const rows = await CrmLead.aggregate([
        { $match: match },
        { $group: {
          _id: "$assignedto",
          total:     { $sum: 1 },
          hot:       { $sum: { $cond: [{ $eq: ["$lead_temperature","Hot"]   }, 1, 0] } },
          warm:      { $sum: { $cond: [{ $eq: ["$lead_temperature","Warm"]  }, 1, 0] } },
          cold:      { $sum: { $cond: [{ $eq: ["$lead_temperature","Cold"]  }, 1, 0] } },
          active:    { $sum: { $cond: [{ $eq: ["$leadstatus","Active"]      }, 1, 0] } },
          converted: { $sum: { $cond: [{ $eq: ["$leadstatus","Converted"]   }, 1, 0] } },
          lost:      { $sum: { $cond: [{ $eq: ["$leadstatus","Lost"]        }, 1, 0] } }
        }},
        { $sort: { total: -1 } }
      ]);
      return text({ success: true, colid, year, total_counsellors: rows.length,
        counsellors: rows.map(r => ({ counsellor: r._id, total: r.total, hot: r.hot, warm: r.warm, cold: r.cold, active: r.active, converted: r.converted, lost: r.lost }))
      });
    }
  );

  // ── report_leads_by_source ───────────────────────────────────────────────────
  server.tool(
    "report_leads_by_source",
    "Report showing lead volume and conversion by source. Filter by academic year.",
    {
      year:      z.string().optional().describe("Academic year e.g. 2026-27"),
      from_date: z.string().optional().describe("Filter from date YYYY-MM-DD"),
      to_date:   z.string().optional().describe("Filter to date YYYY-MM-DD")
    },
    async ({ year, from_date, to_date }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const match = { colid };
      if (year) match.year = year;
      if (from_date || to_date) {
        match.createdAt = {};
        if (from_date) match.createdAt.$gte = new Date(from_date);
        if (to_date)   match.createdAt.$lte = new Date(to_date + "T23:59:59.999Z");
      }
      const rows = await CrmLead.aggregate([
        { $match: match },
        { $group: {
          _id: "$source",
          total:     { $sum: 1 },
          hot:       { $sum: { $cond: [{ $eq: ["$lead_temperature","Hot"]   }, 1, 0] } },
          converted: { $sum: { $cond: [{ $eq: ["$leadstatus","Converted"]   }, 1, 0] } },
          lost:      { $sum: { $cond: [{ $eq: ["$leadstatus","Lost"]        }, 1, 0] } }
        }},
        { $sort: { total: -1 } }
      ]);
      const total = rows.reduce((s, r) => s + r.total, 0);
      return text({ success: true, colid, year, grand_total: total,
        sources: rows.map(r => ({
          source: r._id || "(Unknown)", total: r.total, hot: r.hot, converted: r.converted, lost: r.lost,
          conversion_rate: r.total > 0 ? ((r.converted / r.total) * 100).toFixed(1) + "%" : "0%",
          share: total > 0 ? ((r.total / total) * 100).toFixed(1) + "%" : "0%"
        }))
      });
    }
  );

  // ── report_hot_leads ────────────────────────────────────────────────────────
  server.tool(
    "report_hot_leads",
    "List all Hot leads (score ≥ 40) sorted by score descending. Filter by academic year and/or counsellor.",
    {
      year:       z.string().optional().describe("Academic year e.g. 2026-27"),
      assignedto: z.string().optional().describe("Filter by counsellor email — blank returns all hot leads"),
      limit:      z.number().int().optional().default(50).describe("Max results (default 50)")
    },
    async ({ year, assignedto, limit }) => {
      requireAuth();
      await connectDB();
      const colid  = resolveColid(undefined);
      const filter = { colid, lead_temperature: "Hot" };
      if (year)       filter.year       = year;
      if (assignedto) filter.assignedto = assignedto;
      const data = await CrmLead.find(filter).sort({ lead_score: -1 }).limit(Math.min(limit || 50, 200)).lean();
      return text({ success: true, year, total: data.length, leads: data.map(d => ({
        id: String(d._id), name: d.name, phone: d.phone, email: d.email, year: d.year,
        category: d.category, course_interested: d.course_interested, lead_score: d.lead_score,
        pipeline_stage: d.pipeline_stage, assignedto: d.assignedto,
        next_followup_date: d.next_followup_date, source: d.source
      })) });
    }
  );
}
