import { z } from "zod";
import mongoose from "mongoose";

export function registerAssetMiscTools(server, { requireAuth, resolveColid, connectDB }) {

  // ── Asset Items ─────────────────────────────────────────────────────────────

  const assetItemSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    assetid: { type: String, trim: true },
    barcode: { type: String, trim: true },
    qrcode: { type: String, trim: true },
    itemmasterid: { type: mongoose.Schema.Types.ObjectId },
    store: { type: String, trim: true },
    category: { type: String, trim: true },
    categorytype: { type: String, trim: true },
    item: { type: String, trim: true },
    description: { type: String, trim: true },
    approximateprice: { type: Number, default: 0 },
    unit: { type: String, trim: true },
    dimension: { type: String, trim: true },
    status: { type: String, default: "Active" },
    condition: { type: String, trim: true },
    department: { type: String, trim: true },
    assignedto: { type: String, trim: true },
    assignedtoemail: { type: String, trim: true },
    assigneddate: { type: Date },
    requisitionid: { type: mongoose.Schema.Types.ObjectId },
    lasttrackingid: { type: mongoose.Schema.Types.ObjectId },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const AssetNewItemMcp = mongoose.models.AssetNewItemMcp || mongoose.model("AssetNewItemMcp", assetItemSchema, "assetnewitemds");

  server.tool("list_asset_items", "List asset items filtered by colid", {
    category: z.string().optional(),
    store: z.string().optional(),
    status: z.string().optional(),
    department: z.string().optional(),
    assignedtoemail: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.category) query.category = args.category;
    if (args.store) query.store = args.store;
    if (args.status) query.status = args.status;
    if (args.department) query.department = args.department;
    if (args.assignedtoemail) query.assignedtoemail = args.assignedtoemail;
    const data = await AssetNewItemMcp.find(query).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_asset_item", "Create an asset item", {
    assetid: z.string().optional(),
    barcode: z.string().optional(),
    qrcode: z.string().optional(),
    store: z.string().optional(),
    category: z.string().optional(),
    categorytype: z.string().optional(),
    item: z.string(),
    description: z.string().optional(),
    approximateprice: z.number().optional(),
    unit: z.string().optional(),
    dimension: z.string().optional(),
    status: z.string().optional(),
    condition: z.string().optional(),
    department: z.string().optional(),
    assignedto: z.string().optional(),
    assignedtoemail: z.string().optional(),
    assigneddate: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await AssetNewItemMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_asset_item", "Update any field of an asset item by id", {
    id: z.string(),
    assetid: z.string().optional(),
    barcode: z.string().optional(),
    qrcode: z.string().optional(),
    store: z.string().optional(),
    category: z.string().optional(),
    categorytype: z.string().optional(),
    item: z.string().optional(),
    description: z.string().optional(),
    approximateprice: z.number().optional(),
    unit: z.string().optional(),
    dimension: z.string().optional(),
    status: z.string().optional(),
    condition: z.string().optional(),
    department: z.string().optional(),
    assignedto: z.string().optional(),
    assignedtoemail: z.string().optional(),
    assigneddate: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await AssetNewItemMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Asset Tracking ──────────────────────────────────────────────────────────

  const assetTrackSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    asset: { type: mongoose.Schema.Types.ObjectId },
    assetid: { type: String, trim: true },
    itemmasterid: { type: mongoose.Schema.Types.ObjectId },
    requisitionid: { type: mongoose.Schema.Types.ObjectId },
    store: { type: String, trim: true },
    category: { type: String, trim: true },
    item: { type: String, trim: true },
    description: { type: String, trim: true },
    action: { type: String, default: "Assignment", trim: true },
    assignmentdate: { type: Date, default: Date.now },
    fromname: { type: String, trim: true },
    fromemail: { type: String, trim: true },
    toname: { type: String, trim: true },
    toemail: { type: String, trim: true },
    department: { type: String, trim: true },
    penaltytype: { type: String, trim: true },
    penaltyamount: { type: Number, default: 0 },
    returncondition: { type: String, trim: true },
    agreementtext: { type: String, trim: true },
    remarks: { type: String, trim: true },
    createdby: { type: String, trim: true },
    createdbyname: { type: String, trim: true },
  }, { timestamps: true });
  const AssetNewTrackingMcp = mongoose.models.AssetNewTrackingMcp || mongoose.model("AssetNewTrackingMcp", assetTrackSchema, "assetnewtrackingds");

  server.tool("list_asset_tracking", "List asset tracking records filtered by colid", {
    assetid: z.string().optional(),
    toemail: z.string().optional(),
    action: z.string().optional(),
    department: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.assetid) query.assetid = args.assetid;
    if (args.toemail) query.toemail = args.toemail;
    if (args.action) query.action = args.action;
    if (args.department) query.department = args.department;
    const data = await AssetNewTrackingMcp.find(query).sort({ assignmentdate: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_asset_tracking", "Create an asset tracking record", {
    assetid: z.string(),
    store: z.string().optional(),
    category: z.string().optional(),
    item: z.string().optional(),
    description: z.string().optional(),
    action: z.string().optional(),
    assignmentdate: z.string().optional(),
    fromname: z.string().optional(),
    fromemail: z.string().optional(),
    toname: z.string().optional(),
    toemail: z.string().optional(),
    department: z.string().optional(),
    penaltytype: z.string().optional(),
    penaltyamount: z.number().optional(),
    returncondition: z.string().optional(),
    agreementtext: z.string().optional(),
    remarks: z.string().optional(),
    createdby: z.string().optional(),
    createdbyname: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await AssetNewTrackingMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_asset_tracking", "Update any field of an asset tracking record by id", {
    id: z.string(),
    assetid: z.string().optional(),
    store: z.string().optional(),
    category: z.string().optional(),
    item: z.string().optional(),
    description: z.string().optional(),
    action: z.string().optional(),
    assignmentdate: z.string().optional(),
    fromname: z.string().optional(),
    fromemail: z.string().optional(),
    toname: z.string().optional(),
    toemail: z.string().optional(),
    department: z.string().optional(),
    penaltytype: z.string().optional(),
    penaltyamount: z.number().optional(),
    returncondition: z.string().optional(),
    agreementtext: z.string().optional(),
    remarks: z.string().optional(),
    createdby: z.string().optional(),
    createdbyname: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await AssetNewTrackingMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Asset Retirement ────────────────────────────────────────────────────────

  const assetRetirementSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    asset: { type: mongoose.Schema.Types.ObjectId },
    assetid: { type: String, trim: true },
    itemmasterid: { type: mongoose.Schema.Types.ObjectId },
    store: { type: String, trim: true },
    category: { type: String, trim: true },
    item: { type: String, trim: true },
    status: { type: String, default: "Retired" },
    retirementtype: { type: String, trim: true },
    retirementdate: { type: Date },
    agency: { type: String, trim: true },
    location: { type: String, trim: true },
    recyclevalue: { type: Number, default: 0 },
    details: { type: String, trim: true },
    createdby: { type: String, trim: true },
    createdbyname: { type: String, trim: true },
  }, { timestamps: true });
  const AssetNewRetirementMcp = mongoose.models.AssetNewRetirementMcp || mongoose.model("AssetNewRetirementMcp", assetRetirementSchema, "assetnewretirementds");

  server.tool("list_asset_retirements", "List asset retirement records filtered by colid", {
    assetid: z.string().optional(),
    category: z.string().optional(),
    retirementtype: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.assetid) query.assetid = args.assetid;
    if (args.category) query.category = args.category;
    if (args.retirementtype) query.retirementtype = args.retirementtype;
    const data = await AssetNewRetirementMcp.find(query).sort({ retirementdate: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_asset_retirement", "Create an asset retirement record", {
    assetid: z.string(),
    store: z.string().optional(),
    category: z.string().optional(),
    item: z.string().optional(),
    status: z.string().optional(),
    retirementtype: z.string().optional(),
    retirementdate: z.string().optional(),
    agency: z.string().optional(),
    location: z.string().optional(),
    recyclevalue: z.number().optional(),
    details: z.string().optional(),
    createdby: z.string().optional(),
    createdbyname: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await AssetNewRetirementMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_asset_retirement", "Update any field of an asset retirement record by id", {
    id: z.string(),
    assetid: z.string().optional(),
    store: z.string().optional(),
    category: z.string().optional(),
    item: z.string().optional(),
    status: z.string().optional(),
    retirementtype: z.string().optional(),
    retirementdate: z.string().optional(),
    agency: z.string().optional(),
    location: z.string().optional(),
    recyclevalue: z.number().optional(),
    details: z.string().optional(),
    createdby: z.string().optional(),
    createdbyname: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await AssetNewRetirementMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Central Tickets ─────────────────────────────────────────────────────────

  const centralTicketSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    ticketno: { type: String, trim: true },
    title: { type: String, trim: true },
    details: { type: String, trim: true },
    startdatetime: { type: Date },
    status: { type: String, default: "Open" },
    priority: { type: String, trim: true },
    category: { type: String, trim: true },
    raisedby: { type: String, trim: true },
    raisedbyemail: { type: String, trim: true },
    raisedbyrole: { type: String, trim: true },
    assignedto: { type: String, trim: true },
    assignedtoemail: { type: String, trim: true },
    assignedat: { type: Date },
    firstresponseat: { type: Date },
    closedat: { type: Date },
    attachments: [{ type: mongoose.Schema.Types.Mixed }],
    user: { type: String, trim: true },
  }, { timestamps: true });
  const CentralTicketMcp = mongoose.models.CentralTicketMcp || mongoose.model("CentralTicketMcp", centralTicketSchema, "centralticketds");

  server.tool("list_central_tickets", "List central tickets filtered by colid", {
    status: z.string().optional(),
    raisedbyemail: z.string().optional(),
    assignedtoemail: z.string().optional(),
    priority: z.string().optional(),
    category: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.status) query.status = args.status;
    if (args.raisedbyemail) query.raisedbyemail = args.raisedbyemail;
    if (args.assignedtoemail) query.assignedtoemail = args.assignedtoemail;
    if (args.priority) query.priority = args.priority;
    if (args.category) query.category = args.category;
    const data = await CentralTicketMcp.find(query).sort({ createdAt: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_central_ticket", "Create a central ticket", {
    ticketno: z.string().optional(),
    title: z.string(),
    details: z.string().optional(),
    startdatetime: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    category: z.string().optional(),
    raisedby: z.string().optional(),
    raisedbyemail: z.string(),
    raisedbyrole: z.string().optional(),
    assignedto: z.string().optional(),
    assignedtoemail: z.string().optional(),
    attachments: z.array(z.any()).optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await CentralTicketMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_central_ticket", "Update any field of a central ticket by id", {
    id: z.string(),
    ticketno: z.string().optional(),
    title: z.string().optional(),
    details: z.string().optional(),
    startdatetime: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    category: z.string().optional(),
    raisedby: z.string().optional(),
    raisedbyemail: z.string().optional(),
    raisedbyrole: z.string().optional(),
    assignedto: z.string().optional(),
    assignedtoemail: z.string().optional(),
    assignedat: z.string().optional(),
    firstresponseat: z.string().optional(),
    closedat: z.string().optional(),
    attachments: z.array(z.any()).optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await CentralTicketMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Central Ticket Responses ────────────────────────────────────────────────

  const ticketResponseSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    ticketid: { type: mongoose.Schema.Types.ObjectId },
    ticketno: { type: String, trim: true },
    response: { type: String, trim: true },
    status: { type: String, trim: true },
    assignedto: { type: String, trim: true },
    assignedtoemail: { type: String, trim: true },
    respondedby: { type: String, trim: true },
    respondedbyemail: { type: String, trim: true },
    attachments: [{ type: mongoose.Schema.Types.Mixed }],
    user: { type: String, trim: true },
  }, { timestamps: true });
  const CentralTicketResponseMcp = mongoose.models.CentralTicketResponseMcp || mongoose.model("CentralTicketResponseMcp", ticketResponseSchema, "centralticketresponseds");

  server.tool("list_central_ticket_responses", "List central ticket responses filtered by colid", {
    ticketno: z.string().optional(),
    respondedbyemail: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.ticketno) query.ticketno = args.ticketno;
    if (args.respondedbyemail) query.respondedbyemail = args.respondedbyemail;
    const data = await CentralTicketResponseMcp.find(query).sort({ createdAt: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_central_ticket_response", "Create a central ticket response", {
    ticketno: z.string().optional(),
    response: z.string(),
    status: z.string().optional(),
    assignedto: z.string().optional(),
    assignedtoemail: z.string().optional(),
    respondedby: z.string().optional(),
    respondedbyemail: z.string(),
    attachments: z.array(z.any()).optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await CentralTicketResponseMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_central_ticket_response", "Update any field of a central ticket response by id", {
    id: z.string(),
    ticketno: z.string().optional(),
    response: z.string().optional(),
    status: z.string().optional(),
    assignedto: z.string().optional(),
    assignedtoemail: z.string().optional(),
    respondedby: z.string().optional(),
    respondedbyemail: z.string().optional(),
    attachments: z.array(z.any()).optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await CentralTicketResponseMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Visitor Management ──────────────────────────────────────────────────────

  const visitorSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    visitdate: { type: Date },
    gatepassno: { type: String, trim: true },
    visitorname: { type: String, trim: true },
    visitoremail: { type: String, trim: true },
    visitorphone: { type: String, trim: true },
    organization: { type: String, trim: true },
    visitoridtype: { type: String, trim: true },
    visitoridno: { type: String, trim: true },
    purpose: { type: String, trim: true },
    department: { type: String, trim: true },
    whomtomeet: { type: String, trim: true },
    whomtomeetemail: { type: String, trim: true },
    approvalstatus: { type: String, trim: true },
    approvedby: { type: String, trim: true },
    approvedbyemail: { type: String, trim: true },
    gate: { type: String, trim: true },
    passstatus: { type: String, trim: true },
    issuedby: { type: String, trim: true },
    issuedat: { type: Date },
    gatepassgenerated: { type: Boolean, default: false },
    intime: { type: String, trim: true },
    outtime: { type: String, trim: true },
    finalmeetingstatus: { type: String, trim: true },
    meetingdetails: { type: String, trim: true },
    meetingoutcome: { type: String, trim: true },
    vehicletype: { type: String, trim: true },
    vehicleno: { type: String, trim: true },
    drivername: { type: String, trim: true },
    remarks: { type: String, trim: true },
    status: { type: String, default: "Pending" },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const VisitorManagementMcp = mongoose.models.VisitorManagementMcp || mongoose.model("VisitorManagementMcp", visitorSchema, "visitormanagementds");

  server.tool("list_visitor_management", "List visitor management records filtered by colid", {
    visitoremail: z.string().optional(),
    whomtomeetemail: z.string().optional(),
    approvalstatus: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.visitoremail) query.visitoremail = args.visitoremail;
    if (args.whomtomeetemail) query.whomtomeetemail = args.whomtomeetemail;
    if (args.approvalstatus) query.approvalstatus = args.approvalstatus;
    if (args.status) query.status = args.status;
    const data = await VisitorManagementMcp.find(query).sort({ visitdate: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_visitor", "Create a visitor management record", {
    visitdate: z.string().optional(),
    gatepassno: z.string().optional(),
    visitorname: z.string(),
    visitoremail: z.string().optional(),
    visitorphone: z.string().optional(),
    organization: z.string().optional(),
    visitoridtype: z.string().optional(),
    visitoridno: z.string().optional(),
    purpose: z.string().optional(),
    department: z.string().optional(),
    whomtomeet: z.string().optional(),
    whomtomeetemail: z.string().optional(),
    approvalstatus: z.string().optional(),
    gate: z.string().optional(),
    vehicletype: z.string().optional(),
    vehicleno: z.string().optional(),
    drivername: z.string().optional(),
    remarks: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await VisitorManagementMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_visitor", "Update any field of a visitor management record by id", {
    id: z.string(),
    visitdate: z.string().optional(),
    gatepassno: z.string().optional(),
    visitorname: z.string().optional(),
    visitoremail: z.string().optional(),
    visitorphone: z.string().optional(),
    organization: z.string().optional(),
    visitoridtype: z.string().optional(),
    visitoridno: z.string().optional(),
    purpose: z.string().optional(),
    department: z.string().optional(),
    whomtomeet: z.string().optional(),
    whomtomeetemail: z.string().optional(),
    approvalstatus: z.string().optional(),
    approvedby: z.string().optional(),
    approvedbyemail: z.string().optional(),
    gate: z.string().optional(),
    passstatus: z.string().optional(),
    issuedby: z.string().optional(),
    issuedat: z.string().optional(),
    gatepassgenerated: z.boolean().optional(),
    intime: z.string().optional(),
    outtime: z.string().optional(),
    finalmeetingstatus: z.string().optional(),
    meetingdetails: z.string().optional(),
    meetingoutcome: z.string().optional(),
    vehicletype: z.string().optional(),
    vehicleno: z.string().optional(),
    drivername: z.string().optional(),
    remarks: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await VisitorManagementMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Visiting Faculty ────────────────────────────────────────────────────────

  const visitingFacultySchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    name: { type: String, trim: true },
    address: { type: String, trim: true },
    panno: { type: String, trim: true },
    profile: { type: String, trim: true },
    photolink: { type: String, trim: true },
    resumelink: { type: String, trim: true },
    documents: [{ type: mongoose.Schema.Types.Mixed }],
    department: { type: String, trim: true },
    paymode: { type: String, trim: true },
    amount: { type: Number, default: 0 },
    tds: { type: Number, default: 0 },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const VisitingFacultyMcp = mongoose.models.VisitingFacultyMcp || mongoose.model("VisitingFacultyMcp", visitingFacultySchema, "visitingfacultyds");

  server.tool("list_visiting_faculty", "List visiting faculty filtered by colid", {
    department: z.string().optional(),
    paymode: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.department) query.department = args.department;
    if (args.paymode) query.paymode = args.paymode;
    const data = await VisitingFacultyMcp.find(query).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_visiting_faculty", "Create a visiting faculty record", {
    name: z.string(),
    address: z.string().optional(),
    panno: z.string().optional(),
    profile: z.string().optional(),
    photolink: z.string().optional(),
    resumelink: z.string().optional(),
    documents: z.array(z.any()).optional(),
    department: z.string().optional(),
    paymode: z.string().optional(),
    amount: z.number().optional(),
    tds: z.number().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await VisitingFacultyMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_visiting_faculty", "Update any field of a visiting faculty record by id", {
    id: z.string(),
    name: z.string().optional(),
    address: z.string().optional(),
    panno: z.string().optional(),
    profile: z.string().optional(),
    photolink: z.string().optional(),
    resumelink: z.string().optional(),
    documents: z.array(z.any()).optional(),
    department: z.string().optional(),
    paymode: z.string().optional(),
    amount: z.number().optional(),
    tds: z.number().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await VisitingFacultyMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Visiting Faculty Classes ────────────────────────────────────────────────

  const visitingClassSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    facultyid: { type: mongoose.Schema.Types.ObjectId },
    facultyname: { type: String, trim: true },
    department: { type: String, trim: true },
    classdate: { type: Date },
    numberofclasses: { type: Number, default: 0 },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const VisitingFacultyClassMcp = mongoose.models.VisitingFacultyClassMcp || mongoose.model("VisitingFacultyClassMcp", visitingClassSchema, "visitingfacultyclassds");

  server.tool("list_visiting_faculty_classes", "List visiting faculty class records filtered by colid", {
    facultyname: z.string().optional(),
    department: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.facultyname) query.facultyname = args.facultyname;
    if (args.department) query.department = args.department;
    const data = await VisitingFacultyClassMcp.find(query).sort({ classdate: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_visiting_faculty_class", "Create a visiting faculty class record", {
    facultyname: z.string().optional(),
    department: z.string().optional(),
    classdate: z.string().optional(),
    numberofclasses: z.number().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await VisitingFacultyClassMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_visiting_faculty_class", "Update any field of a visiting faculty class record by id", {
    id: z.string(),
    facultyname: z.string().optional(),
    department: z.string().optional(),
    classdate: z.string().optional(),
    numberofclasses: z.number().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await VisitingFacultyClassMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Transport Drivers ───────────────────────────────────────────────────────

  const driverSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    licenseno: { type: String, trim: true },
    licenseexpiry: { type: Date },
    address: { type: String, trim: true },
    assignedvehicle: { type: String, trim: true },
    emergencycontact: { type: String, trim: true },
    status: { type: String, default: "Active" },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const TransportDriverMcp = mongoose.models.TransportDriverMcp || mongoose.model("TransportDriverMcp", driverSchema, "transportdriverds");

  server.tool("list_transport_drivers", "List transport drivers filtered by colid", {
    status: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.status) query.status = args.status;
    const data = await TransportDriverMcp.find(query).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_transport_driver", "Create a transport driver", {
    name: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    licenseno: z.string().optional(),
    licenseexpiry: z.string().optional(),
    address: z.string().optional(),
    assignedvehicle: z.string().optional(),
    emergencycontact: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await TransportDriverMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_transport_driver", "Update any field of a transport driver by id", {
    id: z.string(),
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    licenseno: z.string().optional(),
    licenseexpiry: z.string().optional(),
    address: z.string().optional(),
    assignedvehicle: z.string().optional(),
    emergencycontact: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await TransportDriverMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Transport Bus Passes ────────────────────────────────────────────────────

  const busPassSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    studentid: { type: mongoose.Schema.Types.ObjectId },
    student: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    regno: { type: String, trim: true },
    photo: { type: String, trim: true },
    institution: { type: String, trim: true },
    routeid: { type: String, trim: true },
    routename: { type: String, trim: true },
    routecode: { type: String, trim: true },
    semester: { type: String, trim: true },
    section: { type: String, trim: true },
    startdate: { type: Date },
    enddate: { type: Date },
    templateid: { type: String, trim: true },
    templatename: { type: String, trim: true },
    html: { type: String },
    status: { type: String, default: "Active" },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const TransportBusPassMcp = mongoose.models.TransportBusPassMcp || mongoose.model("TransportBusPassMcp", busPassSchema, "transportbuspassds");

  server.tool("list_transport_bus_passes", "List transport bus passes filtered by colid", {
    email: z.string().optional(),
    routeid: z.string().optional(),
    status: z.string().optional(),
    regno: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.email) query.email = args.email;
    if (args.routeid) query.routeid = args.routeid;
    if (args.status) query.status = args.status;
    if (args.regno) query.regno = args.regno;
    const data = await TransportBusPassMcp.find(query).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_transport_bus_pass", "Create a transport bus pass", {
    student: z.string().optional(),
    email: z.string(),
    phone: z.string().optional(),
    regno: z.string().optional(),
    photo: z.string().optional(),
    institution: z.string().optional(),
    routeid: z.string().optional(),
    routename: z.string().optional(),
    routecode: z.string().optional(),
    semester: z.string().optional(),
    section: z.string().optional(),
    startdate: z.string().optional(),
    enddate: z.string().optional(),
    templateid: z.string().optional(),
    templatename: z.string().optional(),
    html: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await TransportBusPassMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_transport_bus_pass", "Update any field of a transport bus pass by id", {
    id: z.string(),
    student: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    regno: z.string().optional(),
    photo: z.string().optional(),
    institution: z.string().optional(),
    routeid: z.string().optional(),
    routename: z.string().optional(),
    routecode: z.string().optional(),
    semester: z.string().optional(),
    section: z.string().optional(),
    startdate: z.string().optional(),
    enddate: z.string().optional(),
    templateid: z.string().optional(),
    templatename: z.string().optional(),
    html: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await TransportBusPassMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Transport Driver Roster ─────────────────────────────────────────────────

  const driverRosterSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    driverid: { type: mongoose.Schema.Types.ObjectId },
    drivername: { type: String, trim: true },
    driveremail: { type: String, trim: true },
    vehicle: { type: String, trim: true },
    vehicleno: { type: String, trim: true },
    route: { type: String, trim: true },
    dutytype: { type: String, trim: true },
    startdatetime: { type: Date },
    enddatetime: { type: Date },
    notes: { type: String, trim: true },
    status: { type: String, default: "Scheduled" },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const TransportDriverRosterMcp = mongoose.models.TransportDriverRosterMcp || mongoose.model("TransportDriverRosterMcp", driverRosterSchema, "transportdriverrosterds");

  server.tool("list_transport_driver_rosters", "List transport driver rosters filtered by colid", {
    driveremail: z.string().optional(),
    route: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.driveremail) query.driveremail = args.driveremail;
    if (args.route) query.route = args.route;
    if (args.status) query.status = args.status;
    const data = await TransportDriverRosterMcp.find(query).sort({ startdatetime: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_transport_driver_roster", "Create a transport driver roster entry", {
    drivername: z.string().optional(),
    driveremail: z.string().optional(),
    vehicle: z.string().optional(),
    vehicleno: z.string().optional(),
    route: z.string().optional(),
    dutytype: z.string().optional(),
    startdatetime: z.string().optional(),
    enddatetime: z.string().optional(),
    notes: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await TransportDriverRosterMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_transport_driver_roster", "Update any field of a transport driver roster entry by id", {
    id: z.string(),
    drivername: z.string().optional(),
    driveremail: z.string().optional(),
    vehicle: z.string().optional(),
    vehicleno: z.string().optional(),
    route: z.string().optional(),
    dutytype: z.string().optional(),
    startdatetime: z.string().optional(),
    enddatetime: z.string().optional(),
    notes: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await TransportDriverRosterMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Faculty Availability ────────────────────────────────────────────────────

  const facultyAvailSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    academicyear: { type: String, trim: true },
    facultyname: { type: String, trim: true },
    facultyemail: { type: String, trim: true },
    dayofweek: { type: String, trim: true },
    availabilitydate: { type: Date },
    dayofmonth: { type: Number, default: 0 },
    starttime: { type: String, trim: true },
    endtime: { type: String, trim: true },
    reason: { type: String, trim: true },
    remarks: { type: String, trim: true },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const FacultyAvailabilityMcp = mongoose.models.FacultyAvailabilityMcp || mongoose.model("FacultyAvailabilityMcp", facultyAvailSchema, "facultyavailabilityds");

  server.tool("list_faculty_availability", "List faculty availability records filtered by colid", {
    facultyemail: z.string().optional(),
    academicyear: z.string().optional(),
    dayofweek: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.facultyemail) query.facultyemail = args.facultyemail;
    if (args.academicyear) query.academicyear = args.academicyear;
    if (args.dayofweek) query.dayofweek = args.dayofweek;
    const data = await FacultyAvailabilityMcp.find(query).sort({ availabilitydate: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_faculty_availability", "Create a faculty availability record", {
    academicyear: z.string().optional(),
    facultyname: z.string().optional(),
    facultyemail: z.string(),
    dayofweek: z.string().optional(),
    availabilitydate: z.string().optional(),
    dayofmonth: z.number().optional(),
    starttime: z.string().optional(),
    endtime: z.string().optional(),
    reason: z.string().optional(),
    remarks: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await FacultyAvailabilityMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_faculty_availability", "Update any field of a faculty availability record by id", {
    id: z.string(),
    academicyear: z.string().optional(),
    facultyname: z.string().optional(),
    facultyemail: z.string().optional(),
    dayofweek: z.string().optional(),
    availabilitydate: z.string().optional(),
    dayofmonth: z.number().optional(),
    starttime: z.string().optional(),
    endtime: z.string().optional(),
    reason: z.string().optional(),
    remarks: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await FacultyAvailabilityMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Faculty Qualifications ──────────────────────────────────────────────────

  const facultyQualSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    user: { type: String, trim: true },
    useremail: { type: String, trim: true },
    subject: { type: String, trim: true },
    expertise: { type: String, trim: true },
    phd: { type: String, trim: true },
    createdby: { type: String, trim: true },
    createdbyname: { type: String, trim: true },
  }, { timestamps: true });
  const FacultyQualificationMcp = mongoose.models.FacultyQualificationMcp || mongoose.model("FacultyQualificationMcp", facultyQualSchema, "facultyqualificationds");

  server.tool("list_faculty_qualifications", "List faculty qualifications filtered by colid", {
    useremail: z.string().optional(),
    subject: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.useremail) query.useremail = args.useremail;
    if (args.subject) query.subject = args.subject;
    const data = await FacultyQualificationMcp.find(query).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_faculty_qualification", "Create a faculty qualification record", {
    user: z.string().optional(),
    useremail: z.string(),
    subject: z.string().optional(),
    expertise: z.string().optional(),
    phd: z.string().optional(),
    createdby: z.string().optional(),
    createdbyname: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await FacultyQualificationMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_faculty_qualification", "Update any field of a faculty qualification record by id", {
    id: z.string(),
    user: z.string().optional(),
    useremail: z.string().optional(),
    subject: z.string().optional(),
    expertise: z.string().optional(),
    phd: z.string().optional(),
    createdby: z.string().optional(),
    createdbyname: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await FacultyQualificationMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Live Meetings ───────────────────────────────────────────────────────────

  const liveMeetingSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    hostName: { type: String, trim: true },
    hostEmail: { type: String, trim: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    startDateTime: { type: Date },
    endDateTime: { type: Date },
    internalParticipants: [{ type: mongoose.Schema.Types.Mixed }],
    internalParticipantEmails: [{ type: String }],
    externalParticipants: [{ type: mongoose.Schema.Types.Mixed }],
    externalParticipantEmails: [{ type: String }],
    publicJoinToken: { type: String, trim: true },
    meetingLink: { type: String, trim: true },
    externalMeetingLink: { type: String, trim: true },
    status: { type: String, default: "Scheduled" },
    createdBy: { type: String, trim: true },
  }, { timestamps: true });
  const LiveMeetingMcp = mongoose.models.LiveMeetingMcp || mongoose.model("LiveMeetingMcp", liveMeetingSchema, "livemeetingds");

  server.tool("list_live_meetings", "List live meetings filtered by colid", {
    hostEmail: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.hostEmail) query.hostEmail = args.hostEmail;
    if (args.status) query.status = args.status;
    const data = await LiveMeetingMcp.find(query).sort({ startDateTime: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_live_meeting", "Create a live meeting", {
    hostName: z.string().optional(),
    hostEmail: z.string(),
    title: z.string(),
    description: z.string().optional(),
    startDateTime: z.string().optional(),
    endDateTime: z.string().optional(),
    internalParticipants: z.array(z.any()).optional(),
    internalParticipantEmails: z.array(z.string()).optional(),
    externalParticipants: z.array(z.any()).optional(),
    externalParticipantEmails: z.array(z.string()).optional(),
    publicJoinToken: z.string().optional(),
    meetingLink: z.string().optional(),
    externalMeetingLink: z.string().optional(),
    status: z.string().optional(),
    createdBy: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await LiveMeetingMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_live_meeting", "Update any field of a live meeting by id", {
    id: z.string(),
    hostName: z.string().optional(),
    hostEmail: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    startDateTime: z.string().optional(),
    endDateTime: z.string().optional(),
    internalParticipants: z.array(z.any()).optional(),
    internalParticipantEmails: z.array(z.string()).optional(),
    externalParticipants: z.array(z.any()).optional(),
    externalParticipantEmails: z.array(z.string()).optional(),
    publicJoinToken: z.string().optional(),
    meetingLink: z.string().optional(),
    externalMeetingLink: z.string().optional(),
    status: z.string().optional(),
    createdBy: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await LiveMeetingMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });
}
