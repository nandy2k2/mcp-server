/**
 * fees-paid-report-tools.js
 *
 * MCP tools mirroring feespaidreportctlrds.js
 *
 * Key differences from fees-receipt tools:
 *  - Operates ONLY on records where paiddate exists (actual payments)
 *  - Supports date-range filter (fromdate / todate)
 *  - Multi-value filters: pass comma-separated values → Mongo $in query
 *  - Returns built-in summaries grouped by program, feegroup, feeitem, paiddate
 *  - Extra filter fields: admissionyear, program, name, user, paymode, type, installment
 *
 * Tools:
 *   get_fees_paid_options      – distinct filter values for all fields (mirrors getFeesPaidReportOptions)
 *   get_fees_paid_report       – main query: rows + totals + summaries  (mirrors getFeesPaidReport)
 *   report_fees_paid_datewise  – day-by-day collection with running cumulative total
 *   report_fees_paid_by_paymode – payment mode breakdown (cash/UPI/cheque/card/PG/NEFT)
 */

import mongoose from "mongoose";
import { z } from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────
const ledgerstudSchema = new mongoose.Schema(
  {
    name: String, user: String, student: String, regno: String,
    program: String, programcode: String, regulation: String,
    admissionyear: String, academicyear: String,
    major: String, minor: String, semester: String, section: String,
    feegroup: String, feecategory: String, feeitem: String,
    feebook: String, cashbook: String,
    status: String, paymode: String, type: String, installment: String,
    paydetails: String, comments: String, institution: String,
    amount: Number, paid: Number, concession: Number, balance: Number,
    cash: Number, upi: Number, cheque: Number, card: Number,
    pg: Number, neft: Number,
    paiddate: Date, duedate: Date, classdate: Date,
    colid: { type: Number, required: true },
    feeid: String
  },
  { strict: false, collection: "ledgerstuds" }
);

// Unique model name + explicit collection — never shadows index.js "Users"
const LedgerstudPaid = mongoose.models.LedgerstudPaidReport
  || mongoose.model("LedgerstudPaidReport", ledgerstudSchema, "ledgerstuds");

// ─── Helpers (mirror the backend exactly) ────────────────────────────────────
const FILTER_FIELDS = [
  "academicyear", "admissionyear", "regulation", "program", "programcode",
  "major", "minor", "semester", "section", "student", "name", "regno",
  "user", "feegroup", "feecategory", "feeitem", "feebook", "cashbook",
  "status", "paymode", "type", "installment"
];

function safeNum(v)   { const n = Number(v); return Number.isNaN(n) ? 0 : n; }
function cleanStr(v)  { return String(v ?? "").trim(); }
function safePct(n,d) { return d === 0 ? 0 : Math.round((n / d) * 10000) / 100; }

/** Parse comma-separated string or array → clean string array. */
function normalizeArray(value) {
  if (Array.isArray(value)) return value.map(cleanStr).filter(Boolean);
  return String(value || "").split(",").map(cleanStr).filter(Boolean);
}

function dateAtStart(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}
function dateAtEnd(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Build Mongoose query — mirrors buildQuery() in feespaidreportctlrds.js
 * paiddate must exist (paid records only); date range applied when provided.
 */
function buildQuery(colid, params) {
  const paiddate = { $exists: true, $ne: null };
  const from = params.fromdate ? dateAtStart(params.fromdate) : null;
  const to   = params.todate   ? dateAtEnd(params.todate)     : null;
  if (from) paiddate.$gte = from;
  if (to)   paiddate.$lte = to;

  const query = { colid, paiddate };

  FILTER_FIELDS.forEach((field) => {
    const values = normalizeArray(params[field] || "");
    if (values.length === 1) query[field] = values[0];
    if (values.length  >  1) query[field] = { $in: values };
  });

  return query;
}

/** Aggregate rows into a summary keyed by a field — mirrors groupRows(). */
function groupRows(rows, field) {
  const grouped = new Map();
  rows.forEach((row) => {
    const key = cleanStr(row[field]) || "Not specified";
    const cur = grouped.get(key) || { label: key, count: 0, amount: 0, paidamount: 0, concession: 0, balance: 0 };
    cur.count      += 1;
    cur.amount     += safeNum(row.amount);
    cur.paidamount += safeNum(row.paidamount ?? row.paid);
    cur.concession += safeNum(row.concession);
    cur.balance    += safeNum(row.balance);
    grouped.set(key, cur);
  });
  return [...grouped.values()].sort((a, b) => b.paidamount - a.paidamount);
}

/** Compute grand totals from rows array. */
function grandTotals(rows) {
  return rows.reduce(
    (s, r) => ({
      count:      s.count      + 1,
      amount:     s.amount     + safeNum(r.amount),
      paidamount: s.paidamount + safeNum(r.paidamount ?? r.paid),
      concession: s.concession + safeNum(r.concession),
      balance:    s.balance    + safeNum(r.balance),
      cash:       s.cash       + safeNum(r.cash),
      upi:        s.upi        + safeNum(r.upi),
      cheque:     s.cheque     + safeNum(r.cheque),
      card:       s.card       + safeNum(r.card),
      pg:         s.pg         + safeNum(r.pg),
      neft:       s.neft       + safeNum(r.neft)
    }),
    { count: 0, amount: 0, paidamount: 0, concession: 0, balance: 0,
      cash: 0, upi: 0, cheque: 0, card: 0, pg: 0, neft: 0 }
  );
}

// ─── Shared Zod filter schema ─────────────────────────────────────────────────
// All filter fields accept comma-separated multi-values → $in query.
const FILTER_SCHEMA = {
  colid:        z.number().optional().describe("College ID (from session by default)"),
  fromdate:     z.string().optional().describe("Payment date from (YYYY-MM-DD). Filters paiddate ≥ this date"),
  todate:       z.string().optional().describe("Payment date to (YYYY-MM-DD). Filters paiddate ≤ this date"),
  academicyear: z.string().optional().describe("Academic year e.g. 2024-25. Comma-separate for multiple"),
  admissionyear:z.string().optional().describe("Admission year e.g. 2022. Comma-separate for multiple"),
  regulation:   z.string().optional().describe("Regulation e.g. R2021"),
  program:      z.string().optional().describe("Program name"),
  programcode:  z.string().optional().describe("Program code e.g. BTECH-CSE"),
  major:        z.string().optional().describe("Major subject"),
  minor:        z.string().optional().describe("Minor subject"),
  semester:     z.string().optional().describe("Semester"),
  section:      z.string().optional().describe("Section"),
  student:      z.string().optional().describe("Student name"),
  name:         z.string().optional().describe("Student name (alias for student)"),
  regno:        z.string().optional().describe("Registration number. Comma-separate for multiple"),
  user:         z.string().optional().describe("User email"),
  feegroup:     z.string().optional().describe("Fee group. Comma-separate for multiple"),
  feecategory:  z.string().optional().describe("Fee category"),
  feeitem:      z.string().optional().describe("Fee item. Comma-separate for multiple"),
  feebook:      z.string().optional().describe("Fee book"),
  cashbook:     z.string().optional().describe("Cash book"),
  status:       z.string().optional().describe("Payment status e.g. Paid"),
  paymode:      z.string().optional().describe("Payment mode e.g. Cash,UPI. Comma-separate for multiple"),
  type:         z.string().optional().describe("Fee type"),
  installment:  z.string().optional().describe("Installment identifier")
};

// ─── Tool registration ────────────────────────────────────────────────────────
export function registerFeesPaidReportTools(server, { requireAuth, resolveColid, connectDB }) {
  const text = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });

  // ════════════════════════════════════════════════════════════════════════════
  // 1. get_fees_paid_options
  //    Mirrors getFeesPaidReportOptions — distinct filter values scoped by date
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "get_fees_paid_options",
    "Get available filter options (distinct values) for all fees-paid-report filter fields. " +
    "Optionally scope to a date range. Use this to know what values are valid before " +
    "calling get_fees_paid_report.",
    {
      colid:    z.number().optional().describe("College ID (from session by default)"),
      fromdate: z.string().optional().describe("Scope options to payments from this date (YYYY-MM-DD)"),
      todate:   z.string().optional().describe("Scope options to payments up to this date (YYYY-MM-DD)")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);

      const baseQuery = { colid };
      const paiddate  = {};
      const from = params.fromdate ? dateAtStart(params.fromdate) : null;
      const to   = params.todate   ? dateAtEnd(params.todate)     : null;
      if (from) paiddate.$gte = from;
      if (to)   paiddate.$lte = to;
      if (Object.keys(paiddate).length) baseQuery.paiddate = paiddate;

      const optionPairs = await Promise.all(
        FILTER_FIELDS.map(async (field) => {
          const values = await LedgerstudPaid.distinct(field, baseQuery);
          return [field, values.map(cleanStr).filter(Boolean).sort((a, b) => a.localeCompare(b))];
        })
      );

      return text({
        success: true,
        fields:  FILTER_FIELDS,
        options: Object.fromEntries(optionPairs)
      });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 2. get_fees_paid_report
  //    Mirrors getFeesPaidReport — the primary report tool.
  //    Returns rows + grand totals + built-in summaries by program / feegroup /
  //    feeitem / feecategory / paiddate.
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "get_fees_paid_report",
    "Fees paid report: fetch all payment transactions matching the filters. " +
    "Returns individual rows (up to 10,000), grand totals, and automatic summaries " +
    "grouped by program, fee group, fee item, fee category, and payment date. " +
    "Supports multi-value filters (comma-separate values). " +
    "All records must have a paiddate (actual payments only).",
    {
      ...FILTER_SCHEMA,
      limit: z.number().int().min(1).max(10000).optional().default(1000)
        .describe("Max rows to return (default 1000, max 10000)")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);
      const query = buildQuery(colid, params);

      const data = await LedgerstudPaid.find(query)
        .select("academicyear admissionyear regulation program programcode major minor semester section student name regno user feegroup feecategory feeitem feebook cashbook status paymode type installment paiddate amount paid concession balance cash upi cheque card pg neft colid")
        .sort({ programcode: 1, student: 1, paiddate: -1, feegroup: 1, feeitem: 1 })
        .limit(params.limit ?? 1000)
        .lean();

      const rows = data.map((r) => ({
        ...r,
        _id:        String(r._id),
        program:    r.program || r.programcode || "Not specified",
        student:    r.student || r.name        || "Not specified",
        paidamount: safeNum(r.paid),
        paiddate:   r.paiddate ? new Date(r.paiddate).toISOString().slice(0, 10) : ""
      }));

      const totals = grandTotals(rows);

      // Summaries mirror the backend exactly
      const summaries = {
        program:      groupRows(rows, "program"),
        programcode:  groupRows(rows, "programcode"),
        feegroup:     groupRows(rows, "feegroup"),
        feecategory:  groupRows(rows, "feecategory"),
        feeitem:      groupRows(rows, "feeitem"),
        paiddate:     groupRows(rows, "paiddate")
      };

      return text({
        success:      true,
        count:        rows.length,
        totals,
        collectionPct: safePct(totals.paidamount, totals.amount),
        summaries,
        data: rows
      });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 3. report_fees_paid_datewise
  //    Day-by-day collection with running cumulative total
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "report_fees_paid_datewise",
    "Day-by-day fee collection report. For each payment date shows count of transactions, " +
    "amount collected, concessions, and running cumulative total. " +
    "Useful for viewing daily cash flow within a period.",
    {
      colid:        z.number().optional().describe("College ID (from session by default)"),
      fromdate:     z.string().optional().describe("From date YYYY-MM-DD"),
      todate:       z.string().optional().describe("To date YYYY-MM-DD"),
      academicyear: z.string().optional().describe("Academic year"),
      programcode:  z.string().optional().describe("Program code (comma-separated for multiple)"),
      feegroup:     z.string().optional().describe("Fee group (comma-separated for multiple)"),
      feecategory:  z.string().optional().describe("Fee category"),
      paymode:      z.string().optional().describe("Payment mode (comma-separated for multiple)"),
      status:       z.string().optional()
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);
      const query = buildQuery(colid, params);

      const data = await LedgerstudPaid.find(query)
        .select("paiddate amount paid concession balance cash upi cheque card pg neft student regno programcode feegroup")
        .sort({ paiddate: 1 })
        .lean();

      if (!data.length) return text({ success: true, count: 0, days: [], totals: {} });

      // Group by date string
      const dayMap = new Map();
      data.forEach((r) => {
        const day = r.paiddate ? new Date(r.paiddate).toISOString().slice(0, 10) : "Unknown";
        const cur = dayMap.get(day) || {
          date: day, count: 0,
          amount: 0, paidamount: 0, concession: 0, balance: 0,
          cash: 0, upi: 0, cheque: 0, card: 0, pg: 0, neft: 0,
          students: new Set()
        };
        cur.count      += 1;
        cur.amount     += safeNum(r.amount);
        cur.paidamount += safeNum(r.paid);
        cur.concession += safeNum(r.concession);
        cur.balance    += safeNum(r.balance);
        cur.cash       += safeNum(r.cash);
        cur.upi        += safeNum(r.upi);
        cur.cheque     += safeNum(r.cheque);
        cur.card       += safeNum(r.card);
        cur.pg         += safeNum(r.pg);
        cur.neft       += safeNum(r.neft);
        if (r.regno) cur.students.add(r.regno);
        dayMap.set(day, cur);
      });

      // Add cumulative running total
      let cumulative = 0;
      const days = [...dayMap.values()]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(({ students, ...d }) => {
          cumulative += d.paidamount;
          return { ...d, studentCount: students.size, cumulativePaid: Math.round(cumulative * 100) / 100 };
        });

      const totals = grandTotals(data.map((r) => ({ ...r, paidamount: r.paid })));
      return text({ success: true, count: days.length, totals, days });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 4. report_fees_paid_by_paymode
  //    Payment mode breakdown — cash, UPI, cheque, card, PG, NEFT
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "report_fees_paid_by_paymode",
    "Fee collection breakdown by payment mode (Cash, UPI, Cheque, Card, PG, NEFT). " +
    "Shows amount collected through each channel and its share of total collection. " +
    "Also groups by the paymode field for any mode-specific analysis.",
    {
      colid:        z.number().optional().describe("College ID (from session by default)"),
      fromdate:     z.string().optional().describe("From date YYYY-MM-DD"),
      todate:       z.string().optional().describe("To date YYYY-MM-DD"),
      academicyear: z.string().optional().describe("Academic year"),
      programcode:  z.string().optional().describe("Program code (comma-separated for multiple)"),
      feegroup:     z.string().optional().describe("Fee group"),
      feecategory:  z.string().optional().describe("Fee category"),
      semester:     z.string().optional()
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);
      const query = buildQuery(colid, params);

      const data = await LedgerstudPaid.find(query)
        .select("paid cash upi cheque card pg neft paymode amount concession balance")
        .lean();

      if (!data.length) return text({ success: true, totalCollected: 0, channels: [], paymodes: [] });

      // Channel-level totals (numeric fields on each record)
      const channels = { cash: 0, upi: 0, cheque: 0, card: 0, pg: 0, neft: 0 };
      let totalPaid = 0;

      data.forEach((r) => {
        totalPaid      += safeNum(r.paid);
        channels.cash  += safeNum(r.cash);
        channels.upi   += safeNum(r.upi);
        channels.cheque+= safeNum(r.cheque);
        channels.card  += safeNum(r.card);
        channels.pg    += safeNum(r.pg);
        channels.neft  += safeNum(r.neft);
      });

      const channelRows = Object.entries(channels)
        .map(([mode, amount]) => ({
          mode:    mode.toUpperCase(),
          amount:  Math.round(amount * 100) / 100,
          sharePct: safePct(amount, totalPaid)
        }))
        .sort((a, b) => b.amount - a.amount);

      // Also group by the paymode string field (mirrors the backend filter)
      const paymodes = groupRows(data.map((r) => ({ ...r, paidamount: r.paid })), "paymode");

      const totals = grandTotals(data.map((r) => ({ ...r, paidamount: r.paid })));
      return text({
        success:        true,
        transactionCount: data.length,
        totalCollected: Math.round(totalPaid * 100) / 100,
        totals,
        channels:       channelRows,
        paymodes
      });
    }
  );
}
