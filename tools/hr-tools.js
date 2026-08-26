import { z } from "zod";
import mongoose from "mongoose";

export function registerHrTools(server, { requireAuth, resolveColid, connectDB }) {

  // ── HR Leave Types ──────────────────────────────────────────────────────────

  const leaveTypeSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    leavetype: { type: String, trim: true },
    leavetypecategory: { type: String, trim: true },
    code: { type: String, trim: true },
    description: { type: String, trim: true },
    roles: [{ type: String }],
    annualquota: { type: Number, default: 0 },
    documentrequired: { type: Boolean, default: false },
    carryforwardcriteria: { type: String, trim: true },
    carryforwardmaxdays: { type: Number, default: 0 },
    carryforwardpercentage: { type: Number, default: 0 },
    status: { type: String, default: "Active" },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const HrLeaveTypeMcp = mongoose.models.HrLeaveTypeMcp || mongoose.model("HrLeaveTypeMcp", leaveTypeSchema, "hrleavetypeds");

  server.tool("list_hr_leave_types", "List HR leave types filtered by colid", {
    status: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.status) query.status = args.status;
    const data = await HrLeaveTypeMcp.find(query).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_hr_leave_type", "Create a new HR leave type", {
    leavetype: z.string(),
    leavetypecategory: z.string().optional(),
    code: z.string().optional(),
    description: z.string().optional(),
    roles: z.array(z.string()).optional(),
    annualquota: z.number().optional(),
    documentrequired: z.boolean().optional(),
    carryforwardcriteria: z.string().optional(),
    carryforwardmaxdays: z.number().optional(),
    carryforwardpercentage: z.number().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await HrLeaveTypeMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_hr_leave_type", "Update any field of an HR leave type by id", {
    id: z.string(),
    leavetype: z.string().optional(),
    leavetypecategory: z.string().optional(),
    code: z.string().optional(),
    description: z.string().optional(),
    roles: z.array(z.string()).optional(),
    annualquota: z.number().optional(),
    documentrequired: z.boolean().optional(),
    carryforwardcriteria: z.string().optional(),
    carryforwardmaxdays: z.number().optional(),
    carryforwardpercentage: z.number().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await HrLeaveTypeMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── HR Leave Balance ────────────────────────────────────────────────────────

  const leaveBalanceSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    cyclename: { type: String, trim: true },
    employeename: { type: String, trim: true },
    employeeemail: { type: String, trim: true },
    department: { type: String, trim: true },
    leavetype: { type: String, trim: true },
    openingbalance: { type: Number, default: 0 },
    carryforward: { type: Number, default: 0 },
    earned: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    status: { type: String, default: "Active" },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const HrLeaveBalanceMcp = mongoose.models.HrLeaveBalanceMcp || mongoose.model("HrLeaveBalanceMcp", leaveBalanceSchema, "hrleavebalanceds");

  server.tool("list_hr_leave_balances", "List HR leave balances filtered by colid", {
    employeeemail: z.string().optional(),
    cyclename: z.string().optional(),
    leavetype: z.string().optional(),
    department: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.employeeemail) query.employeeemail = args.employeeemail;
    if (args.cyclename) query.cyclename = args.cyclename;
    if (args.leavetype) query.leavetype = args.leavetype;
    if (args.department) query.department = args.department;
    const data = await HrLeaveBalanceMcp.find(query).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_hr_leave_balance", "Create an HR leave balance record", {
    cyclename: z.string(),
    employeename: z.string().optional(),
    employeeemail: z.string(),
    department: z.string().optional(),
    leavetype: z.string(),
    openingbalance: z.number().optional(),
    carryforward: z.number().optional(),
    earned: z.number().optional(),
    used: z.number().optional(),
    balance: z.number().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await HrLeaveBalanceMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_hr_leave_balance", "Update any field of an HR leave balance by id", {
    id: z.string(),
    cyclename: z.string().optional(),
    employeename: z.string().optional(),
    employeeemail: z.string().optional(),
    department: z.string().optional(),
    leavetype: z.string().optional(),
    openingbalance: z.number().optional(),
    carryforward: z.number().optional(),
    earned: z.number().optional(),
    used: z.number().optional(),
    balance: z.number().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await HrLeaveBalanceMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── HR Leave Applications ───────────────────────────────────────────────────

  const leaveAppSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    cyclename: { type: String, trim: true },
    employeename: { type: String, trim: true },
    employeeemail: { type: String, trim: true },
    department: { type: String, trim: true },
    leavetype: { type: String, trim: true },
    fromdate: { type: Date },
    todate: { type: Date },
    days: { type: Number, default: 0 },
    vacationtype: { type: String, trim: true },
    component: { type: String, trim: true },
    source: { type: String, trim: true },
    reason: { type: String, trim: true },
    documentlink: { type: String, trim: true },
    classes: [{ type: mongoose.Schema.Types.Mixed }],
    approvals: [{ type: mongoose.Schema.Types.Mixed }],
    currentlevel: { type: Number, default: 0 },
    balancededucted: { type: Boolean, default: false },
    status: { type: String, default: "Pending" },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const HrLeaveApplicationMcp = mongoose.models.HrLeaveApplicationMcp || mongoose.model("HrLeaveApplicationMcp", leaveAppSchema, "hrleaveapplicationds");

  server.tool("list_hr_leave_applications", "List HR leave applications filtered by colid", {
    employeeemail: z.string().optional(),
    leavetype: z.string().optional(),
    status: z.string().optional(),
    department: z.string().optional(),
    cyclename: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.employeeemail) query.employeeemail = args.employeeemail;
    if (args.leavetype) query.leavetype = args.leavetype;
    if (args.status) query.status = args.status;
    if (args.department) query.department = args.department;
    if (args.cyclename) query.cyclename = args.cyclename;
    const data = await HrLeaveApplicationMcp.find(query).sort({ createdAt: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_hr_leave_application", "Create an HR leave application", {
    cyclename: z.string().optional(),
    employeename: z.string().optional(),
    employeeemail: z.string(),
    department: z.string().optional(),
    leavetype: z.string(),
    fromdate: z.string().optional(),
    todate: z.string().optional(),
    days: z.number().optional(),
    vacationtype: z.string().optional(),
    component: z.string().optional(),
    source: z.string().optional(),
    reason: z.string().optional(),
    documentlink: z.string().optional(),
    classes: z.array(z.any()).optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await HrLeaveApplicationMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_hr_leave_application", "Update any field of an HR leave application by id", {
    id: z.string(),
    cyclename: z.string().optional(),
    employeename: z.string().optional(),
    employeeemail: z.string().optional(),
    department: z.string().optional(),
    leavetype: z.string().optional(),
    fromdate: z.string().optional(),
    todate: z.string().optional(),
    days: z.number().optional(),
    vacationtype: z.string().optional(),
    component: z.string().optional(),
    source: z.string().optional(),
    reason: z.string().optional(),
    documentlink: z.string().optional(),
    classes: z.array(z.any()).optional(),
    approvals: z.array(z.any()).optional(),
    currentlevel: z.number().optional(),
    balancededucted: z.boolean().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await HrLeaveApplicationMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── HR Shift Timing ─────────────────────────────────────────────────────────

  const shiftTimingSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    location: { type: String, trim: true },
    shift: { type: String, trim: true },
    starttime: { type: String, trim: true },
    endtime: { type: String, trim: true },
    lateaftertime: { type: String, trim: true },
    earlybeforetime: { type: String, trim: true },
    status: { type: String, default: "Active" },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const HrShiftTimingMcp = mongoose.models.HrShiftTimingMcp || mongoose.model("HrShiftTimingMcp", shiftTimingSchema, "hrshifttimingds");

  server.tool("list_hr_shift_timings", "List HR shift timings filtered by colid", {
    location: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.location) query.location = args.location;
    if (args.status) query.status = args.status;
    const data = await HrShiftTimingMcp.find(query).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_hr_shift_timing", "Create an HR shift timing", {
    location: z.string().optional(),
    shift: z.string(),
    starttime: z.string().optional(),
    endtime: z.string().optional(),
    lateaftertime: z.string().optional(),
    earlybeforetime: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await HrShiftTimingMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_hr_shift_timing", "Update any field of an HR shift timing by id", {
    id: z.string(),
    location: z.string().optional(),
    shift: z.string().optional(),
    starttime: z.string().optional(),
    endtime: z.string().optional(),
    lateaftertime: z.string().optional(),
    earlybeforetime: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await HrShiftTimingMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── HR Shift Allocation ─────────────────────────────────────────────────────

  const shiftAllocSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    employee: { type: String, trim: true },
    employeeemail: { type: String, trim: true },
    shift: { type: String, trim: true },
    location: { type: String, trim: true },
    starttime: { type: String, trim: true },
    endtime: { type: String, trim: true },
    lateaftertime: { type: String, trim: true },
    earlybeforetime: { type: String, trim: true },
    status: { type: String, default: "Active" },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const HrShiftAllocationMcp = mongoose.models.HrShiftAllocationMcp || mongoose.model("HrShiftAllocationMcp", shiftAllocSchema, "hrshiftallocationds");

  server.tool("list_hr_shift_allocations", "List HR shift allocations filtered by colid", {
    employeeemail: z.string().optional(),
    shift: z.string().optional(),
    location: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.employeeemail) query.employeeemail = args.employeeemail;
    if (args.shift) query.shift = args.shift;
    if (args.location) query.location = args.location;
    if (args.status) query.status = args.status;
    const data = await HrShiftAllocationMcp.find(query).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_hr_shift_allocation", "Create an HR shift allocation", {
    employee: z.string().optional(),
    employeeemail: z.string(),
    shift: z.string(),
    location: z.string().optional(),
    starttime: z.string().optional(),
    endtime: z.string().optional(),
    lateaftertime: z.string().optional(),
    earlybeforetime: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await HrShiftAllocationMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_hr_shift_allocation", "Update any field of an HR shift allocation by id", {
    id: z.string(),
    employee: z.string().optional(),
    employeeemail: z.string().optional(),
    shift: z.string().optional(),
    location: z.string().optional(),
    starttime: z.string().optional(),
    endtime: z.string().optional(),
    lateaftertime: z.string().optional(),
    earlybeforetime: z.string().optional(),
    status: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await HrShiftAllocationMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── HR Employee Attendance ──────────────────────────────────────────────────

  const empAttSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    academicyear: { type: String, trim: true },
    month: { type: String, trim: true },
    date: { type: Date },
    employeename: { type: String, trim: true },
    employeeemail: { type: String, trim: true },
    role: { type: String, trim: true },
    attendance: { type: Number, default: 0 },
    status: { type: String, trim: true },
    intime: { type: String, trim: true },
    outtime: { type: String, trim: true },
    islate: { type: Boolean, default: false },
    isearly: { type: Boolean, default: false },
    isovertime: { type: Boolean, default: false },
    overtimerate: { type: Number, default: 0 },
    latesalarydeduction: { type: Number, default: 0 },
    netsalary: { type: Number, default: 0 },
    approvalstatus: { type: String, trim: true },
    actiontype: { type: String, trim: true },
    approvals: [{ type: mongoose.Schema.Types.Mixed }],
    currentlevel: { type: Number, default: 0 },
    finalcomment: { type: String, trim: true },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const HrEmployeeAttendanceMcp = mongoose.models.HrEmployeeAttendanceMcp || mongoose.model("HrEmployeeAttendanceMcp", empAttSchema, "hremployeeattendanceds");

  server.tool("list_hr_employee_attendance", "List HR employee attendance records filtered by colid", {
    employeeemail: z.string().optional(),
    month: z.string().optional(),
    academicyear: z.string().optional(),
    approvalstatus: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.employeeemail) query.employeeemail = args.employeeemail;
    if (args.month) query.month = args.month;
    if (args.academicyear) query.academicyear = args.academicyear;
    if (args.approvalstatus) query.approvalstatus = args.approvalstatus;
    const data = await HrEmployeeAttendanceMcp.find(query).sort({ date: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_hr_employee_attendance", "Create an HR employee attendance record", {
    academicyear: z.string().optional(),
    month: z.string().optional(),
    date: z.string().optional(),
    employeename: z.string().optional(),
    employeeemail: z.string(),
    role: z.string().optional(),
    attendance: z.number().optional(),
    status: z.string().optional(),
    intime: z.string().optional(),
    outtime: z.string().optional(),
    islate: z.boolean().optional(),
    isearly: z.boolean().optional(),
    isovertime: z.boolean().optional(),
    overtimerate: z.number().optional(),
    latesalarydeduction: z.number().optional(),
    netsalary: z.number().optional(),
    approvalstatus: z.string().optional(),
    actiontype: z.string().optional(),
    finalcomment: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await HrEmployeeAttendanceMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_hr_employee_attendance", "Update any field of an HR employee attendance record by id", {
    id: z.string(),
    academicyear: z.string().optional(),
    month: z.string().optional(),
    date: z.string().optional(),
    employeename: z.string().optional(),
    employeeemail: z.string().optional(),
    role: z.string().optional(),
    attendance: z.number().optional(),
    status: z.string().optional(),
    intime: z.string().optional(),
    outtime: z.string().optional(),
    islate: z.boolean().optional(),
    isearly: z.boolean().optional(),
    isovertime: z.boolean().optional(),
    overtimerate: z.number().optional(),
    latesalarydeduction: z.number().optional(),
    netsalary: z.number().optional(),
    approvalstatus: z.string().optional(),
    actiontype: z.string().optional(),
    approvals: z.array(z.any()).optional(),
    currentlevel: z.number().optional(),
    finalcomment: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await HrEmployeeAttendanceMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── HR Resignation ──────────────────────────────────────────────────────────

  const resignationSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    employeeid: { type: String, trim: true },
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    department: { type: String, trim: true },
    admissionyear: { type: String, trim: true },
    role: { type: String, trim: true },
    regno: { type: String, trim: true },
    resignationdate: { type: Date },
    noticeperiod: { type: Number, default: 0 },
    lastworkingdate: { type: Date },
    status: { type: String, enum: ["Resigned", "Notice Period", "Absconded", "Completed"], default: "Resigned" },
    remarks: { type: String, trim: true },
    documents: [{ type: mongoose.Schema.Types.Mixed }],
    user: { type: String, trim: true },
  }, { timestamps: true });
  const HrResignationMcp = mongoose.models.HrResignationMcp || mongoose.model("HrResignationMcp", resignationSchema, "hrresignationds");

  server.tool("list_hr_resignations", "List HR resignation records filtered by colid", {
    email: z.string().optional(),
    department: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.email) query.email = args.email;
    if (args.department) query.department = args.department;
    if (args.status) query.status = args.status;
    const data = await HrResignationMcp.find(query).sort({ createdAt: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_hr_resignation", "Create an HR resignation record", {
    employeeid: z.string().optional(),
    name: z.string().optional(),
    email: z.string(),
    phone: z.string().optional(),
    department: z.string().optional(),
    admissionyear: z.string().optional(),
    role: z.string().optional(),
    regno: z.string().optional(),
    resignationdate: z.string().optional(),
    noticeperiod: z.number().optional(),
    lastworkingdate: z.string().optional(),
    status: z.string().optional(),
    remarks: z.string().optional(),
    documents: z.array(z.any()).optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await HrResignationMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_hr_resignation", "Update any field of an HR resignation record by id", {
    id: z.string(),
    employeeid: z.string().optional(),
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    department: z.string().optional(),
    admissionyear: z.string().optional(),
    role: z.string().optional(),
    regno: z.string().optional(),
    resignationdate: z.string().optional(),
    noticeperiod: z.number().optional(),
    lastworkingdate: z.string().optional(),
    status: z.string().optional(),
    remarks: z.string().optional(),
    documents: z.array(z.any()).optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await HrResignationMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  // ── HR Expense Submission ───────────────────────────────────────────────────

  const expenseSchema = new mongoose.Schema({
    colid: { type: Number, required: true, index: true },
    employee: { type: String, trim: true },
    employeeemail: { type: String, trim: true },
    department: { type: String, trim: true },
    role: { type: String, trim: true },
    submissiondate: { type: Date },
    status: { type: String, default: "Pending" },
    currentlevel: { type: Number, default: 0 },
    validationstatus: { type: String, trim: true },
    validationcomments: { type: String, trim: true },
    items: [{ type: mongoose.Schema.Types.Mixed }],
    documents: [{ type: mongoose.Schema.Types.Mixed }],
    totalamount: { type: Number, default: 0 },
    approvedamount: { type: Number, default: 0 },
    approvalhistory: [{ type: mongoose.Schema.Types.Mixed }],
    salaryposted: { type: Boolean, default: false },
    comments: { type: String, trim: true },
    user: { type: String, trim: true },
  }, { timestamps: true });
  const HrExpenseSubmissionMcp = mongoose.models.HrExpenseSubmissionMcp || mongoose.model("HrExpenseSubmissionMcp", expenseSchema, "hrexpensesubmissionds");

  server.tool("list_hr_expense_submissions", "List HR expense submissions filtered by colid", {
    employeeemail: z.string().optional(),
    department: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const query = { colid };
    if (args.employeeemail) query.employeeemail = args.employeeemail;
    if (args.department) query.department = args.department;
    if (args.status) query.status = args.status;
    const data = await HrExpenseSubmissionMcp.find(query).sort({ createdAt: -1 }).limit(args.limit || 1000).lean();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("save_hr_expense_submission", "Create an HR expense submission", {
    employee: z.string().optional(),
    employeeemail: z.string(),
    department: z.string().optional(),
    role: z.string().optional(),
    submissiondate: z.string().optional(),
    status: z.string().optional(),
    validationstatus: z.string().optional(),
    validationcomments: z.string().optional(),
    items: z.array(z.any()).optional(),
    documents: z.array(z.any()).optional(),
    totalamount: z.number().optional(),
    approvedamount: z.number().optional(),
    salaryposted: z.boolean().optional(),
    comments: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const doc = await HrExpenseSubmissionMcp.create({ ...args, colid });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });

  server.tool("update_hr_expense_submission", "Update any field of an HR expense submission by id", {
    id: z.string(),
    employee: z.string().optional(),
    employeeemail: z.string().optional(),
    department: z.string().optional(),
    role: z.string().optional(),
    submissiondate: z.string().optional(),
    status: z.string().optional(),
    currentlevel: z.number().optional(),
    validationstatus: z.string().optional(),
    validationcomments: z.string().optional(),
    items: z.array(z.any()).optional(),
    documents: z.array(z.any()).optional(),
    totalamount: z.number().optional(),
    approvedamount: z.number().optional(),
    approvalhistory: z.array(z.any()).optional(),
    salaryposted: z.boolean().optional(),
    comments: z.string().optional(),
    user: z.string().optional(),
  }, async (args, context) => {
    requireAuth(context);
    await connectDB();
    const colid = await resolveColid(context);
    const { id, ...update } = args;
    const doc = await HrExpenseSubmissionMcp.findOneAndUpdate({ _id: id, colid }, { $set: update }, { new: true });
    return { content: [{ type: "text", text: JSON.stringify(doc, null, 2) }] };
  });
}
