/**
 * fees-receipt-tools.js
 *
 * MCP tools mirroring StudentFeesReceiptPage.jsx + studentfeesreceiptctlr.js
 *
 * MongoDB collection: ledgerstud  (Ledgerstud model)
 *
 * Tools:
 *   list_fees_receipt              – query rows with all filters (mirrors getFeesReceiptRows)
 *   get_fees_receipt_for_student   – full receipt for one student with computed totals
 *   report_fees_summary_by_student – per-student aggregate totals
 *   report_fees_collection         – collection stats grouped by any dimension
 *   report_fees_outstanding        – students with unpaid balance
 *   report_fees_by_feegroup        – totals grouped by fee group
 */

import mongoose from "mongoose";
import { z } from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────
const ledgerstudSchema = new mongoose.Schema(
  {
    name:           { type: String },
    user:           { type: String },
    feegroup:       { type: String, required: true },
    regno:          { type: String, required: true },
    student:        { type: String, required: true },
    feeitem:        { type: String, required: true },
    amount:         { type: Number },
    paid:           { type: Number },
    concession:     { type: Number },
    balance:        { type: Number },
    cash:           { type: Number },
    upi:            { type: Number },
    cheque:         { type: Number },
    card:           { type: Number },
    pg:             { type: Number },
    neft:           { type: Number },
    doclink:        { type: String },
    feebook:        { type: String },
    feecounter:     { type: String },
    paymode:        { type: String },
    paydetails:     { type: String },
    feecategory:    { type: String },
    semester:       { type: String },
    cashbook:       { type: String },
    institution:    { type: String },
    type:           { type: String },
    installment:    { type: String },
    comments:       { type: String },
    academicyear:   { type: String, required: true },
    colid:          { type: Number, required: true },
    classdate:      { type: Date },
    duedate:        { type: Date },
    paiddate:       { type: Date },
    status:         { type: String, required: true },
    approvalhistory:{ type: Array,  default: [] },
    programcode:    { type: String },
    regulation:     { type: String },
    major:          { type: String },
    minor:          { type: String },
    feeid:          { type: String },
    admissionyear:  { type: String }
  },
  { strict: false, collection: "ledgerstuds" }
);

const userLookupSchema = new mongoose.Schema(
  { email: String, name: String, regno: String, phone: String, programcode: String,
    admissionyear: String, semester: String, section: String, gender: String,
    category: String, address: String, fathername: String, mothername: String,
    regulation: String, Major: String, Minor: String, colid: Number },
  { strict: false }
);

// Use guarded unique model names to avoid clashing with index.js/server.js
const Ledgerstud = mongoose.models.LedgerstudFees
  || mongoose.model("LedgerstudFees", ledgerstudSchema, "ledgerstuds");

const UserFees = mongoose.models.UserFeesLookup
  || mongoose.model("UserFeesLookup", userLookupSchema, "users");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TEXT_REGEX_FIELDS = ["student", "feeitem", "feegroup"];

const ALLOWED_FILTERS = [
  "academicyear", "programcode", "regulation", "student", "regno",
  "major", "minor", "feegroup", "feeitem", "feebook", "cashbook",
  "semester", "feecategory", "status"
];

function safeNum(v) { const n = Number(v); return Number.isNaN(n) ? 0 : n; }
function clean(v)   { return String(v ?? "").trim(); }
function safePct(n, d) { return d === 0 ? 0 : Math.round((n / d) * 10000) / 100; }

/**
 * Build a Mongoose query object from the flat filter params the tools accept.
 */
function buildQuery(colid, params) {
  const query = { colid };
  ALLOWED_FILTERS.forEach((field) => {
    const val = params[field];
    if (!val) return;
    query[field] = TEXT_REGEX_FIELDS.includes(field)
      ? new RegExp(clean(val).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
      : clean(val);
  });
  return query;
}

/** Aggregate per-student details by joining the users collection. */
async function buildStudentMap(colid, regnos) {
  const users = await UserFees.find({ colid, regno: { $in: regnos } })
    .select("name email phone regno programcode admissionyear semester section gender category address fathername mothername regulation Major Minor colid")
    .lean();
  return new Map(users.map((u) => [u.regno, u]));
}

/** Compute totals for an array of ledger rows. */
function sumRows(rows) {
  return rows.reduce(
    (acc, r) => ({
      amount:     acc.amount     + safeNum(r.amount),
      paid:       acc.paid       + safeNum(r.paid),
      concession: acc.concession + safeNum(r.concession),
      balance:    acc.balance    + safeNum(r.balance),
      cash:       acc.cash       + safeNum(r.cash),
      upi:        acc.upi        + safeNum(r.upi),
      cheque:     acc.cheque     + safeNum(r.cheque),
      card:       acc.card       + safeNum(r.card),
      pg:         acc.pg         + safeNum(r.pg),
      neft:       acc.neft       + safeNum(r.neft),
    }),
    { amount: 0, paid: 0, concession: 0, balance: 0,
      cash: 0, upi: 0, cheque: 0, card: 0, pg: 0, neft: 0 }
  );
}

/** Build options object (unique values per field) for filter dropdowns. */
function buildOptions(rows) {
  const opts = {};
  ALLOWED_FILTERS.forEach((field) => {
    opts[field] = [...new Set(rows.map((r) => clean(r[field])).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  });
  return opts;
}

// ─── Tool registration ────────────────────────────────────────────────────────
export function registerFeesReceiptTools(server, { requireAuth, resolveColid, connectDB }) {
  const text = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });

  // ── Shared filter schema (reused across tools) ─────────────────────────────
  const filterSchema = {
    colid:        z.number().optional().describe("College ID (defaults to session colid)"),
    academicyear: z.string().optional().describe("Academic year e.g. 2024-25"),
    programcode:  z.string().optional().describe("Program code e.g. BTECH-CSE"),
    regulation:   z.string().optional().describe("Regulation e.g. R2021"),
    student:      z.string().optional().describe("Student name (partial match)"),
    regno:        z.string().optional().describe("Registration number"),
    major:        z.string().optional().describe("Major subject"),
    minor:        z.string().optional().describe("Minor subject"),
    feegroup:     z.string().optional().describe("Fee group name (partial match)"),
    feeitem:      z.string().optional().describe("Fee item name (partial match)"),
    feebook:      z.string().optional().describe("Fee book"),
    cashbook:     z.string().optional().describe("Cash book"),
    semester:     z.string().optional().describe("Semester"),
    feecategory:  z.string().optional().describe("Fee category"),
    status:       z.string().optional().describe("Payment status e.g. Paid, Pending")
  };

  // ════════════════════════════════════════════════════════════════════════════
  // 1. list_fees_receipt
  //    Mirrors getFeesReceiptRows — returns rows + student list + filter options
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "list_fees_receipt",
    "Fetch student fee receipt rows with optional filters. Returns the raw ledger records " +
    "(up to 3000), a list of distinct students found, and available filter options for all fields. " +
    "Mirrors the Fees Receipt page query. Use get_fees_receipt_for_student for a single student's full receipt.",
    {
      ...filterSchema,
      limit: z.number().int().min(1).max(3000).optional().default(500).describe("Max rows to return (default 500, max 3000)")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);
      const query = buildQuery(colid, params);

      const data = await Ledgerstud.find(query)
        .sort({ paiddate: -1, academicyear: -1, student: 1, feegroup: 1, feeitem: 1 })
        .limit(params.limit ?? 500)
        .lean();

      // Enrich with user details
      const regnos = [...new Set(data.map((r) => r.regno).filter(Boolean))];
      const userMap = await buildStudentMap(colid, regnos);

      // Build student dropdown list
      const studentMap = new Map();
      data.forEach((item) => {
        const user = userMap.get(item.regno) || {};
        const key  = item.regno || item.student;
        if (!studentMap.has(key)) {
          studentMap.set(key, {
            regno:       item.regno || "",
            student:     user.name || item.student || "",
            programcode: user.programcode || item.programcode || "",
            academicyear:item.academicyear || user.admissionyear || "",
            regulation:  user.regulation  || item.regulation  || "",
            major:       user.Major       || item.major       || "",
            minor:       user.Minor       || item.minor       || "",
            email:       user.email || "",
            phone:       user.phone || ""
          });
        }
      });

      const enriched = data.map((r) => ({ ...r, userdetails: userMap.get(r.regno) || null }));

      return text({
        success:  true,
        count:    enriched.length,
        students: [...studentMap.values()].sort((a, b) => a.student.localeCompare(b.student)),
        options:  buildOptions(data),
        data:     enriched
      });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 2. get_fees_receipt_for_student
  //    Full receipt for one student — mirrors the printable receipt on the page
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "get_fees_receipt_for_student",
    "Generate a complete fee receipt for a specific student. Returns student profile, " +
    "itemized fee lines (with amount, paid, concession, balance, payment mode), and grand totals. " +
    "Equivalent to selecting a student and printing the receipt on the Fees Receipt page.",
    {
      colid:        z.number().optional().describe("College ID (defaults to session colid)"),
      regno:        z.string().min(1).describe("Student registration number"),
      academicyear: z.string().optional().describe("Filter by academic year e.g. 2024-25"),
      feegroup:     z.string().optional().describe("Filter by fee group"),
      feeitem:      z.string().optional().describe("Filter by fee item"),
      semester:     z.string().optional().describe("Filter by semester"),
      status:       z.string().optional().describe("Filter by status e.g. Paid, Pending"),
      feecategory:  z.string().optional().describe("Filter by fee category")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);

      const query = { colid, regno: params.regno };
      if (params.academicyear) query.academicyear = params.academicyear;
      if (params.feegroup)     query.feegroup     = new RegExp(params.feegroup.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (params.feeitem)      query.feeitem      = new RegExp(params.feeitem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (params.semester)     query.semester     = params.semester;
      if (params.status)       query.status       = params.status;
      if (params.feecategory)  query.feecategory  = params.feecategory;

      const rows = await Ledgerstud.find(query)
        .sort({ paiddate: -1, academicyear: -1, feegroup: 1, feeitem: 1 })
        .lean();

      if (!rows.length) {
        return text({ success: false, error: `No fee records found for regno: ${params.regno}` });
      }

      // Student profile from Users collection
      const userMap = await buildStudentMap(colid, [params.regno]);
      const user    = userMap.get(params.regno) || {};
      const sample  = rows[0];

      const studentProfile = {
        name:         user.name         || sample.student   || "",
        regno:        user.regno        || params.regno,
        programcode:  user.programcode  || sample.programcode || "",
        academicyear: sample.academicyear || user.admissionyear || "",
        regulation:   user.regulation   || sample.regulation || "",
        major:        user.Major        || sample.major     || "",
        minor:        user.Minor        || sample.minor     || "",
        semester:     user.semester     || sample.semester  || "",
        section:      user.section      || "",
        email:        user.email        || "",
        phone:        user.phone        || "",
        address:      user.address      || "",
        fathername:   user.fathername   || "",
        mothername:   user.mothername   || "",
        gender:       user.gender       || "",
        category:     user.category     || ""
      };

      const totals = sumRows(rows);
      const collectionPct = safePct(totals.paid, totals.amount);

      const items = rows.map((r) => ({
        _id:         String(r._id),
        feegroup:    r.feegroup  || "",
        feeitem:     r.feeitem   || "",
        feecategory: r.feecategory || "",
        semester:    r.semester  || "",
        academicyear:r.academicyear || "",
        amount:      safeNum(r.amount),
        paid:        safeNum(r.paid),
        concession:  safeNum(r.concession),
        balance:     safeNum(r.balance),
        paymode:     r.paymode   || "",
        paydetails:  r.paydetails || "",
        cash:        safeNum(r.cash),
        upi:         safeNum(r.upi),
        cheque:      safeNum(r.cheque),
        card:        safeNum(r.card),
        pg:          safeNum(r.pg),
        neft:        safeNum(r.neft),
        paiddate:    r.paiddate  ? String(r.paiddate).slice(0, 10) : "",
        duedate:     r.duedate   ? String(r.duedate).slice(0, 10)  : "",
        status:      r.status    || "",
        feebook:     r.feebook   || "",
        cashbook:    r.cashbook  || "",
        installment: r.installment || "",
        comments:    r.comments  || ""
      }));

      return text({
        success:        true,
        student:        studentProfile,
        items,
        totals,
        collectionPct,
        itemCount:      items.length,
        paidCount:      items.filter((i) => i.balance === 0).length,
        pendingCount:   items.filter((i) => i.balance > 0).length
      });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 3. report_fees_summary_by_student
  //    Per-student aggregate totals — useful for quick dues review
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "report_fees_summary_by_student",
    "Aggregate fee totals grouped by student. Returns amount, paid, concession, balance, " +
    "and collection percentage for each student. Useful for identifying who has pending dues.",
    {
      ...filterSchema,
      sort_by: z.enum(["student", "balance", "paid", "amount"]).optional().default("student")
        .describe("Sort results by: student name, balance (highest first), paid, or amount"),
      min_balance: z.number().optional().describe("Only include students with balance above this amount")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);
      const query = buildQuery(colid, params);

      const data = await Ledgerstud.find(query).lean();
      if (!data.length) return text({ success: true, count: 0, students: [] });

      // Group by regno
      const grouped = new Map();
      data.forEach((r) => {
        const key = r.regno || r.student;
        if (!grouped.has(key)) {
          grouped.set(key, {
            regno:        r.regno || "",
            student:      r.student || "",
            programcode:  r.programcode || "",
            academicyear: r.academicyear || "",
            regulation:   r.regulation || "",
            rows: []
          });
        }
        grouped.get(key).rows.push(r);
      });

      // Enrich with user names
      const regnos  = [...new Set(data.map((r) => r.regno).filter(Boolean))];
      const userMap = await buildStudentMap(colid, regnos);

      let students = [...grouped.values()].map(({ rows, ...meta }) => {
        const user   = userMap.get(meta.regno) || {};
        const totals = sumRows(rows);
        return {
          regno:         meta.regno,
          student:       user.name || meta.student,
          programcode:   user.programcode || meta.programcode,
          academicyear:  meta.academicyear,
          regulation:    user.regulation || meta.regulation,
          major:         user.Major || "",
          minor:         user.Minor || "",
          email:         user.email || "",
          phone:         user.phone || "",
          itemCount:     rows.length,
          paidItems:     rows.filter((r) => safeNum(r.balance) === 0).length,
          pendingItems:  rows.filter((r) => safeNum(r.balance) > 0).length,
          ...totals,
          collectionPct: safePct(totals.paid, totals.amount)
        };
      });

      // Apply min_balance filter
      if (params.min_balance !== undefined) {
        students = students.filter((s) => s.balance >= params.min_balance);
      }

      // Sort
      const sortBy = params.sort_by ?? "student";
      if (sortBy === "student")  students.sort((a, b) => a.student.localeCompare(b.student));
      if (sortBy === "balance")  students.sort((a, b) => b.balance  - a.balance);
      if (sortBy === "paid")     students.sort((a, b) => b.paid     - a.paid);
      if (sortBy === "amount")   students.sort((a, b) => b.amount   - a.amount);

      const grandTotal = sumRows(data);
      return text({
        success:      true,
        count:        students.length,
        grandTotal,
        collectionPct: safePct(grandTotal.paid, grandTotal.amount),
        students
      });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 4. report_fees_collection
  //    Collection summary grouped by any dimension (program, feegroup, academicyear…)
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "report_fees_collection",
    "Fee collection report grouped by a chosen dimension (program, fee group, academic year, " +
    "semester, fee category, cashbook, etc.). Returns totals and collection percentage per group.",
    {
      ...filterSchema,
      group_by: z.enum([
        "programcode", "feegroup", "feeitem", "academicyear",
        "semester", "feecategory", "cashbook", "feebook",
        "status", "regulation", "paymode"
      ]).default("feegroup").describe("Dimension to group by")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid  = resolveColid(params.colid);
      const query  = buildQuery(colid, params);
      const groupBy = params.group_by ?? "feegroup";

      const data = await Ledgerstud.find(query).lean();
      if (!data.length) return text({ success: true, count: 0, groups: [] });

      // Group
      const grouped = new Map();
      data.forEach((r) => {
        const key = clean(r[groupBy]) || "(blank)";
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(r);
      });

      const groups = [...grouped.entries()].map(([key, rows]) => {
        const totals = sumRows(rows);
        return {
          [groupBy]:     key,
          itemCount:     rows.length,
          studentCount:  new Set(rows.map((r) => r.regno).filter(Boolean)).size,
          ...totals,
          collectionPct: safePct(totals.paid, totals.amount)
        };
      }).sort((a, b) => b.amount - a.amount);

      const grandTotal = sumRows(data);
      return text({
        success:      true,
        groupBy,
        count:        groups.length,
        grandTotal,
        collectionPct: safePct(grandTotal.paid, grandTotal.amount),
        groups
      });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 5. report_fees_outstanding
  //    Students who have a remaining balance (unpaid/partial fees)
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "report_fees_outstanding",
    "List students with outstanding (unpaid) fee balance. Optionally filter by program, " +
    "academic year, etc. Returns per-student balance sorted highest first. " +
    "Useful for dues follow-up.",
    {
      colid:        z.number().optional().describe("College ID (defaults to session colid)"),
      academicyear: z.string().optional().describe("Academic year e.g. 2024-25"),
      programcode:  z.string().optional().describe("Program code"),
      regulation:   z.string().optional().describe("Regulation"),
      semester:     z.string().optional().describe("Semester"),
      feegroup:     z.string().optional().describe("Fee group"),
      feecategory:  z.string().optional().describe("Fee category"),
      min_balance:  z.number().min(0.01).optional().default(1).describe("Minimum balance to include (default ₹1)")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);

      const query = { colid };
      if (params.academicyear) query.academicyear = params.academicyear;
      if (params.programcode)  query.programcode  = params.programcode;
      if (params.regulation)   query.regulation   = params.regulation;
      if (params.semester)     query.semester     = params.semester;
      if (params.feegroup)     query.feegroup     = new RegExp(params.feegroup.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (params.feecategory)  query.feecategory  = params.feecategory;

      const data = await Ledgerstud.find(query).lean();

      // Group by student, filter to those with balance > min
      const grouped = new Map();
      data.forEach((r) => {
        const key = r.regno || r.student;
        if (!grouped.has(key)) {
          grouped.set(key, { regno: r.regno || "", student: r.student || "", programcode: r.programcode || "", academicyear: r.academicyear || "", rows: [] });
        }
        grouped.get(key).rows.push(r);
      });

      const minBal = params.min_balance ?? 1;
      const regnos = [...new Set(data.map((r) => r.regno).filter(Boolean))];
      const userMap = await buildStudentMap(colid, regnos);

      const outstanding = [...grouped.values()]
        .map(({ rows, ...meta }) => {
          const user   = userMap.get(meta.regno) || {};
          const totals = sumRows(rows);
          return {
            regno:         meta.regno,
            student:       user.name || meta.student,
            programcode:   user.programcode || meta.programcode,
            academicyear:  meta.academicyear,
            email:         user.email || "",
            phone:         user.phone || "",
            ...totals,
            pendingItems:  rows.filter((r) => safeNum(r.balance) > 0).length,
            collectionPct: safePct(totals.paid, totals.amount),
            pendingFeeItems: rows
              .filter((r) => safeNum(r.balance) > 0)
              .map((r) => ({ feegroup: r.feegroup, feeitem: r.feeitem, balance: safeNum(r.balance) }))
          };
        })
        .filter((s) => s.balance >= minBal)
        .sort((a, b) => b.balance - a.balance);

      const totalOutstanding = outstanding.reduce((s, r) => s + r.balance, 0);
      return text({
        success:          true,
        count:            outstanding.length,
        totalOutstanding,
        students:         outstanding
      });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 6. report_fees_by_feegroup
  //    Itemised breakdown by fee group → fee item with student counts & totals
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "report_fees_by_feegroup",
    "Itemised fee collection report showing totals for each fee group and its fee items. " +
    "For each fee item shows total amount, collected, concession, balance, and student count.",
    {
      colid:        z.number().optional().describe("College ID (defaults to session colid)"),
      academicyear: z.string().optional().describe("Academic year e.g. 2024-25"),
      programcode:  z.string().optional().describe("Program code"),
      regulation:   z.string().optional().describe("Regulation"),
      semester:     z.string().optional().describe("Semester"),
      feecategory:  z.string().optional().describe("Fee category"),
      status:       z.string().optional().describe("Status filter e.g. Paid, Pending")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);

      const query = { colid };
      if (params.academicyear) query.academicyear = params.academicyear;
      if (params.programcode)  query.programcode  = params.programcode;
      if (params.regulation)   query.regulation   = params.regulation;
      if (params.semester)     query.semester     = params.semester;
      if (params.feecategory)  query.feecategory  = params.feecategory;
      if (params.status)       query.status       = params.status;

      const data = await Ledgerstud.find(query).lean();
      if (!data.length) return text({ success: true, count: 0, feegroups: [] });

      // Two-level grouping: feegroup → feeitem
      const groupMap = new Map();
      data.forEach((r) => {
        const fg = clean(r.feegroup) || "(blank)";
        const fi = clean(r.feeitem)  || "(blank)";
        if (!groupMap.has(fg)) groupMap.set(fg, new Map());
        const itemMap = groupMap.get(fg);
        if (!itemMap.has(fi)) itemMap.set(fi, []);
        itemMap.get(fi).push(r);
      });

      const feegroups = [...groupMap.entries()].map(([fg, itemMap]) => {
        const items = [...itemMap.entries()].map(([fi, rows]) => {
          const t = sumRows(rows);
          return {
            feeitem:       fi,
            studentCount:  new Set(rows.map((r) => r.regno).filter(Boolean)).size,
            ...t,
            collectionPct: safePct(t.paid, t.amount)
          };
        }).sort((a, b) => b.amount - a.amount);

        const groupTotals = sumRows(items.map((i) => ({ amount: i.amount, paid: i.paid, concession: i.concession, balance: i.balance, cash: i.cash, upi: i.upi, cheque: i.cheque, card: i.card, pg: i.pg, neft: i.neft })));
        return {
          feegroup:      fg,
          itemCount:     items.length,
          studentCount:  new Set(data.filter((r) => clean(r.feegroup) === fg).map((r) => r.regno).filter(Boolean)).size,
          ...groupTotals,
          collectionPct: safePct(groupTotals.paid, groupTotals.amount),
          items
        };
      }).sort((a, b) => b.amount - a.amount);

      const grandTotal = sumRows(data);
      return text({
        success:      true,
        count:        feegroups.length,
        grandTotal,
        collectionPct: safePct(grandTotal.paid, grandTotal.amount),
        feegroups
      });
    }
  );
}
