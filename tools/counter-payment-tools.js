/**
 * counter-payment-tools.js
 *
 * MCP tools mirroring StudentLedgerCounterPaymentPage.jsx
 * and studentledgercounterpaymentctlr.js
 *
 * ⚠️  post_counter_payment is a WRITE tool — it permanently updates ledger
 *     records (paid, balance, paiddate, paymode, approvalhistory, status).
 *     It mirrors postCounterPayment exactly: amount is capped to current
 *     balance, and if newBalance === 0 the record status becomes "paid".
 *
 * Tools:
 *   list_counter_payment_pending      – pending fee items (balance > 0)
 *   post_counter_payment              – process a batch counter payment (WRITE)
 *   get_payment_history_for_student   – approvalhistory for a student's records
 *   report_counter_payment_pending_summary – pending dues summary by dimension
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
    status: String, paymode: String, paydetails: String,
    type: String, installment: String, feecounter: String,
    comments: String, institution: String,
    amount: Number, paid: Number, concession: Number, balance: Number,
    cash: Number, upi: Number, cheque: Number, card: Number,
    pg: Number, neft: Number,
    paiddate: Date, duedate: Date, classdate: Date,
    colid: { type: Number, required: true },
    approvalhistory: { type: Array, default: [] },
    feeid: String
  },
  { strict: false, collection: "ledgerstuds" }
);

// Unique model name to avoid clashing with other tool modules
const LedgerstudCounter = mongoose.models.LedgerstudCounter
  || mongoose.model("LedgerstudCounter", ledgerstudSchema, "ledgerstuds");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ALLOWED_FILTERS = [
  "academicyear", "student", "regno", "regulation",
  "major", "minor", "programcode", "feegroup", "feeitem",
  "feebook", "cashbook", "semester", "feecategory"
];
const REGEX_FIELDS = ["student", "feeitem", "feegroup"];

function safeNum(v)  { const n = Number(v); return Number.isNaN(n) ? 0 : n; }
function cleanStr(v) { return String(v ?? "").trim(); }
function safePct(n,d){ return d === 0 ? 0 : Math.round((n / d) * 10000) / 100; }
function todayStr()  { return new Date().toISOString().slice(0, 10); }

function buildQuery(colid, params) {
  const query = { colid, balance: { $gt: 0 } };
  ALLOWED_FILTERS.forEach((field) => {
    const val = cleanStr(params[field] || "");
    if (!val) return;
    query[field] = REGEX_FIELDS.includes(field)
      ? new RegExp(val.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
      : val;
  });
  return query;
}

function buildOptions(rows) {
  const opts = {};
  ALLOWED_FILTERS.forEach((field) => {
    opts[field] = [...new Set(rows.map((r) => cleanStr(r[field])).filter(Boolean))].sort((a,b) => a.localeCompare(b));
  });
  return opts;
}

function sumRows(rows) {
  return rows.reduce(
    (s, r) => ({
      amount:     s.amount     + safeNum(r.amount),
      paid:       s.paid       + safeNum(r.paid),
      concession: s.concession + safeNum(r.concession),
      balance:    s.balance    + safeNum(r.balance)
    }),
    { amount: 0, paid: 0, concession: 0, balance: 0 }
  );
}

// ─── Tool registration ────────────────────────────────────────────────────────
export function registerCounterPaymentTools(server, { requireAuth, resolveColid, resolveUser, connectDB }) {
  const text = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });

  // ════════════════════════════════════════════════════════════════════════════
  // 1. list_counter_payment_pending
  //    Mirrors getCounterPaymentLedger — pending items (balance > 0)
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "list_counter_payment_pending",
    "List all fee items with an outstanding balance (balance > 0) — these are the items " +
    "available for counter payment. Returns records, student dropdown list, and filter options. " +
    "Filter by student, regno, program, fee group, academic year, etc. " +
    "Use post_counter_payment to record a payment against selected items.",
    {
      colid:        z.number().optional().describe("College ID (from session)"),
      academicyear: z.string().optional().describe("Academic year e.g. 2024-25"),
      student:      z.string().optional().describe("Student name (partial match)"),
      regno:        z.string().optional().describe("Registration number"),
      regulation:   z.string().optional().describe("Regulation e.g. R2021"),
      major:        z.string().optional().describe("Major subject"),
      minor:        z.string().optional().describe("Minor subject"),
      programcode:  z.string().optional().describe("Program code"),
      feegroup:     z.string().optional().describe("Fee group (partial match)"),
      feeitem:      z.string().optional().describe("Fee item (partial match)"),
      feebook:      z.string().optional().describe("Fee book"),
      cashbook:     z.string().optional().describe("Cash book"),
      semester:     z.string().optional().describe("Semester"),
      feecategory:  z.string().optional().describe("Fee category"),
      limit:        z.number().int().min(1).max(3000).optional().default(500)
        .describe("Max rows (default 500, max 3000)")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);
      const query = buildQuery(colid, params);

      const data = await LedgerstudCounter.find(query)
        .sort({ academicyear: -1, student: 1, regno: 1, feegroup: 1, feeitem: 1 })
        .limit(params.limit ?? 500)
        .lean();

      // Distinct student list
      const studentMap = new Map();
      data.forEach((item) => {
        const key = item.regno || item.student;
        if (!studentMap.has(key)) {
          studentMap.set(key, {
            regno:        item.regno        || "",
            student:      item.student      || "",
            programcode:  item.programcode  || "",
            academicyear: item.academicyear || item.admissionyear || ""
          });
        }
      });

      const totals = sumRows(data);

      return text({
        success:  true,
        count:    data.length,
        totals,
        students: [...studentMap.values()].sort((a, b) => `${a.student}${a.regno}`.localeCompare(`${b.student}${b.regno}`)),
        options:  buildOptions(data),
        data:     data.map((r) => ({
          _id:         String(r._id),
          academicyear:r.academicyear || "",
          student:     r.student      || "",
          regno:       r.regno        || "",
          programcode: r.programcode  || "",
          regulation:  r.regulation   || "",
          major:       r.major        || "",
          minor:       r.minor        || "",
          feegroup:    r.feegroup     || "",
          feeitem:     r.feeitem      || "",
          feebook:     r.feebook      || "",
          cashbook:    r.cashbook     || "",
          semester:    r.semester     || "",
          feecategory: r.feecategory  || "",
          amount:      safeNum(r.amount),
          paid:        safeNum(r.paid),
          concession:  safeNum(r.concession),
          balance:     safeNum(r.balance),
          status:      r.status       || "",
          paymode:     r.paymode      || "",
          feecounter:  r.feecounter   || ""
        }))
      });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 2. post_counter_payment  ⚠️ WRITE
  //    Mirrors postCounterPayment — permanently updates ledger records.
  //    Amount is capped to current balance. Status set to "paid" when balance=0.
  //    Full history entry appended to approvalhistory.
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "post_counter_payment",
    "⚠️ WRITE — Post a counter payment against one or more fee items. " +
    "Each item's paid amount increases and balance decreases accordingly. " +
    "Amount received is automatically capped to the current balance. " +
    "If the balance reaches zero, status is set to 'paid'. " +
    "A history entry is added to approvalhistory for audit. " +
    "Get the ledger record _id values from list_counter_payment_pending first.",
    {
      colid:      z.number().optional().describe("College ID (from session)"),
      paiddate:   z.string().optional().describe("Payment date YYYY-MM-DD (defaults to today)"),
      paymode:    z.enum(["Cash", "UPI", "Cheque", "Card", "NEFT", "PG"]).default("Cash")
        .describe("Payment mode"),
      paydetails: z.string().optional().describe("Payment reference / transaction ID / cheque number"),
      remarks:    z.string().optional().describe("Remarks or notes for this payment"),
      items: z.array(
        z.object({
          id:             z.string().describe("Ledger record _id from list_counter_payment_pending"),
          amountreceived: z.number().positive().describe("Amount being paid for this item (capped to balance)")
        })
      ).min(1).describe("List of fee items to pay with their respective amounts")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid      = resolveColid(params.colid);
      const user       = resolveUser();
      const paiddate   = params.paiddate ? new Date(params.paiddate) : new Date();

      if (Number.isNaN(paiddate.getTime())) {
        return text({ success: false, error: "Invalid paiddate format. Use YYYY-MM-DD." });
      }

      const updated  = [];
      const skipped  = [];
      const notFound = [];

      for (const item of params.items) {
        const amountReceived = safeNum(item.amountreceived);
        if (!item.id || amountReceived <= 0) {
          skipped.push({ id: item.id, reason: "amount must be > 0" });
          continue;
        }

        // Fetch record — must belong to this colid
        const ledger = await LedgerstudCounter.findOne({ _id: item.id, colid });
        if (!ledger) {
          notFound.push(item.id);
          continue;
        }

        const currentPaid    = safeNum(ledger.paid);
        const currentBalance = Math.max(0, safeNum(ledger.balance));
        const applied        = Math.min(amountReceived, currentBalance);

        if (applied <= 0) {
          skipped.push({ id: item.id, student: ledger.student, feeitem: ledger.feeitem, reason: "balance is already 0" });
          continue;
        }

        const newPaid    = currentPaid + applied;
        const newBalance = Math.max(0, currentBalance - applied);

        // Append history entry (mirrors backend exactly)
        const history = Array.isArray(ledger.approvalhistory) ? ledger.approvalhistory : [];
        history.push({
          action:         "Counter Payment",
          user:           cleanStr(user),
          remarks:        cleanStr(params.remarks),
          date:           new Date(),
          paiddate,
          amountreceived: applied,
          oldpaid:        currentPaid,
          newpaid:        newPaid,
          oldbalance:     currentBalance,
          newbalance:     newBalance
        });

        ledger.paid            = newPaid;
        ledger.balance         = newBalance;
        ledger.paiddate        = paiddate;
        ledger.paymode         = cleanStr(params.paymode) || ledger.paymode;
        ledger.paydetails      = cleanStr(params.paydetails) || ledger.paydetails;
        ledger.feecounter      = cleanStr(user) || ledger.feecounter;
        ledger.status          = newBalance <= 0 ? "paid" : ledger.status;
        ledger.approvalhistory = history;

        await ledger.save();

        updated.push({
          _id:         String(ledger._id),
          student:     ledger.student,
          regno:       ledger.regno,
          feegroup:    ledger.feegroup,
          feeitem:     ledger.feeitem,
          amountApplied: applied,
          oldPaid:     currentPaid,
          newPaid,
          oldBalance:  currentBalance,
          newBalance,
          status:      ledger.status
        });
      }

      if (!updated.length) {
        return text({
          success:  false,
          error:    "No valid payment items were updated",
          skipped,
          notFound
        });
      }

      return text({
        success:      true,
        updatedCount: updated.length,
        skippedCount: skipped.length,
        notFoundCount:notFound.length,
        totalApplied: updated.reduce((s, u) => s + u.amountApplied, 0),
        paiddate:     paiddate.toISOString().slice(0, 10),
        paymode:      params.paymode,
        updated,
        skipped,
        notFound
      });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 3. get_payment_history_for_student
  //    Returns approvalhistory from all ledger records for a given regno,
  //    showing the full audit trail of counter payments, concessions, etc.
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "get_payment_history_for_student",
    "Get the full payment history (audit trail) for a student's fee ledger records. " +
    "Returns approvalhistory entries from all matching ledger records, " +
    "showing each counter payment with amount applied, old/new balances, " +
    "payment mode, and who processed it.",
    {
      colid:        z.number().optional().describe("College ID (from session)"),
      regno:        z.string().min(1).describe("Student registration number"),
      academicyear: z.string().optional().describe("Filter by academic year"),
      feegroup:     z.string().optional().describe("Filter by fee group"),
      feeitem:      z.string().optional().describe("Filter by fee item")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);

      const query = { colid, regno: params.regno };
      if (params.academicyear) query.academicyear = params.academicyear;
      if (params.feegroup)     query.feegroup     = new RegExp(cleanStr(params.feegroup).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (params.feeitem)      query.feeitem      = new RegExp(cleanStr(params.feeitem).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

      const records = await LedgerstudCounter.find(query)
        .sort({ academicyear: -1, feegroup: 1, feeitem: 1 })
        .lean();

      if (!records.length) {
        return text({ success: false, error: `No ledger records found for regno: ${params.regno}` });
      }

      const result = records.map((r) => ({
        _id:          String(r._id),
        feegroup:     r.feegroup     || "",
        feeitem:      r.feeitem      || "",
        academicyear: r.academicyear || "",
        amount:       safeNum(r.amount),
        paid:         safeNum(r.paid),
        concession:   safeNum(r.concession),
        balance:      safeNum(r.balance),
        status:       r.status       || "",
        paymode:      r.paymode      || "",
        paiddate:     r.paiddate     ? new Date(r.paiddate).toISOString().slice(0, 10) : "",
        feecounter:   r.feecounter   || "",
        historyCount: Array.isArray(r.approvalhistory) ? r.approvalhistory.length : 0,
        history: (Array.isArray(r.approvalhistory) ? r.approvalhistory : []).map((h) => ({
          action:         h.action         || "",
          user:           h.user           || "",
          remarks:        h.remarks        || "",
          date:           h.date           ? new Date(h.date).toISOString().slice(0, 10)     : "",
          paiddate:       h.paiddate       ? new Date(h.paiddate).toISOString().slice(0, 10) : "",
          amountreceived: safeNum(h.amountreceived),
          oldpaid:        safeNum(h.oldpaid),
          newpaid:        safeNum(h.newpaid),
          oldbalance:     safeNum(h.oldbalance),
          newbalance:     safeNum(h.newbalance)
        }))
      }));

      const totals = sumRows(records);
      return text({
        success:  true,
        regno:    params.regno,
        student:  records[0]?.student || "",
        totals,
        records:  result
      });
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // 4. report_counter_payment_pending_summary
  //    Aggregate pending dues grouped by any dimension
  // ════════════════════════════════════════════════════════════════════════════
  server.tool(
    "report_counter_payment_pending_summary",
    "Summary of outstanding fee balances grouped by a chosen dimension. " +
    "Shows total amount, paid so far, and remaining balance per group. " +
    "Useful for understanding dues at a program, fee-group, or student level.",
    {
      colid:        z.number().optional().describe("College ID (from session)"),
      academicyear: z.string().optional().describe("Academic year"),
      programcode:  z.string().optional().describe("Program code"),
      regulation:   z.string().optional().describe("Regulation"),
      semester:     z.string().optional().describe("Semester"),
      feegroup:     z.string().optional().describe("Fee group"),
      feecategory:  z.string().optional().describe("Fee category"),
      group_by: z.enum([
        "programcode", "feegroup", "feeitem", "feecategory",
        "academicyear", "semester", "regulation", "student", "cashbook"
      ]).default("programcode").describe("Group results by this dimension")
    },
    async (params) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(params.colid);

      // Build query — always filter balance > 0 (pending only)
      const query = { colid, balance: { $gt: 0 } };
      if (params.academicyear) query.academicyear = params.academicyear;
      if (params.programcode)  query.programcode  = params.programcode;
      if (params.regulation)   query.regulation   = params.regulation;
      if (params.semester)     query.semester     = params.semester;
      if (params.feegroup)     query.feegroup     = new RegExp(cleanStr(params.feegroup).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (params.feecategory)  query.feecategory  = params.feecategory;

      const data = await LedgerstudCounter.find(query).lean();
      if (!data.length) return text({ success: true, count: 0, groups: [], grandTotal: {} });

      const groupBy = params.group_by ?? "programcode";

      // Group and aggregate
      const grouped = new Map();
      data.forEach((r) => {
        const key = cleanStr(r[groupBy]) || "(blank)";
        const cur = grouped.get(key) || { label: key, count: 0, studentCount: new Set(), amount: 0, paid: 0, concession: 0, balance: 0 };
        cur.count++;
        if (r.regno) cur.studentCount.add(r.regno);
        cur.amount     += safeNum(r.amount);
        cur.paid       += safeNum(r.paid);
        cur.concession += safeNum(r.concession);
        cur.balance    += safeNum(r.balance);
        grouped.set(key, cur);
      });

      const groups = [...grouped.values()]
        .map(({ studentCount, ...g }) => ({
          ...g,
          studentCount:  studentCount.size,
          collectionPct: safePct(g.paid, g.amount)
        }))
        .sort((a, b) => b.balance - a.balance);

      const grandTotal = sumRows(data);
      return text({
        success:      true,
        groupBy,
        count:        groups.length,
        grandTotal: {
          ...grandTotal,
          studentCount:  new Set(data.map((r) => r.regno).filter(Boolean)).size,
          collectionPct: safePct(grandTotal.paid, grandTotal.amount)
        },
        groups
      });
    }
  );
}
