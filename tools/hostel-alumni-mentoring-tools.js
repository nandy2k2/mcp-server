import { z } from "zod";
import mongoose from "mongoose";

export function registerHostelAlumniMentoringTools(server, { requireAuth, resolveColid, connectDB }) {

  // ── Hostel Room Map ─────────────────────────────────────────────────────────

  const hostelRoomSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    buildingid: { type: String, trim: true },
    buildingname: { type: String, trim: true },
    hosteltype: { type: String, trim: true },
    guesttype: { type: String, trim: true },
    block: { type: String, trim: true },
    floor: { type: String, trim: true },
    roomno: { type: String, trim: true },
    roomtype: { type: String, trim: true },
    roomrentpermonth: { type: Number, default: 0 },
    noofbeds: { type: Number, default: 0 },
    residenttype: { type: String, trim: true },
    status: { type: String, default: "Active" },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const HostelRoomMapMcp = mongoose.models.HostelRoomMapMcp || mongoose.model("HostelRoomMapMcp", hostelRoomSchema, "hostelroommapds");

  server.tool("list_hostel_rooms", "List hostel rooms filtered by colid", {
    buildingid: z.string().optional(),
    hosteltype: z.string().optional(),
    roomtype: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.buildingid) query.buildingid = args.buildingid;
    if (args.hosteltype) query.hosteltype = args.hosteltype;
    if (args.roomtype) query.roomtype = args.roomtype;
    if (args.status) query.status = args.status;
    const data = await HostelRoomMapMcp.find(query).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_hostel_room", "Create a hostel room record", {
    buildingid: z.string().optional(),
    buildingname: z.string().optional(),
    hosteltype: z.string().optional(),
    guesttype: z.string().optional(),
    block: z.string().optional(),
    floor: z.string().optional(),
    roomno: z.string(),
    roomtype: z.string().optional(),
    roomrentpermonth: z.number().optional(),
    noofbeds: z.number().optional(),
    residenttype: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await HostelRoomMapMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_hostel_room", "Update any field of a hostel room by id", {
    id: z.string(),
    buildingid: z.string().optional(),
    buildingname: z.string().optional(),
    hosteltype: z.string().optional(),
    guesttype: z.string().optional(),
    block: z.string().optional(),
    floor: z.string().optional(),
    roomno: z.string().optional(),
    roomtype: z.string().optional(),
    roomrentpermonth: z.number().optional(),
    noofbeds: z.number().optional(),
    residenttype: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await HostelRoomMapMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Hostel Bed Assignment Map ───────────────────────────────────────────────

  const bedAssignSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    buildingid: { type: String, trim: true },
    roomid: { type: String, trim: true },
    buildingname: { type: String, trim: true },
    hosteltype: { type: String, trim: true },
    guesttype: { type: String, trim: true },
    block: { type: String, trim: true },
    floor: { type: String, trim: true },
    roomno: { type: String, trim: true },
    roomtype: { type: String, trim: true },
    bedno: { type: String, trim: true },
    residenttype: { type: String, trim: true },
    studentid: { type: String, trim: true },
    student: { type: String, trim: true },
    studentemail: { type: String, trim: true },
    studentphone: { type: String, trim: true },
    programcode: { type: String, trim: true },
    program: { type: String, trim: true },
    regno: { type: String, trim: true },
    status: { type: String, default: "Active" },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const HostelBedAssignmentMcp = mongoose.models.HostelBedAssignmentMcp || mongoose.model("HostelBedAssignmentMcp", bedAssignSchema, "hostelbedassignmentmapds");

  server.tool("list_hostel_bed_assignments", "List hostel bed assignments filtered by colid", {
    buildingid: z.string().optional(),
    roomno: z.string().optional(),
    studentemail: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.buildingid) query.buildingid = args.buildingid;
    if (args.roomno) query.roomno = args.roomno;
    if (args.studentemail) query.studentemail = args.studentemail;
    if (args.status) query.status = args.status;
    const data = await HostelBedAssignmentMcp.find(query).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_hostel_bed_assignment", "Create a hostel bed assignment", {
    buildingid: z.string().optional(),
    roomid: z.string().optional(),
    buildingname: z.string().optional(),
    hosteltype: z.string().optional(),
    guesttype: z.string().optional(),
    block: z.string().optional(),
    floor: z.string().optional(),
    roomno: z.string(),
    roomtype: z.string().optional(),
    bedno: z.string().optional(),
    residenttype: z.string().optional(),
    studentid: z.string().optional(),
    student: z.string().optional(),
    studentemail: z.string(),
    studentphone: z.string().optional(),
    programcode: z.string().optional(),
    program: z.string().optional(),
    regno: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await HostelBedAssignmentMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_hostel_bed_assignment", "Update any field of a hostel bed assignment by id", {
    id: z.string(),
    buildingid: z.string().optional(),
    roomid: z.string().optional(),
    buildingname: z.string().optional(),
    hosteltype: z.string().optional(),
    guesttype: z.string().optional(),
    block: z.string().optional(),
    floor: z.string().optional(),
    roomno: z.string().optional(),
    roomtype: z.string().optional(),
    bedno: z.string().optional(),
    residenttype: z.string().optional(),
    studentid: z.string().optional(),
    student: z.string().optional(),
    studentemail: z.string().optional(),
    studentphone: z.string().optional(),
    programcode: z.string().optional(),
    program: z.string().optional(),
    regno: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await HostelBedAssignmentMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Hostel Bed Requests ─────────────────────────────────────────────────────

  const bedRequestSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    buildingid: { type: String, trim: true },
    roomid: { type: String, trim: true },
    buildingname: { type: String, trim: true },
    hosteltype: { type: String, trim: true },
    guesttype: { type: String, trim: true },
    block: { type: String, trim: true },
    floor: { type: String, trim: true },
    roomno: { type: String, trim: true },
    roomtype: { type: String, trim: true },
    residenttype: { type: String, trim: true },
    bedno: { type: String, trim: true },
    studentid: { type: String, trim: true },
    student: { type: String, trim: true },
    studentemail: { type: String, trim: true },
    studentphone: { type: String, trim: true },
    program: { type: String, trim: true },
    programcode: { type: String, trim: true },
    regno: { type: String, trim: true },
    status: { type: String, default: "Pending" },
    applieddate: { type: Date },
    approveddate: { type: Date },
    approvedby: { type: String, trim: true },
    comments: { type: String, trim: true },
    assignmentid: { type: mongoose.Schema.Types.ObjectId },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const HostelBedRequestMcp = mongoose.models.HostelBedRequestMcp || mongoose.model("HostelBedRequestMcp", bedRequestSchema, "hostelbedrequestds");

  server.tool("list_hostel_bed_requests", "List hostel bed requests filtered by colid", {
    studentemail: z.string().optional(),
    status: z.string().optional(),
    hosteltype: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.studentemail) query.studentemail = args.studentemail;
    if (args.status) query.status = args.status;
    if (args.hosteltype) query.hosteltype = args.hosteltype;
    const data = await HostelBedRequestMcp.find(query).sort({ createdAt: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_hostel_bed_request", "Create a hostel bed request", {
    buildingid: z.string().optional(),
    roomid: z.string().optional(),
    buildingname: z.string().optional(),
    hosteltype: z.string().optional(),
    guesttype: z.string().optional(),
    block: z.string().optional(),
    floor: z.string().optional(),
    roomno: z.string().optional(),
    roomtype: z.string().optional(),
    residenttype: z.string().optional(),
    bedno: z.string().optional(),
    studentid: z.string().optional(),
    student: z.string().optional(),
    studentemail: z.string(),
    studentphone: z.string().optional(),
    program: z.string().optional(),
    programcode: z.string().optional(),
    regno: z.string().optional(),
    status: z.string().optional(),
    applieddate: z.string().optional(),
    comments: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await HostelBedRequestMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_hostel_bed_request", "Update any field of a hostel bed request by id", {
    id: z.string(),
    buildingid: z.string().optional(),
    roomid: z.string().optional(),
    buildingname: z.string().optional(),
    hosteltype: z.string().optional(),
    guesttype: z.string().optional(),
    block: z.string().optional(),
    floor: z.string().optional(),
    roomno: z.string().optional(),
    roomtype: z.string().optional(),
    residenttype: z.string().optional(),
    bedno: z.string().optional(),
    studentid: z.string().optional(),
    student: z.string().optional(),
    studentemail: z.string().optional(),
    studentphone: z.string().optional(),
    program: z.string().optional(),
    programcode: z.string().optional(),
    regno: z.string().optional(),
    status: z.string().optional(),
    applieddate: z.string().optional(),
    approveddate: z.string().optional(),
    approvedby: z.string().optional(),
    comments: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await HostelBedRequestMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Alumni New Profiles ─────────────────────────────────────────────────────

  const alumniProfileSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    userid: { type: mongoose.Schema.Types.ObjectId },
    useremail: { type: String, trim: true },
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    photo: { type: String, trim: true },
    company: { type: String, trim: true },
    designation: { type: String, trim: true },
    sector: { type: String, trim: true },
    industry: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
    linkedin: { type: String, trim: true },
    website: { type: String, trim: true },
    skills: { type: String, trim: true },
    professionalsummary: { type: String, trim: true },
    currentstatus: { type: String, trim: true },
    allowsearch: { type: Boolean, default: true },
    status: { type: String, default: "Active" },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const AlumniNewProfileMcp = mongoose.models.AlumniNewProfileMcp || mongoose.model("AlumniNewProfileMcp", alumniProfileSchema, "alumninewprofileds");

  server.tool("list_alumni_profiles", "List alumni profiles filtered by colid", {
    useremail: z.string().optional(),
    company: z.string().optional(),
    industry: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.useremail) query.useremail = args.useremail;
    if (args.company) query.company = args.company;
    if (args.industry) query.industry = args.industry;
    if (args.status) query.status = args.status;
    const data = await AlumniNewProfileMcp.find(query).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_alumni_profile", "Create an alumni profile", {
    useremail: z.string(),
    name: z.string().optional(),
    phone: z.string().optional(),
    photo: z.string().optional(),
    company: z.string().optional(),
    designation: z.string().optional(),
    sector: z.string().optional(),
    industry: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    linkedin: z.string().optional(),
    website: z.string().optional(),
    skills: z.string().optional(),
    professionalsummary: z.string().optional(),
    currentstatus: z.string().optional(),
    allowsearch: z.boolean().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await AlumniNewProfileMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_alumni_profile", "Update any field of an alumni profile by id", {
    id: z.string(),
    useremail: z.string().optional(),
    name: z.string().optional(),
    phone: z.string().optional(),
    photo: z.string().optional(),
    company: z.string().optional(),
    designation: z.string().optional(),
    sector: z.string().optional(),
    industry: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    linkedin: z.string().optional(),
    website: z.string().optional(),
    skills: z.string().optional(),
    professionalsummary: z.string().optional(),
    currentstatus: z.string().optional(),
    allowsearch: z.boolean().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await AlumniNewProfileMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Alumni Events ───────────────────────────────────────────────────────────

  const alumniEventSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    eventdate: { type: Date },
    starttime: { type: String, trim: true },
    venue: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    registrationstart: { type: Date },
    registrationend: { type: Date },
    status: { type: String, default: "Active" },
    createdby: { type: String, trim: true },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const AlumniNewEventMcp = mongoose.models.AlumniNewEventMcp || mongoose.model("AlumniNewEventMcp", alumniEventSchema, "alumnineweventds");

  server.tool("list_alumni_events", "List alumni events filtered by colid", {
    status: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.status) query.status = args.status;
    const data = await AlumniNewEventMcp.find(query).sort({ eventdate: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_alumni_event", "Create an alumni event", {
    title: z.string(),
    description: z.string().optional(),
    eventdate: z.string().optional(),
    starttime: z.string().optional(),
    venue: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    registrationstart: z.string().optional(),
    registrationend: z.string().optional(),
    status: z.string().optional(),
    createdby: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await AlumniNewEventMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_alumni_event", "Update any field of an alumni event by id", {
    id: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    eventdate: z.string().optional(),
    starttime: z.string().optional(),
    venue: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    registrationstart: z.string().optional(),
    registrationend: z.string().optional(),
    status: z.string().optional(),
    createdby: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await AlumniNewEventMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Alumni Event Registrations ──────────────────────────────────────────────

  const alumniEventRegSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    eventid: { type: mongoose.Schema.Types.ObjectId },
    eventtitle: { type: String, trim: true },
    alumniemail: { type: String, trim: true },
    alumniname: { type: String, trim: true },
    phone: { type: String, trim: true },
    status: { type: String, default: "Registered" },
    registeredat: { type: Date, default: Date.now },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const AlumniNewEventRegMcp = mongoose.models.AlumniNewEventRegMcp || mongoose.model("AlumniNewEventRegMcp", alumniEventRegSchema, "alumnineweventregistrationds");

  server.tool("list_alumni_event_registrations", "List alumni event registrations filtered by colid", {
    alumniemail: z.string().optional(),
    eventtitle: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.alumniemail) query.alumniemail = args.alumniemail;
    if (args.eventtitle) query.eventtitle = args.eventtitle;
    if (args.status) query.status = args.status;
    const data = await AlumniNewEventRegMcp.find(query).sort({ registeredat: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_alumni_event_registration", "Create an alumni event registration", {
    eventtitle: z.string().optional(),
    alumniemail: z.string(),
    alumniname: z.string().optional(),
    phone: z.string().optional(),
    status: z.string().optional(),
    registeredat: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await AlumniNewEventRegMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_alumni_event_registration", "Update any field of an alumni event registration by id", {
    id: z.string(),
    eventtitle: z.string().optional(),
    alumniemail: z.string().optional(),
    alumniname: z.string().optional(),
    phone: z.string().optional(),
    status: z.string().optional(),
    registeredat: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await AlumniNewEventRegMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Alumni Job Posts ────────────────────────────────────────────────────────

  const alumniJobSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    alumniemail: { type: String, trim: true },
    alumniname: { type: String, trim: true },
    type: { type: String, trim: true },
    title: { type: String, trim: true },
    company: { type: String, trim: true },
    sector: { type: String, trim: true },
    industry: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    location: { type: String, trim: true },
    description: { type: String, trim: true },
    eligibility: { type: String, trim: true },
    applylink: { type: String, trim: true },
    contactemail: { type: String, trim: true },
    startdate: { type: Date },
    enddate: { type: Date },
    status: { type: String, default: "Active" },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const AlumniNewJobPostMcp = mongoose.models.AlumniNewJobPostMcp || mongoose.model("AlumniNewJobPostMcp", alumniJobSchema, "alumninewjobpostds");

  server.tool("list_alumni_job_posts", "List alumni job posts filtered by colid", {
    alumniemail: z.string().optional(),
    type: z.string().optional(),
    industry: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.alumniemail) query.alumniemail = args.alumniemail;
    if (args.type) query.type = args.type;
    if (args.industry) query.industry = args.industry;
    if (args.status) query.status = args.status;
    const data = await AlumniNewJobPostMcp.find(query).sort({ createdAt: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_alumni_job_post", "Create an alumni job post", {
    alumniemail: z.string(),
    alumniname: z.string().optional(),
    type: z.string().optional(),
    title: z.string(),
    company: z.string().optional(),
    sector: z.string().optional(),
    industry: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    eligibility: z.string().optional(),
    applylink: z.string().optional(),
    contactemail: z.string().optional(),
    startdate: z.string().optional(),
    enddate: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await AlumniNewJobPostMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_alumni_job_post", "Update any field of an alumni job post by id", {
    id: z.string(),
    alumniemail: z.string().optional(),
    alumniname: z.string().optional(),
    type: z.string().optional(),
    title: z.string().optional(),
    company: z.string().optional(),
    sector: z.string().optional(),
    industry: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    eligibility: z.string().optional(),
    applylink: z.string().optional(),
    contactemail: z.string().optional(),
    startdate: z.string().optional(),
    enddate: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await AlumniNewJobPostMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Alumni Messages ─────────────────────────────────────────────────────────

  const alumniMessageSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    alumniemail: { type: String, trim: true },
    alumniname: { type: String, trim: true },
    studentemail: { type: String, trim: true },
    studentregno: { type: String, trim: true },
    studentname: { type: String, trim: true },
    subject: { type: String, trim: true },
    messages: [{ type: mongoose.Schema.Types.Mixed }],
    status: { type: String, default: "Active" },
    lastmessageat: { type: Date },
  }, { timestamps: true });
  const AlumniNewMessageMcp = mongoose.models.AlumniNewMessageMcp || mongoose.model("AlumniNewMessageMcp", alumniMessageSchema, "alumninewmessageds");

  server.tool("list_alumni_messages", "List alumni messages filtered by colid", {
    alumniemail: z.string().optional(),
    studentemail: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.alumniemail) query.alumniemail = args.alumniemail;
    if (args.studentemail) query.studentemail = args.studentemail;
    if (args.status) query.status = args.status;
    const data = await AlumniNewMessageMcp.find(query).sort({ lastmessageat: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_alumni_message", "Create an alumni message thread", {
    alumniemail: z.string(),
    alumniname: z.string().optional(),
    studentemail: z.string().optional(),
    studentregno: z.string().optional(),
    studentname: z.string().optional(),
    subject: z.string().optional(),
    messages: z.array(z.any()).optional(),
    status: z.string().optional(),
    lastmessageat: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await AlumniNewMessageMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_alumni_message", "Update any field of an alumni message thread by id", {
    id: z.string(),
    alumniemail: z.string().optional(),
    alumniname: z.string().optional(),
    studentemail: z.string().optional(),
    studentregno: z.string().optional(),
    studentname: z.string().optional(),
    subject: z.string().optional(),
    messages: z.array(z.any()).optional(),
    status: z.string().optional(),
    lastmessageat: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await AlumniNewMessageMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Mentoring Workspaces ────────────────────────────────────────────────────

  const mentoringWorkspaceSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    groupname: { type: String, trim: true },
    description: { type: String, trim: true },
    facultyname: { type: String, trim: true },
    facultyemail: { type: String, trim: true },
    academicyear: { type: String, trim: true },
    regulation: { type: String, trim: true },
    program: { type: String, trim: true },
    programcode: { type: String, trim: true },
    semester: { type: String, trim: true },
    section: { type: String, trim: true },
    major: { type: String, trim: true },
    minor: { type: String, trim: true },
    students: [{ type: mongoose.Schema.Types.Mixed }],
    status: { type: String, default: "Active" },
    createdby: { type: String, trim: true },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const MentoringWorkspaceMcp = mongoose.models.MentoringWorkspaceMcp || mongoose.model("MentoringWorkspaceMcp", mentoringWorkspaceSchema, "mentoringworkspaceds");

  server.tool("list_mentoring_workspaces", "List mentoring workspaces filtered by colid", {
    facultyemail: z.string().optional(),
    academicyear: z.string().optional(),
    programcode: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.facultyemail) query.facultyemail = args.facultyemail;
    if (args.academicyear) query.academicyear = args.academicyear;
    if (args.programcode) query.programcode = args.programcode;
    if (args.status) query.status = args.status;
    const data = await MentoringWorkspaceMcp.find(query).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_mentoring_workspace", "Create a mentoring workspace", {
    groupname: z.string(),
    description: z.string().optional(),
    facultyname: z.string().optional(),
    facultyemail: z.string(),
    academicyear: z.string().optional(),
    regulation: z.string().optional(),
    program: z.string().optional(),
    programcode: z.string().optional(),
    semester: z.string().optional(),
    section: z.string().optional(),
    major: z.string().optional(),
    minor: z.string().optional(),
    students: z.array(z.any()).optional(),
    status: z.string().optional(),
    createdby: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await MentoringWorkspaceMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_mentoring_workspace", "Update any field of a mentoring workspace by id", {
    id: z.string(),
    groupname: z.string().optional(),
    description: z.string().optional(),
    facultyname: z.string().optional(),
    facultyemail: z.string().optional(),
    academicyear: z.string().optional(),
    regulation: z.string().optional(),
    program: z.string().optional(),
    programcode: z.string().optional(),
    semester: z.string().optional(),
    section: z.string().optional(),
    major: z.string().optional(),
    minor: z.string().optional(),
    students: z.array(z.any()).optional(),
    status: z.string().optional(),
    createdby: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await MentoringWorkspaceMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Mentoring Sessions ──────────────────────────────────────────────────────

  const mentoringSessionSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    academicyear: { type: String, trim: true },
    faculty: { type: String, trim: true },
    facultyemail: { type: String, trim: true },
    student: { type: String, trim: true },
    regno: { type: String, trim: true },
    activity: { type: String, trim: true },
    activitydate: { type: Date },
    description: { type: String, trim: true },
    status: { type: String, default: "Active" },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const MentoringSessionMcp = mongoose.models.MentoringSessionMcp || mongoose.model("MentoringSessionMcp", mentoringSessionSchema, "mentoringsessionds");

  server.tool("list_mentoring_sessions", "List mentoring sessions filtered by colid", {
    facultyemail: z.string().optional(),
    regno: z.string().optional(),
    academicyear: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.facultyemail) query.facultyemail = args.facultyemail;
    if (args.regno) query.regno = args.regno;
    if (args.academicyear) query.academicyear = args.academicyear;
    const data = await MentoringSessionMcp.find(query).sort({ activitydate: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_mentoring_session", "Create a mentoring session", {
    academicyear: z.string().optional(),
    faculty: z.string().optional(),
    facultyemail: z.string(),
    student: z.string().optional(),
    regno: z.string().optional(),
    activity: z.string().optional(),
    activitydate: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await MentoringSessionMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_mentoring_session", "Update any field of a mentoring session by id", {
    id: z.string(),
    academicyear: z.string().optional(),
    faculty: z.string().optional(),
    facultyemail: z.string().optional(),
    student: z.string().optional(),
    regno: z.string().optional(),
    activity: z.string().optional(),
    activitydate: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await MentoringSessionMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Mentoring Home Visits ───────────────────────────────────────────────────

  const homeVisitSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    academicyear: { type: String, trim: true },
    faculty: { type: String, trim: true },
    facultyemail: { type: String, trim: true },
    student: { type: String, trim: true },
    regno: { type: String, trim: true },
    activity: { type: String, trim: true },
    activitydate: { type: Date },
    description: { type: String, trim: true },
    status: { type: String, default: "Active" },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const MentoringHomeVisitMcp = mongoose.models.MentoringHomeVisitMcp || mongoose.model("MentoringHomeVisitMcp", homeVisitSchema, "mentoringhomevisitds");

  server.tool("list_mentoring_home_visits", "List mentoring home visits filtered by colid", {
    facultyemail: z.string().optional(),
    regno: z.string().optional(),
    academicyear: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.facultyemail) query.facultyemail = args.facultyemail;
    if (args.regno) query.regno = args.regno;
    if (args.academicyear) query.academicyear = args.academicyear;
    const data = await MentoringHomeVisitMcp.find(query).sort({ activitydate: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_mentoring_home_visit", "Create a mentoring home visit record", {
    academicyear: z.string().optional(),
    faculty: z.string().optional(),
    facultyemail: z.string(),
    student: z.string().optional(),
    regno: z.string().optional(),
    activity: z.string().optional(),
    activitydate: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await MentoringHomeVisitMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_mentoring_home_visit", "Update any field of a mentoring home visit by id", {
    id: z.string(),
    academicyear: z.string().optional(),
    faculty: z.string().optional(),
    facultyemail: z.string().optional(),
    student: z.string().optional(),
    regno: z.string().optional(),
    activity: z.string().optional(),
    activitydate: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await MentoringHomeVisitMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Mentoring Sports Activities ─────────────────────────────────────────────

  const sportsSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    academicyear: { type: String, trim: true },
    program: { type: String, trim: true },
    programcode: { type: String, trim: true },
    student: { type: String, trim: true },
    regno: { type: String, trim: true },
    activitytype: { type: String, trim: true },
    activitydate: { type: Date },
    activityname: { type: String, trim: true },
    venue: { type: String, trim: true },
    location: { type: String, trim: true },
    prizewon: { type: String, trim: true },
    source: { type: String, trim: true },
    status: { type: String, default: "Active" },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const MentoringSportsActivityMcp = mongoose.models.MentoringSportsActivityMcp || mongoose.model("MentoringSportsActivityMcp", sportsSchema, "mentoringsportsactivityds");

  server.tool("list_mentoring_sports_activities", "List mentoring sports activities filtered by colid", {
    regno: z.string().optional(),
    academicyear: z.string().optional(),
    activitytype: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.regno) query.regno = args.regno;
    if (args.academicyear) query.academicyear = args.academicyear;
    if (args.activitytype) query.activitytype = args.activitytype;
    const data = await MentoringSportsActivityMcp.find(query).sort({ activitydate: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_mentoring_sports_activity", "Create a mentoring sports activity record", {
    academicyear: z.string().optional(),
    program: z.string().optional(),
    programcode: z.string().optional(),
    student: z.string().optional(),
    regno: z.string(),
    activitytype: z.string().optional(),
    activitydate: z.string().optional(),
    activityname: z.string().optional(),
    venue: z.string().optional(),
    location: z.string().optional(),
    prizewon: z.string().optional(),
    source: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await MentoringSportsActivityMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_mentoring_sports_activity", "Update any field of a mentoring sports activity by id", {
    id: z.string(),
    academicyear: z.string().optional(),
    program: z.string().optional(),
    programcode: z.string().optional(),
    student: z.string().optional(),
    regno: z.string().optional(),
    activitytype: z.string().optional(),
    activitydate: z.string().optional(),
    activityname: z.string().optional(),
    venue: z.string().optional(),
    location: z.string().optional(),
    prizewon: z.string().optional(),
    source: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await MentoringSportsActivityMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Mentoring Cultural Activities ───────────────────────────────────────────

  const culturalSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    academicyear: { type: String, trim: true },
    program: { type: String, trim: true },
    programcode: { type: String, trim: true },
    student: { type: String, trim: true },
    regno: { type: String, trim: true },
    activitytype: { type: String, trim: true },
    activitydate: { type: Date },
    activityname: { type: String, trim: true },
    venue: { type: String, trim: true },
    location: { type: String, trim: true },
    prizewon: { type: String, trim: true },
    source: { type: String, trim: true },
    status: { type: String, default: "Active" },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const MentoringCulturalActivityMcp = mongoose.models.MentoringCulturalActivityMcp || mongoose.model("MentoringCulturalActivityMcp", culturalSchema, "mentoringculturalactivityds");

  server.tool("list_mentoring_cultural_activities", "List mentoring cultural activities filtered by colid", {
    regno: z.string().optional(),
    academicyear: z.string().optional(),
    activitytype: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.regno) query.regno = args.regno;
    if (args.academicyear) query.academicyear = args.academicyear;
    if (args.activitytype) query.activitytype = args.activitytype;
    const data = await MentoringCulturalActivityMcp.find(query).sort({ activitydate: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_mentoring_cultural_activity", "Create a mentoring cultural activity record", {
    academicyear: z.string().optional(),
    program: z.string().optional(),
    programcode: z.string().optional(),
    student: z.string().optional(),
    regno: z.string(),
    activitytype: z.string().optional(),
    activitydate: z.string().optional(),
    activityname: z.string().optional(),
    venue: z.string().optional(),
    location: z.string().optional(),
    prizewon: z.string().optional(),
    source: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await MentoringCulturalActivityMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_mentoring_cultural_activity", "Update any field of a mentoring cultural activity by id", {
    id: z.string(),
    academicyear: z.string().optional(),
    program: z.string().optional(),
    programcode: z.string().optional(),
    student: z.string().optional(),
    regno: z.string().optional(),
    activitytype: z.string().optional(),
    activitydate: z.string().optional(),
    activityname: z.string().optional(),
    venue: z.string().optional(),
    location: z.string().optional(),
    prizewon: z.string().optional(),
    source: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await MentoringCulturalActivityMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── Mentoring Messages ──────────────────────────────────────────────────────

  const mentoringMsgSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    workspaceid: { type: mongoose.Schema.Types.ObjectId },
    senderrole: { type: String, trim: true },
    sendername: { type: String, trim: true },
    senderemail: { type: String, trim: true },
    regno: { type: String, trim: true },
    itemtype: { type: String, trim: true },
    message: { type: String, trim: true },
    title: { type: String, trim: true },
    url: { type: String, trim: true },
  }, { timestamps: true });
  const MentoringMessageMcp = mongoose.models.MentoringMessageMcp || mongoose.model("MentoringMessageMcp", mentoringMsgSchema, "mentoringmessageds");

  server.tool("list_mentoring_messages", "List mentoring messages filtered by colid", {
    senderemail: z.string().optional(),
    regno: z.string().optional(),
    senderrole: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.senderemail) query.senderemail = args.senderemail;
    if (args.regno) query.regno = args.regno;
    if (args.senderrole) query.senderrole = args.senderrole;
    const data = await MentoringMessageMcp.find(query).sort({ createdAt: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_mentoring_message", "Create a mentoring message", {
    senderrole: z.string().optional(),
    sendername: z.string().optional(),
    senderemail: z.string(),
    regno: z.string().optional(),
    itemtype: z.string().optional(),
    message: z.string().optional(),
    title: z.string().optional(),
    url: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await MentoringMessageMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_mentoring_message", "Update any field of a mentoring message by id", {
    id: z.string(),
    senderrole: z.string().optional(),
    sendername: z.string().optional(),
    senderemail: z.string().optional(),
    regno: z.string().optional(),
    itemtype: z.string().optional(),
    message: z.string().optional(),
    title: z.string().optional(),
    url: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await MentoringMessageMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });
}
