import { z } from "zod";
import mongoose from "mongoose";

export function registerRecruitmentPlacementTools(server, { requireAuth, resolveColid, connectDB }) {

  // ── Recruitment Job Posts ───────────────────────────────────────────────────

  const jobPostSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    jobid: { type: String, trim: true },
    title: { type: String, trim: true },
    department: { type: String, trim: true },
    location: { type: String, trim: true },
    employmenttype: { type: String, trim: true },
    openings: { type: Number, default: 0 },
    salaryrange: { type: String, trim: true },
    description: { type: String, trim: true },
    eligibility: { type: String, trim: true },
    skills: { type: String, trim: true },
    formid: { type: mongoose.Schema.Types.ObjectId },
    status: { type: String, default: "Active" },
    sharetoken: { type: String, trim: true },
    posteddate: { type: Date },
    lastdate: { type: Date },
    createdByName: { type: String, trim: true },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const RecruitmentJobPostMcp = mongoose.models.RecruitmentJobPostMcp || mongoose.model("RecruitmentJobPostMcp", jobPostSchema, "recruitmentjobpostds");

  server.tool("list_recruitment_job_posts", "List recruitment job posts filtered by colid", {
    status: z.string().optional(),
    department: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.status) query.status = args.status;
    if (args.department) query.department = args.department;
    const data = await RecruitmentJobPostMcp.find(query).sort({ createdAt: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_recruitment_job_post", "Create a recruitment job post", {
    jobid: z.string().optional(),
    title: z.string(),
    department: z.string().optional(),
    location: z.string().optional(),
    employmenttype: z.string().optional(),
    openings: z.number().optional(),
    salaryrange: z.string().optional(),
    description: z.string().optional(),
    eligibility: z.string().optional(),
    skills: z.string().optional(),
    status: z.string().optional(),
    posteddate: z.string().optional(),
    lastdate: z.string().optional(),
    createdByName: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await RecruitmentJobPostMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_recruitment_job_post", "Update any field of a recruitment job post by id", {
    id: z.string(),
    jobid: z.string().optional(),
    title: z.string().optional(),
    department: z.string().optional(),
    location: z.string().optional(),
    employmenttype: z.string().optional(),
    openings: z.number().optional(),
    salaryrange: z.string().optional(),
    description: z.string().optional(),
    eligibility: z.string().optional(),
    skills: z.string().optional(),
    status: z.string().optional(),
    sharetoken: z.string().optional(),
    posteddate: z.string().optional(),
    lastdate: z.string().optional(),
    createdByName: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await RecruitmentJobPostMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Recruitment Applications ────────────────────────────────────────────────

  const recruitAppSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    jobid: { type: String, trim: true },
    formid: { type: mongoose.Schema.Types.ObjectId },
    applicationno: { type: String, trim: true },
    applicantname: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    username: { type: String, trim: true },
    status: { type: String, default: "Applied" },
    photourl: { type: String, trim: true },
    resumelink: { type: String, trim: true },
    approvalstatus: { type: String, trim: true },
    approvallevel: { type: Number, default: 0 },
    approvalhistory: [{ type: mongoose.Schema.Types.Mixed }],
    customfields: { type: mongoose.Schema.Types.Mixed },
    documents: [{ type: mongoose.Schema.Types.Mixed }],
    educationalqualifications: [{ type: mongoose.Schema.Types.Mixed }],
    familydetails: [{ type: mongoose.Schema.Types.Mixed }],
    pastemployments: [{ type: mongoose.Schema.Types.Mixed }],
    totalexperience: { type: Number, default: 0 },
    candidatedocuments: [{ type: mongoose.Schema.Types.Mixed }],
    validationstatus: { type: String, trim: true },
    validationcomments: { type: String, trim: true },
    mandatoryvalidationstatus: { type: String, trim: true },
    mandatoryvalidationcomments: { type: String, trim: true },
    shortlistcomments: { type: String, trim: true },
    submittedat: { type: Date },
  }, { timestamps: true });
  const RecruitmentApplicationMcp = mongoose.models.RecruitmentApplicationMcp || mongoose.model("RecruitmentApplicationMcp", recruitAppSchema, "recruitmentapplicationds");

  server.tool("list_recruitment_applications", "List recruitment applications filtered by colid", {
    jobid: z.string().optional(),
    status: z.string().optional(),
    approvalstatus: z.string().optional(),
    email: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.jobid) query.jobid = args.jobid;
    if (args.status) query.status = args.status;
    if (args.approvalstatus) query.approvalstatus = args.approvalstatus;
    if (args.email) query.email = args.email;
    const data = await RecruitmentApplicationMcp.find(query).sort({ createdAt: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_recruitment_application", "Create a recruitment application", {
    jobid: z.string().optional(),
    applicationno: z.string().optional(),
    applicantname: z.string().optional(),
    email: z.string(),
    phone: z.string().optional(),
    username: z.string().optional(),
    status: z.string().optional(),
    photourl: z.string().optional(),
    resumelink: z.string().optional(),
    customfields: z.any().optional(),
    documents: z.array(z.any()).optional(),
    educationalqualifications: z.array(z.any()).optional(),
    familydetails: z.array(z.any()).optional(),
    pastemployments: z.array(z.any()).optional(),
    totalexperience: z.number().optional(),
    submittedat: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await RecruitmentApplicationMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_recruitment_application", "Update any field of a recruitment application by id", {
    id: z.string(),
    jobid: z.string().optional(),
    applicationno: z.string().optional(),
    applicantname: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    username: z.string().optional(),
    status: z.string().optional(),
    photourl: z.string().optional(),
    resumelink: z.string().optional(),
    approvalstatus: z.string().optional(),
    approvallevel: z.number().optional(),
    approvalhistory: z.array(z.any()).optional(),
    customfields: z.any().optional(),
    documents: z.array(z.any()).optional(),
    educationalqualifications: z.array(z.any()).optional(),
    familydetails: z.array(z.any()).optional(),
    pastemployments: z.array(z.any()).optional(),
    totalexperience: z.number().optional(),
    candidatedocuments: z.array(z.any()).optional(),
    validationstatus: z.string().optional(),
    validationcomments: z.string().optional(),
    mandatoryvalidationstatus: z.string().optional(),
    mandatoryvalidationcomments: z.string().optional(),
    shortlistcomments: z.string().optional(),
    submittedat: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await RecruitmentApplicationMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Recruitment Interview Panels ────────────────────────────────────────────

  const interviewPanelSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    panelid: { type: String, trim: true },
    panelname: { type: String, trim: true },
    description: { type: String, trim: true },
    status: { type: String, default: "Active" },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const RecruitmentInterviewPanelMcp = mongoose.models.RecruitmentInterviewPanelMcp || mongoose.model("RecruitmentInterviewPanelMcp", interviewPanelSchema, "recruitmentinterviewpanelds");

  server.tool("list_recruitment_interview_panels", "List recruitment interview panels filtered by colid", {
    status: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.status) query.status = args.status;
    const data = await RecruitmentInterviewPanelMcp.find(query).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_recruitment_interview_panel", "Create a recruitment interview panel", {
    panelid: z.string().optional(),
    panelname: z.string(),
    description: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await RecruitmentInterviewPanelMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_recruitment_interview_panel", "Update any field of a recruitment interview panel by id", {
    id: z.string(),
    panelid: z.string().optional(),
    panelname: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await RecruitmentInterviewPanelMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Recruitment Interview Schedule ──────────────────────────────────────────

  const interviewScheduleSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    jobid: { type: String, trim: true },
    jobtitle: { type: String, trim: true },
    panelid: { type: String, trim: true },
    panelname: { type: String, trim: true },
    applicationid: { type: mongoose.Schema.Types.ObjectId },
    applicationno: { type: String, trim: true },
    candidate: { type: String, trim: true },
    candidateemail: { type: String, trim: true },
    candidatephone: { type: String, trim: true },
    interviewdate: { type: Date },
    interviewtime: { type: String, trim: true },
    mode: { type: String, trim: true },
    venue: { type: String, trim: true },
    meetinglink: { type: String, trim: true },
    status: { type: String, default: "Scheduled" },
    remarks: { type: String, trim: true },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const RecruitmentInterviewScheduleMcp = mongoose.models.RecruitmentInterviewScheduleMcp || mongoose.model("RecruitmentInterviewScheduleMcp", interviewScheduleSchema, "recruitmentinterviewscheduleds");

  server.tool("list_recruitment_interview_schedules", "List recruitment interview schedules filtered by colid", {
    jobid: z.string().optional(),
    candidateemail: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.jobid) query.jobid = args.jobid;
    if (args.candidateemail) query.candidateemail = args.candidateemail;
    if (args.status) query.status = args.status;
    const data = await RecruitmentInterviewScheduleMcp.find(query).sort({ interviewdate: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_recruitment_interview_schedule", "Create a recruitment interview schedule", {
    jobid: z.string().optional(),
    jobtitle: z.string().optional(),
    panelid: z.string().optional(),
    panelname: z.string().optional(),
    applicationno: z.string().optional(),
    candidate: z.string().optional(),
    candidateemail: z.string(),
    candidatephone: z.string().optional(),
    interviewdate: z.string().optional(),
    interviewtime: z.string().optional(),
    mode: z.string().optional(),
    venue: z.string().optional(),
    meetinglink: z.string().optional(),
    status: z.string().optional(),
    remarks: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await RecruitmentInterviewScheduleMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_recruitment_interview_schedule", "Update any field of a recruitment interview schedule by id", {
    id: z.string(),
    jobid: z.string().optional(),
    jobtitle: z.string().optional(),
    panelid: z.string().optional(),
    panelname: z.string().optional(),
    applicationno: z.string().optional(),
    candidate: z.string().optional(),
    candidateemail: z.string().optional(),
    candidatephone: z.string().optional(),
    interviewdate: z.string().optional(),
    interviewtime: z.string().optional(),
    mode: z.string().optional(),
    venue: z.string().optional(),
    meetinglink: z.string().optional(),
    status: z.string().optional(),
    remarks: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await RecruitmentInterviewScheduleMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Recruitment Interview Scores ────────────────────────────────────────────

  const interviewScoreSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    jobid: { type: String, trim: true },
    jobtitle: { type: String, trim: true },
    applicationid: { type: mongoose.Schema.Types.ObjectId },
    applicationno: { type: String, trim: true },
    candidate: { type: String, trim: true },
    candidateemail: { type: String, trim: true },
    panelmembername: { type: String, trim: true },
    panelmemberemail: { type: String, trim: true },
    parameterid: { type: String, trim: true },
    parameter: { type: String, trim: true },
    description: { type: String, trim: true },
    maxmarks: { type: Number, default: 0 },
    marks: { type: Number, default: 0 },
    comments: { type: String, trim: true },
    status: { type: String, default: "Pending" },
    submittedat: { type: Date },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const RecruitmentInterviewScoreMcp = mongoose.models.RecruitmentInterviewScoreMcp || mongoose.model("RecruitmentInterviewScoreMcp", interviewScoreSchema, "recruitmentinterviewscoreds");

  server.tool("list_recruitment_interview_scores", "List recruitment interview scores filtered by colid", {
    jobid: z.string().optional(),
    applicationno: z.string().optional(),
    panelmemberemail: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.jobid) query.jobid = args.jobid;
    if (args.applicationno) query.applicationno = args.applicationno;
    if (args.panelmemberemail) query.panelmemberemail = args.panelmemberemail;
    const data = await RecruitmentInterviewScoreMcp.find(query).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_recruitment_interview_score", "Create a recruitment interview score", {
    jobid: z.string().optional(),
    jobtitle: z.string().optional(),
    applicationno: z.string().optional(),
    candidate: z.string().optional(),
    candidateemail: z.string().optional(),
    panelmembername: z.string().optional(),
    panelmemberemail: z.string(),
    parameterid: z.string().optional(),
    parameter: z.string().optional(),
    description: z.string().optional(),
    maxmarks: z.number().optional(),
    marks: z.number().optional(),
    comments: z.string().optional(),
    status: z.string().optional(),
    submittedat: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await RecruitmentInterviewScoreMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_recruitment_interview_score", "Update any field of a recruitment interview score by id", {
    id: z.string(),
    jobid: z.string().optional(),
    jobtitle: z.string().optional(),
    applicationno: z.string().optional(),
    candidate: z.string().optional(),
    candidateemail: z.string().optional(),
    panelmembername: z.string().optional(),
    panelmemberemail: z.string().optional(),
    parameterid: z.string().optional(),
    parameter: z.string().optional(),
    description: z.string().optional(),
    maxmarks: z.number().optional(),
    marks: z.number().optional(),
    comments: z.string().optional(),
    status: z.string().optional(),
    submittedat: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await RecruitmentInterviewScoreMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Recruitment Onboarding Steps ────────────────────────────────────────────

  const onboardingStepSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    role: { type: String, trim: true },
    stepid: { type: String, trim: true },
    stepname: { type: String, trim: true },
    description: { type: String, trim: true },
    order: { type: Number, default: 0 },
    documentrequired: { type: Boolean, default: false },
    status: { type: String, default: "Active" },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const RecruitmentOnboardingStepMcp = mongoose.models.RecruitmentOnboardingStepMcp || mongoose.model("RecruitmentOnboardingStepMcp", onboardingStepSchema, "recruitmentonboardingstepds");

  server.tool("list_recruitment_onboarding_steps", "List recruitment onboarding steps filtered by colid", {
    role: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.role) query.role = args.role;
    if (args.status) query.status = args.status;
    const data = await RecruitmentOnboardingStepMcp.find(query).sort({ order: 1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_recruitment_onboarding_step", "Create a recruitment onboarding step", {
    role: z.string(),
    stepid: z.string().optional(),
    stepname: z.string(),
    description: z.string().optional(),
    order: z.number().optional(),
    documentrequired: z.boolean().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await RecruitmentOnboardingStepMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_recruitment_onboarding_step", "Update any field of a recruitment onboarding step by id", {
    id: z.string(),
    role: z.string().optional(),
    stepid: z.string().optional(),
    stepname: z.string().optional(),
    description: z.string().optional(),
    order: z.number().optional(),
    documentrequired: z.boolean().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await RecruitmentOnboardingStepMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Recruitment Onboarding Records ─────────────────────────────────────────

  const onboardingRecordSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    jobid: { type: String, trim: true },
    jobtitle: { type: String, trim: true },
    applicationid: { type: mongoose.Schema.Types.ObjectId },
    applicationno: { type: String, trim: true },
    candidate: { type: String, trim: true },
    candidateemail: { type: String, trim: true },
    candidatephone: { type: String, trim: true },
    role: { type: String, trim: true },
    overallstatus: { type: String, default: "In Progress" },
    steps: [{ type: mongoose.Schema.Types.Mixed }],
    remarks: { type: String, trim: true },
    completedat: { type: Date },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const RecruitmentOnboardingRecordMcp = mongoose.models.RecruitmentOnboardingRecordMcp || mongoose.model("RecruitmentOnboardingRecordMcp", onboardingRecordSchema, "recruitmentonboardingrecordds");

  server.tool("list_recruitment_onboarding_records", "List recruitment onboarding records filtered by colid", {
    jobid: z.string().optional(),
    candidateemail: z.string().optional(),
    overallstatus: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.jobid) query.jobid = args.jobid;
    if (args.candidateemail) query.candidateemail = args.candidateemail;
    if (args.overallstatus) query.overallstatus = args.overallstatus;
    const data = await RecruitmentOnboardingRecordMcp.find(query).sort({ createdAt: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_recruitment_onboarding_record", "Create a recruitment onboarding record", {
    jobid: z.string().optional(),
    jobtitle: z.string().optional(),
    applicationno: z.string().optional(),
    candidate: z.string().optional(),
    candidateemail: z.string(),
    candidatephone: z.string().optional(),
    role: z.string().optional(),
    overallstatus: z.string().optional(),
    steps: z.array(z.any()).optional(),
    remarks: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await RecruitmentOnboardingRecordMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_recruitment_onboarding_record", "Update any field of a recruitment onboarding record by id", {
    id: z.string(),
    jobid: z.string().optional(),
    jobtitle: z.string().optional(),
    applicationno: z.string().optional(),
    candidate: z.string().optional(),
    candidateemail: z.string().optional(),
    candidatephone: z.string().optional(),
    role: z.string().optional(),
    overallstatus: z.string().optional(),
    steps: z.array(z.any()).optional(),
    remarks: z.string().optional(),
    completedat: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await RecruitmentOnboardingRecordMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Placement Companies ─────────────────────────────────────────────────────

  const placementCompanySchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    company: { type: String, trim: true },
    companyemail: { type: String, trim: true },
    contactnumber: { type: String, trim: true },
    industry: { type: String, trim: true },
    login: { type: String, trim: true },
    password: { type: String, trim: true },
    address: { type: String, trim: true },
    status: { type: String, default: "Active" },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const PlacementNewCompanyMcp = mongoose.models.PlacementNewCompanyMcp || mongoose.model("PlacementNewCompanyMcp", placementCompanySchema, "placementnewcompanyds");

  server.tool("list_placement_companies", "List placement companies filtered by colid", {
    industry: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.industry) query.industry = args.industry;
    if (args.status) query.status = args.status;
    const data = await PlacementNewCompanyMcp.find(query).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_placement_company", "Create a placement company", {
    company: z.string(),
    companyemail: z.string(),
    contactnumber: z.string().optional(),
    industry: z.string().optional(),
    login: z.string().optional(),
    password: z.string().optional(),
    address: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await PlacementNewCompanyMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_placement_company", "Update any field of a placement company by id", {
    id: z.string(),
    company: z.string().optional(),
    companyemail: z.string().optional(),
    contactnumber: z.string().optional(),
    industry: z.string().optional(),
    login: z.string().optional(),
    password: z.string().optional(),
    address: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await PlacementNewCompanyMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Placement Jobs ──────────────────────────────────────────────────────────

  const placementJobSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    industry: { type: String, trim: true },
    company: { type: String, trim: true },
    companyemail: { type: String, trim: true },
    type: { type: String, trim: true },
    jobtitle: { type: String, trim: true },
    jobdetails: { type: String, trim: true },
    description: { type: String, trim: true },
    startdate: { type: Date },
    enddate: { type: Date },
    programs: [{ type: mongoose.Schema.Types.Mixed }],
    minimumcgpa: { type: Number, default: 0 },
    skills: { type: String, trim: true },
    status: { type: String, default: "Active" },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const PlacementNewJobMcp = mongoose.models.PlacementNewJobMcp || mongoose.model("PlacementNewJobMcp", placementJobSchema, "placementnewjobds");

  server.tool("list_placement_jobs", "List placement jobs filtered by colid", {
    company: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.company) query.company = args.company;
    if (args.type) query.type = args.type;
    if (args.status) query.status = args.status;
    const data = await PlacementNewJobMcp.find(query).sort({ createdAt: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_placement_job", "Create a placement job", {
    industry: z.string().optional(),
    company: z.string(),
    companyemail: z.string().optional(),
    type: z.string().optional(),
    jobtitle: z.string(),
    jobdetails: z.string().optional(),
    description: z.string().optional(),
    startdate: z.string().optional(),
    enddate: z.string().optional(),
    programs: z.array(z.any()).optional(),
    minimumcgpa: z.number().optional(),
    skills: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await PlacementNewJobMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_placement_job", "Update any field of a placement job by id", {
    id: z.string(),
    industry: z.string().optional(),
    company: z.string().optional(),
    companyemail: z.string().optional(),
    type: z.string().optional(),
    jobtitle: z.string().optional(),
    jobdetails: z.string().optional(),
    description: z.string().optional(),
    startdate: z.string().optional(),
    enddate: z.string().optional(),
    programs: z.array(z.any()).optional(),
    minimumcgpa: z.number().optional(),
    skills: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await PlacementNewJobMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Placement Applications ──────────────────────────────────────────────────

  const placementAppSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    jobid: { type: String, trim: true },
    jobtitle: { type: String, trim: true },
    jobtype: { type: String, trim: true },
    industry: { type: String, trim: true },
    company: { type: String, trim: true },
    companyemail: { type: String, trim: true },
    student: { type: String, trim: true },
    studentemail: { type: String, trim: true },
    phone: { type: String, trim: true },
    regno: { type: String, trim: true },
    academicyear: { type: String, trim: true },
    admissionyear: { type: String, trim: true },
    program: { type: String, trim: true },
    programcode: { type: String, trim: true },
    semester: { type: String, trim: true },
    section: { type: String, trim: true },
    applieddate: { type: Date },
    stageid: { type: String, trim: true },
    stagename: { type: String, trim: true },
    status: { type: String, default: "Applied" },
    selected: { type: Boolean, default: false },
    offerletterlink: { type: String, trim: true },
    offerlettername: { type: String, trim: true },
    remarks: { type: String, trim: true },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const PlacementNewApplicationMcp = mongoose.models.PlacementNewApplicationMcp || mongoose.model("PlacementNewApplicationMcp", placementAppSchema, "placementnewplacementapplicationds");

  server.tool("list_placement_applications", "List placement applications filtered by colid", {
    jobid: z.string().optional(),
    studentemail: z.string().optional(),
    status: z.string().optional(),
    selected: z.boolean().optional(),
    program: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.jobid) query.jobid = args.jobid;
    if (args.studentemail) query.studentemail = args.studentemail;
    if (args.status) query.status = args.status;
    if (args.selected !== undefined) query.selected = args.selected;
    if (args.program) query.program = args.program;
    const data = await PlacementNewApplicationMcp.find(query).sort({ createdAt: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_placement_application", "Create a placement application", {
    jobid: z.string().optional(),
    jobtitle: z.string().optional(),
    jobtype: z.string().optional(),
    industry: z.string().optional(),
    company: z.string().optional(),
    companyemail: z.string().optional(),
    student: z.string().optional(),
    studentemail: z.string(),
    phone: z.string().optional(),
    regno: z.string().optional(),
    academicyear: z.string().optional(),
    admissionyear: z.string().optional(),
    program: z.string().optional(),
    programcode: z.string().optional(),
    semester: z.string().optional(),
    section: z.string().optional(),
    applieddate: z.string().optional(),
    stageid: z.string().optional(),
    stagename: z.string().optional(),
    status: z.string().optional(),
    selected: z.boolean().optional(),
    offerletterlink: z.string().optional(),
    offerlettername: z.string().optional(),
    remarks: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await PlacementNewApplicationMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_placement_application", "Update any field of a placement application by id", {
    id: z.string(),
    jobid: z.string().optional(),
    jobtitle: z.string().optional(),
    jobtype: z.string().optional(),
    industry: z.string().optional(),
    company: z.string().optional(),
    companyemail: z.string().optional(),
    student: z.string().optional(),
    studentemail: z.string().optional(),
    phone: z.string().optional(),
    regno: z.string().optional(),
    academicyear: z.string().optional(),
    admissionyear: z.string().optional(),
    program: z.string().optional(),
    programcode: z.string().optional(),
    semester: z.string().optional(),
    section: z.string().optional(),
    applieddate: z.string().optional(),
    stageid: z.string().optional(),
    stagename: z.string().optional(),
    status: z.string().optional(),
    selected: z.boolean().optional(),
    offerletterlink: z.string().optional(),
    offerlettername: z.string().optional(),
    remarks: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await PlacementNewApplicationMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });
}
