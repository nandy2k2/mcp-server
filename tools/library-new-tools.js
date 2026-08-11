/**
 * library-new-tools.js
 *
 * MCP tools for all library pages (LibraryNewPages.jsx + librarynewctlrds.js)
 *
 * Collections / Models (all unique names):
 *   LibraryMasterMcp       → librarymasterds
 *   LibraryAccessMcp       → libraryaccessds
 *   LibraryBookMcp         → librarybookds
 *   LibraryFineCatMcp      → libraryfinecategoryds
 *   LibraryRoleMaxBksMcp   → libraryrolemaxbooksds
 *   LibraryRoleMaxDaysMcp  → libraryrolemaxdaysds
 *   LibraryIssueMcp        → libraryissueds
 *   LibraryRequestMcp      → libraryrequestds
 *   LibraryTransferMcp     → librarytransferds
 *   LibraryLoanMcp         → libraryloands
 *   LibraryUserLookupMcp   → users  (for non-student user lookup)
 *
 * Pages covered:
 *   library-master          – library CRUD
 *   library-user-access     – grant/view user library access
 *   library-books           – book master CRUD
 *   library-fines           – fine category CRUD
 *   library-role-max-books  – role/category max-books policy
 *   library-role-max-days   – role/category max-days policy
 *   library-counter         – circulation desk (issue + return with eligibility & fine)
 *   library-issue           – bulk/manual issue
 *   library-return          – return (with fine calculation)
 *   library-requests        – librarian view of book requests
 *   library-transfer        – inter-library transfers
 *   library-loan            – inter-library loans
 *   library-reports         – KPI cards + summary
 *
 * NO delete tools (policy).
 */

import mongoose from "mongoose";
import { z } from "zod";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const libraryMasterSchema = new mongoose.Schema(
  { colid: Number, libraryname: String, description: String, type: { type: String, default: "University" }, status: { type: String, default: "Active" }, user: String },
  { strict: false, timestamps: true, collection: "librarymasterds" }
);

const libraryAccessSchema = new mongoose.Schema(
  { colid: Number, libraryid: String, libraryname: String, librarytype: String, name: String, email: String, role: String, department: String, status: { type: String, default: "Active" }, user: String },
  { strict: false, timestamps: true, collection: "libraryaccessds" }
);

const libraryBookSchema = new mongoose.Schema(
  { colid: Number, libraryid: String, libraryname: String, librarytype: String, accessionno: String, title: String, author: String, classification: String, publisher: String, publisheraddress: String, isbn: String, category: String, subject: String, edition: String, publicationyear: String, language: String, rackno: String, shelfno: String, location: String, supplier: String, invoiceno: String, invoicedate: Date, keywords: String, purchasedate: Date, price: Number, pages: Number, status: { type: String, default: "Available" }, remarks: String, user: String },
  { strict: false, timestamps: true, collection: "librarybookds" }
);

const libraryFineCatSchema = new mongoose.Schema(
  { colid: Number, category: String, fineperday: { type: Number, default: 0 }, graceperioddays: { type: Number, default: 0 }, maxfine: { type: Number, default: 0 }, status: { type: String, default: "Active" }, remarks: String, user: String },
  { strict: false, timestamps: true, collection: "libraryfinecategoryds" }
);

const libraryRoleMaxBksSchema = new mongoose.Schema(
  { colid: Number, role: String, bookcategory: String, noofbooks: { type: Number, default: 0 }, default: { type: String, default: "No" }, user: String },
  { strict: false, timestamps: true, collection: "libraryrolemaxbooksds" }
);

const libraryRoleMaxDaysSchema = new mongoose.Schema(
  { colid: Number, role: String, bookcategory: String, noofdays: { type: Number, default: 0 }, user: String },
  { strict: false, timestamps: true, collection: "libraryrolemaxdaysds" }
);

const libraryIssueSchema = new mongoose.Schema(
  { colid: Number, libraryid: String, libraryname: String, librarytype: String, accessionno: String, bookid: String, title: String, author: String, classification: String, publisher: String, publisheraddress: String, invoiceno: String, invoicedate: Date, keywords: String, category: String, student: String, regno: String, email: String, role: String, phone: String, program: String, programcode: String, academicyear: String, semester: String, section: String, issuetype: { type: String, default: "Regular" }, issuedate: { type: Date, default: Date.now }, duedate: Date, returndate: Date, status: { type: String, default: "Issued" }, fineamount: { type: Number, default: 0 }, ledgerid: String, remarks: String, issuedby: String, returnedby: String, requestid: String, user: String },
  { strict: false, timestamps: true, collection: "libraryissueds" }
);

const libraryRequestSchema = new mongoose.Schema(
  { colid: Number, libraryid: String, libraryname: String, librarytype: String, accessionno: String, bookid: String, title: String, author: String, classification: String, publisher: String, publisheraddress: String, invoiceno: String, invoicedate: Date, keywords: String, category: String, student: String, regno: String, email: String, phone: String, program: String, programcode: String, academicyear: String, semester: String, requestdate: { type: Date, default: Date.now }, status: { type: String, default: "Requested" }, actiondate: Date, actionby: String, remarks: String, user: String },
  { strict: false, timestamps: true, collection: "libraryrequestds" }
);

const libraryTransferSchema = new mongoose.Schema(
  { colid: Number, accessionno: String, bookid: String, title: String, author: String, classification: String, publisher: String, publisheraddress: String, invoiceno: String, invoicedate: Date, keywords: String, category: String, fromlibraryid: String, fromlibraryname: String, tolibraryid: String, tolibraryname: String, transferdate: { type: Date, default: Date.now }, status: { type: String, default: "Applied" }, requestedby: String, approvedby: String, approveddate: Date, remarks: String, user: String },
  { strict: false, timestamps: true, collection: "librarytransferds" }
);

const libraryLoanSchema = new mongoose.Schema(
  { colid: Number, accessionno: String, bookid: String, title: String, author: String, classification: String, publisher: String, publisheraddress: String, invoiceno: String, invoicedate: Date, keywords: String, category: String, fromlibraryid: String, fromlibraryname: String, tolibraryid: String, tolibraryname: String, loandate: { type: Date, default: Date.now }, duedate: Date, returndate: Date, status: { type: String, default: "Applied" }, requestedby: String, approvedby: String, approveddate: Date, remarks: String, user: String },
  { strict: false, timestamps: true, collection: "libraryloands" }
);

const libraryUserLookupSchema = new mongoose.Schema(
  { name: String, email: String, role: String, department: String, regno: String, phone: String, program: String, programcode: String, semester: String, academicyear: String, photo: String, colid: Number },
  { strict: false, collection: "users" }
);

// ─── Guarded model registrations ─────────────────────────────────────────────

const LibraryMasterMcp      = mongoose.models.LibraryMasterMcp      || mongoose.model("LibraryMasterMcp",      libraryMasterSchema,    "librarymasterds");
const LibraryAccessMcp      = mongoose.models.LibraryAccessMcp      || mongoose.model("LibraryAccessMcp",      libraryAccessSchema,    "libraryaccessds");
const LibraryBookMcp        = mongoose.models.LibraryBookMcp        || mongoose.model("LibraryBookMcp",        libraryBookSchema,      "librarybookds");
const LibraryFineCatMcp     = mongoose.models.LibraryFineCatMcp     || mongoose.model("LibraryFineCatMcp",     libraryFineCatSchema,   "libraryfinecategoryds");
const LibraryRoleMaxBksMcp  = mongoose.models.LibraryRoleMaxBksMcp  || mongoose.model("LibraryRoleMaxBksMcp",  libraryRoleMaxBksSchema,"libraryrolemaxbooksds");
const LibraryRoleMaxDaysMcp = mongoose.models.LibraryRoleMaxDaysMcp || mongoose.model("LibraryRoleMaxDaysMcp", libraryRoleMaxDaysSchema,"libraryrolemaxdaysds");
const LibraryIssueMcp       = mongoose.models.LibraryIssueMcp       || mongoose.model("LibraryIssueMcp",       libraryIssueSchema,     "libraryissueds");
const LibraryRequestMcp     = mongoose.models.LibraryRequestMcp     || mongoose.model("LibraryRequestMcp",     libraryRequestSchema,   "libraryrequestds");
const LibraryTransferMcp    = mongoose.models.LibraryTransferMcp    || mongoose.model("LibraryTransferMcp",    libraryTransferSchema,  "librarytransferds");
const LibraryLoanMcp        = mongoose.models.LibraryLoanMcp        || mongoose.model("LibraryLoanMcp",        libraryLoanSchema,      "libraryloands");
const LibraryUserLookupMcp  = mongoose.models.LibraryUserLookupMcp  || mongoose.model("LibraryUserLookupMcp",  libraryUserLookupSchema,"users");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const num = (v, fb = 0) => { const p = Number(v); return Number.isFinite(p) ? p : fb; };
const rx = (s) => new RegExp(String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

/** Find a user by registration-number or email (case-insensitive). */
const findUserByIdentifier = async (colid, identifier) => {
  const id = String(identifier || "").trim();
  if (!id) return null;
  return LibraryUserLookupMcp.findOne({
    colid,
    $or: [{ regno: id }, { email: id.toLowerCase() }, { email: rx(id) }]
  }).lean();
};

/** Get max books for a role + category (with fallback logic). */
const getMaxBooks = async (colid, role, category) => {
  const rules = await LibraryRoleMaxBksMcp.find({ colid }).lean();
  // Exact match first
  let r = rules.find((x) => x.role === role && x.bookcategory === category);
  if (!r) r = rules.find((x) => x.role === role && x.bookcategory === "All");
  if (!r) r = rules.find((x) => x.role === "All" && x.bookcategory === category);
  if (!r) r = rules.find((x) => x.default === "Yes" && x.role === role);
  if (!r) r = rules.find((x) => x.default === "Yes");
  return r ? num(r.noofbooks, 2) : 2;
};

/** Get max loan days for a role + category (with fallback logic, default 14). */
const getMaxDays = async (colid, role, category) => {
  const rules = await LibraryRoleMaxDaysMcp.find({ colid }).lean();
  let r = rules.find((x) => x.role === role && x.bookcategory === category);
  if (!r) r = rules.find((x) => x.role === role && x.bookcategory === "All");
  if (!r) r = rules.find((x) => x.role === "All" && x.bookcategory === category);
  if (!r) r = rules.find((x) => x.role === role);
  return r ? num(r.noofdays, 14) : 14;
};

/** Calculate fine for a returned issue record. */
const calcFine = async (colid, issue, returnDate) => {
  if (!issue.duedate) return { fineamount: 0, latedays: 0, billabledays: 0 };
  const ms = new Date(returnDate) - new Date(issue.duedate);
  const lateDays = Math.ceil(ms / 86400000);
  const fineCat = await LibraryFineCatMcp.findOne({ colid, category: issue.category, status: /^Active$/i }).lean();
  if (!fineCat || lateDays <= 0) return { fineamount: 0, latedays: Math.max(0, lateDays), billabledays: 0 };
  const grace = num(fineCat.graceperioddays, 0);
  const billabledays = Math.max(0, lateDays - grace);
  let fineamount = billabledays * num(fineCat.fineperday, 0);
  const maxfine = num(fineCat.maxfine, 0);
  if (maxfine > 0) fineamount = Math.min(fineamount, maxfine);
  return { fineamount, latedays: lateDays, billabledays };
};

// ─── Tool registration ────────────────────────────────────────────────────────

export function registerLibraryNewTools(server, { requireAuth, resolveColid, connectDB }) {

  // ── 1. get_library_users ─────────────────────────────────────────────────────
  server.tool(
    "get_library_users",
    "List non-student users for library access assignment. Returns users with name, email, role, department.",
    {
      search: z.string().optional().describe("Search name, email, department"),
      role: z.string().optional()
    },
    async ({ search, role }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const filter = { colid, role: { $not: /^Student$/i } };
      if (role) filter.role = role;
      if (search) { const s = rx(search); filter.$or = [{ name: s }, { email: s }, { department: s }]; }
      const data = await LibraryUserLookupMcp.find(filter).select("name email role department regno phone").sort({ name: 1 }).limit(1000).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 2. list_libraries ────────────────────────────────────────────────────────
  server.tool(
    "list_libraries",
    "List all libraries for the institution. Filter by name, type (University/Departmental/Special), or status.",
    {
      libraryname: z.string().optional(),
      type: z.enum(["University", "Departmental", "Special"]).optional(),
      status: z.string().optional()
    },
    async ({ libraryname, type, status }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (libraryname) filter.libraryname = rx(libraryname);
      if (type) filter.type = type;
      if (status) filter.status = rx(status);
      const data = await LibraryMasterMcp.find(filter).sort({ libraryname: 1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 3. save_library ──────────────────────────────────────────────────────────
  server.tool(
    "save_library",
    "Create or update a library. Required: libraryname. Provide id to update. Unique per (colid, libraryname).",
    {
      id: z.string().optional(),
      libraryname: z.string().optional(),
      description: z.string().optional(),
      type: z.enum(["University", "Departmental", "Special"]).optional(),
      status: z.string().optional().describe("Active or Inactive"),
      user: z.string().optional()
    },
    async ({ id, libraryname, description, type, status, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { colid, libraryname, description, type, status, user };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id
        ? await LibraryMasterMcp.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
        : await LibraryMasterMcp.findOneAndUpdate({ colid, libraryname }, payload, { new: true, upsert: true, setDefaultsOnInsert: true });
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 4. list_library_access ───────────────────────────────────────────────────
  server.tool(
    "list_library_access",
    "List user–library access assignments. Filter by libraryname, user email, role, or status.",
    {
      libraryname: z.string().optional(),
      email: z.string().optional(),
      name: z.string().optional(),
      role: z.string().optional(),
      department: z.string().optional(),
      status: z.string().optional()
    },
    async ({ libraryname, email, name, role, department, status }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (libraryname) filter.libraryname = rx(libraryname);
      if (email) filter.email = email.toLowerCase();
      if (name) filter.name = rx(name);
      if (role) filter.role = rx(role);
      if (department) filter.department = rx(department);
      if (status) filter.status = rx(status);
      const data = await LibraryAccessMcp.find(filter).sort({ name: 1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 5. save_library_access ───────────────────────────────────────────────────
  server.tool(
    "save_library_access",
    "Assign a user to one or more libraries. Required: userid (user _id), libraryids (array of library _ids). Upserts on (colid, libraryid, email) — safe to call repeatedly.",
    {
      userid: z.string().describe("User _id from get_library_users"),
      libraryids: z.array(z.string()).describe("Array of library _ids from list_libraries"),
      user: z.string().optional().describe("Who is performing the action (email)")
    },
    async ({ userid, libraryids, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const person = await LibraryUserLookupMcp.findById(userid).lean();
      if (!person) throw new Error("User not found");
      const libs = await LibraryMasterMcp.find({ _id: { $in: libraryids } }).lean();
      const results = [];
      for (const lib of libs) {
        const doc = await LibraryAccessMcp.findOneAndUpdate(
          { colid, libraryid: String(lib._id), email: person.email },
          { colid, libraryid: String(lib._id), libraryname: lib.libraryname, librarytype: lib.type, name: person.name, email: person.email, role: person.role, department: person.department, status: "Active", user: user || "" },
          { new: true, upsert: true }
        );
        results.push(doc);
      }
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", assigned: results.length, data: results }, null, 2) }] };
    }
  );

  // ── 6. list_library_books ────────────────────────────────────────────────────
  server.tool(
    "list_library_books",
    "List library book records with rich filter support. Use libraryid or libraryname to scope to a library. Filter by title, author, accessionno, category, status, etc.",
    {
      libraryid: z.string().optional(),
      libraryname: z.string().optional(),
      accessionno: z.string().optional(),
      title: z.string().optional(),
      author: z.string().optional(),
      classification: z.string().optional(),
      publisher: z.string().optional(),
      isbn: z.string().optional(),
      category: z.string().optional(),
      subject: z.string().optional(),
      status: z.string().optional().describe("Available, Issued, Lost, etc."),
      keywords: z.string().optional(),
      limit: z.number().int().min(1).max(5000).optional().default(1000)
    },
    async ({ libraryid, libraryname, accessionno, title, author, classification, publisher, isbn, category, subject, status, keywords, limit }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (libraryid) filter.libraryid = libraryid;
      if (libraryname) filter.libraryname = rx(libraryname);
      if (accessionno) filter.accessionno = rx(accessionno);
      if (title) filter.title = rx(title);
      if (author) filter.author = rx(author);
      if (classification) filter.classification = rx(classification);
      if (publisher) filter.publisher = rx(publisher);
      if (isbn) filter.isbn = isbn;
      if (category) filter.category = rx(category);
      if (subject) filter.subject = rx(subject);
      if (status) filter.status = rx(status);
      if (keywords) filter.keywords = rx(keywords);
      const data = await LibraryBookMcp.find(filter).sort({ title: 1 }).limit(limit || 1000).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 7. save_library_book ─────────────────────────────────────────────────────
  server.tool(
    "save_library_book",
    "Create or update a book record. Required: libraryid, accessionno, title. Upserts on (colid, libraryid, accessionno).",
    {
      id: z.string().optional().describe("Book _id to update directly"),
      libraryid: z.string().optional().describe("Library _id (from list_libraries)"),
      accessionno: z.string().optional(),
      title: z.string().optional(),
      author: z.string().optional(),
      classification: z.string().optional(),
      publisher: z.string().optional(),
      publisheraddress: z.string().optional(),
      isbn: z.string().optional(),
      category: z.string().optional(),
      subject: z.string().optional(),
      edition: z.string().optional(),
      publicationyear: z.string().optional(),
      language: z.string().optional(),
      rackno: z.string().optional(),
      shelfno: z.string().optional(),
      location: z.string().optional(),
      supplier: z.string().optional(),
      invoiceno: z.string().optional(),
      invoicedate: z.string().optional().describe("ISO date string"),
      keywords: z.string().optional(),
      purchasedate: z.string().optional().describe("ISO date string"),
      price: z.number().optional(),
      pages: z.number().int().optional(),
      status: z.string().optional().describe("Available, Issued, Lost, Damaged"),
      remarks: z.string().optional(),
      user: z.string().optional()
    },
    async ({ id, libraryid, accessionno, title, author, classification, publisher, publisheraddress, isbn, category, subject, edition, publicationyear, language, rackno, shelfno, location, supplier, invoiceno, invoicedate, keywords, purchasedate, price, pages, status, remarks, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      let libraryname, librarytype;
      if (libraryid) {
        const lib = await LibraryMasterMcp.findById(libraryid).lean();
        if (lib) { libraryname = lib.libraryname; librarytype = lib.type; }
      }
      const payload = { colid, libraryid, libraryname, librarytype, accessionno, title, author, classification, publisher, publisheraddress, isbn, category, subject, edition, publicationyear, language, rackno, shelfno, location, supplier, invoiceno, invoicedate: invoicedate ? new Date(invoicedate) : undefined, keywords, purchasedate: purchasedate ? new Date(purchasedate) : undefined, price, pages, status, remarks, user };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id
        ? await LibraryBookMcp.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
        : await LibraryBookMcp.findOneAndUpdate({ colid, libraryid, accessionno }, payload, { new: true, upsert: true, setDefaultsOnInsert: true });
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 8. list_library_fine_categories ─────────────────────────────────────────
  server.tool(
    "list_library_fine_categories",
    "List library fine categories with per-day rates, grace periods, and maximum fine caps.",
    { category: z.string().optional(), status: z.string().optional() },
    async ({ category, status }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (category) filter.category = rx(category);
      if (status) filter.status = rx(status);
      const data = await LibraryFineCatMcp.find(filter).sort({ category: 1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 9. save_library_fine_category ────────────────────────────────────────────
  server.tool(
    "save_library_fine_category",
    "Create or update a fine category. Required: category. Upserts on (colid, category). fineperday is the per-day charge, graceperioddays is the free grace window, maxfine is the cap (0 = no cap).",
    {
      id: z.string().optional(),
      category: z.string().optional(),
      fineperday: z.number().optional(),
      graceperioddays: z.number().int().optional(),
      maxfine: z.number().optional().describe("Maximum total fine — 0 means no cap"),
      status: z.string().optional(),
      remarks: z.string().optional(),
      user: z.string().optional()
    },
    async ({ id, category, fineperday, graceperioddays, maxfine, status, remarks, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { colid, category, fineperday, graceperioddays, maxfine, status, remarks, user };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id
        ? await LibraryFineCatMcp.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
        : await LibraryFineCatMcp.findOneAndUpdate({ colid, category }, payload, { new: true, upsert: true, setDefaultsOnInsert: true });
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 10. list_library_role_max_books ──────────────────────────────────────────
  server.tool(
    "list_library_role_max_books",
    "List role × book-category maximum book policies. Controls how many books each role may borrow in each category simultaneously.",
    { role: z.string().optional(), bookcategory: z.string().optional() },
    async ({ role, bookcategory }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (role) filter.role = rx(role);
      if (bookcategory) filter.bookcategory = rx(bookcategory);
      const data = await LibraryRoleMaxBksMcp.find(filter).sort({ role: 1, bookcategory: 1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 11. save_library_role_max_books ──────────────────────────────────────────
  server.tool(
    "save_library_role_max_books",
    "Create or update a max-books policy for a role + category. Required: role, bookcategory, noofbooks. default='Yes' makes this the fallback rule for the role.",
    {
      id: z.string().optional(),
      role: z.string().optional().describe("User role, e.g. Faculty, Student, Staff"),
      bookcategory: z.string().optional().describe("Book category — use 'All' for any category"),
      noofbooks: z.number().int().optional(),
      default: z.enum(["Yes", "No"]).optional(),
      user: z.string().optional()
    },
    async ({ id, role, bookcategory, noofbooks, default: def, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { colid, role, bookcategory, noofbooks, default: def, user };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id
        ? await LibraryRoleMaxBksMcp.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
        : await LibraryRoleMaxBksMcp.findOneAndUpdate({ colid, role, bookcategory }, payload, { new: true, upsert: true, setDefaultsOnInsert: true });
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 12. list_library_role_max_days ───────────────────────────────────────────
  server.tool(
    "list_library_role_max_days",
    "List role × book-category maximum loan-day policies. Controls the due-date period for each role and category.",
    { role: z.string().optional(), bookcategory: z.string().optional() },
    async ({ role, bookcategory }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (role) filter.role = rx(role);
      if (bookcategory) filter.bookcategory = rx(bookcategory);
      const data = await LibraryRoleMaxDaysMcp.find(filter).sort({ role: 1, bookcategory: 1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 13. save_library_role_max_days ───────────────────────────────────────────
  server.tool(
    "save_library_role_max_days",
    "Create or update a max-days policy for a role + category. noofdays sets the return period (default 14 if no rule found).",
    {
      id: z.string().optional(),
      role: z.string().optional(),
      bookcategory: z.string().optional(),
      noofdays: z.number().int().optional(),
      user: z.string().optional()
    },
    async ({ id, role, bookcategory, noofdays, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const payload = { colid, role, bookcategory, noofdays, user };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const data = id
        ? await LibraryRoleMaxDaysMcp.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
        : await LibraryRoleMaxDaysMcp.findOneAndUpdate({ colid, role, bookcategory }, payload, { new: true, upsert: true, setDefaultsOnInsert: true });
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 14. list_library_issues ───────────────────────────────────────────────────
  server.tool(
    "list_library_issues",
    "List book issue records. Use status='Issued' for currently active borrows; omit status for all records. Filter by libraryid, regno, accessionno, issuetype, category.",
    {
      libraryid: z.string().optional(),
      regno: z.string().optional(),
      email: z.string().optional(),
      accessionno: z.string().optional(),
      category: z.string().optional(),
      issuetype: z.string().optional(),
      status: z.string().optional().describe("Issued or Returned — omit for all"),
      limit: z.number().int().min(1).max(2000).optional().default(1000)
    },
    async ({ libraryid, regno, email, accessionno, category, issuetype, status, limit }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (libraryid) filter.libraryid = libraryid;
      if (regno) filter.regno = rx(regno);
      if (email) filter.email = email.toLowerCase();
      if (accessionno) filter.accessionno = rx(accessionno);
      if (category) filter.category = rx(category);
      if (issuetype) filter.issuetype = rx(issuetype);
      if (status) filter.status = rx(status);
      const data = await LibraryIssueMcp.find(filter).sort({ issuedate: -1 }).limit(limit || 1000).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 15. issue_library_book ────────────────────────────────────────────────────
  server.tool(
    "issue_library_book",
    "Issue a library book to a student or user. Required: libraryid, accessionno, regno, issuedate. The book must have status 'Available'. No eligibility check — use library_counter_issue for enforced eligibility checking.",
    {
      libraryid: z.string().describe("Library _id"),
      accessionno: z.string(),
      regno: z.string().describe("Student/user registration number or identifier"),
      student: z.string().optional().describe("Full name of student"),
      email: z.string().optional(),
      phone: z.string().optional(),
      issuetype: z.enum(["Regular", "Reference", "Reading Room", "Faculty Issue", "Special"]).optional().default("Regular"),
      issuedate: z.string().optional().describe("ISO date — defaults to today"),
      duedate: z.string().optional().describe("ISO date — auto-calculated if omitted"),
      requestid: z.string().optional().describe("LibraryRequest _id to mark as Issued"),
      user: z.string().optional()
    },
    async ({ libraryid, accessionno, regno, student, email, phone, issuetype, issuedate, duedate, requestid, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const book = await LibraryBookMcp.findOne({ colid, libraryid, accessionno }).lean();
      if (!book) throw new Error(`Book '${accessionno}' not found in this library`);
      if (!/^available$/i.test(book.status || "")) throw new Error(`Book status is '${book.status}' — only Available books can be issued`);
      const person = await findUserByIdentifier(colid, regno) || await findUserByIdentifier(colid, email || "");
      const role = person?.role || "Student";
      const noofdays = await getMaxDays(colid, role, book.category || "General");
      const issued = new Date(issuedate || Date.now());
      const due = duedate ? new Date(duedate) : new Date(issued.getTime() + noofdays * 86400000);
      const issue = await LibraryIssueMcp.create({
        colid, libraryid, libraryname: book.libraryname, librarytype: book.librarytype,
        accessionno, bookid: String(book._id), title: book.title, author: book.author,
        classification: book.classification, publisher: book.publisher, publisheraddress: book.publisheraddress,
        invoiceno: book.invoiceno, invoicedate: book.invoicedate, keywords: book.keywords, category: book.category,
        student: student || person?.name || regno, regno: person?.regno || regno,
        email: email || person?.email || "", role, phone: phone || person?.phone || "",
        program: person?.program || "", programcode: person?.programcode || "",
        academicyear: person?.academicyear || "", semester: person?.semester || "",
        issuetype: issuetype || "Regular", issuedate: issued, duedate: due, status: "Issued",
        issuedby: user || "", requestid: requestid || "", user: user || ""
      });
      await LibraryBookMcp.findOneAndUpdate({ colid, libraryid, accessionno }, { $set: { status: "Issued" } });
      if (requestid) await LibraryRequestMcp.findByIdAndUpdate(requestid, { $set: { status: "Issued", actiondate: new Date(), actionby: user || "" } });
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data: issue, duedate: due }, null, 2) }] };
    }
  );

  // ── 16. return_library_book ───────────────────────────────────────────────────
  server.tool(
    "return_library_book",
    "Return a borrowed book. Required: id (issue record _id). Fine is auto-calculated from the fine category and grace period. Returns fine amount and late days for reference.",
    {
      id: z.string().describe("Issue record _id (from list_library_issues)"),
      returndate: z.string().optional().describe("ISO date — defaults to today"),
      user: z.string().optional()
    },
    async ({ id, returndate, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const issue = await LibraryIssueMcp.findOne({ _id: id, colid });
      if (!issue) throw new Error("Issue record not found");
      if (/^returned$/i.test(issue.status || "")) throw new Error("Book is already returned");
      const retDate = new Date(returndate || Date.now());
      const { fineamount, latedays, billabledays } = await calcFine(colid, issue.toObject(), retDate);
      issue.returndate = retDate;
      issue.status = "Returned";
      issue.fineamount = fineamount;
      issue.returnedby = user || "";
      await issue.save();
      await LibraryBookMcp.findOneAndUpdate(
        { colid, accessionno: issue.accessionno, libraryid: issue.libraryid },
        { $set: { status: "Available" } }
      );
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data: issue, fineamount, latedays, billabledays }, null, 2) }] };
    }
  );

  // ── 17. library_counter_lookup_user ──────────────────────────────────────────
  server.tool(
    "library_counter_lookup_user",
    "Circulation desk: look up a user by registration number or email. Returns the user profile, currently issued books, and recent issue history.",
    {
      identifier: z.string().describe("Registration number or email address"),
      libraryid: z.string().optional()
    },
    async ({ identifier, libraryid }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const profile = await findUserByIdentifier(colid, identifier);
      if (!profile) return { content: [{ type: "text", text: JSON.stringify({ found: false, message: `No user found for '${identifier}'` }, null, 2) }] };
      const issueFilter = { colid, $or: [{ regno: profile.regno }, { email: profile.email }] };
      if (libraryid) issueFilter.libraryid = libraryid;
      const active = await LibraryIssueMcp.find({ ...issueFilter, status: "Issued" }).sort({ issuedate: -1 }).lean();
      const history = await LibraryIssueMcp.find(issueFilter).sort({ issuedate: -1 }).limit(100).lean();
      return { content: [{ type: "text", text: JSON.stringify({ found: true, profile, active, history, activeCount: active.length }, null, 2) }] };
    }
  );

  // ── 18. library_counter_lookup_book ──────────────────────────────────────────
  server.tool(
    "library_counter_lookup_book",
    "Circulation desk: look up a book by accession number. Returns book details and — if identifier is provided — eligibility to issue to that user.",
    {
      accessionno: z.string(),
      libraryid: z.string().optional(),
      identifier: z.string().optional().describe("User identifier (reg no or email) for eligibility check")
    },
    async ({ accessionno, libraryid, identifier }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const bookFilter = { colid, accessionno };
      if (libraryid) bookFilter.libraryid = libraryid;
      const book = await LibraryBookMcp.findOne(bookFilter).lean();
      if (!book) return { content: [{ type: "text", text: JSON.stringify({ found: false, message: `Book '${accessionno}' not found` }, null, 2) }] };
      const currentIssue = await LibraryIssueMcp.findOne({ colid, accessionno, status: "Issued" }).lean();
      let eligibility = null;
      if (identifier) {
        const person = await findUserByIdentifier(colid, identifier);
        if (person) {
          const role = person.role || "Student";
          const cat = book.category || "General";
          const maxBooks = await getMaxBooks(colid, role, cat);
          const activeCount = await LibraryIssueMcp.countDocuments({ colid, $or: [{ regno: person.regno }, { email: person.email }], status: "Issued", category: cat });
          const noofdays = await getMaxDays(colid, role, cat);
          const issuedate = new Date();
          const duedate = new Date(issuedate.getTime() + noofdays * 86400000);
          const allowed = book.status === "Available" && activeCount < maxBooks;
          eligibility = { allowed, activeCount, maxBooks, noofdays, issuedate, duedate, message: !allowed ? (book.status !== "Available" ? `Book is ${book.status}` : `Max books limit reached (${activeCount}/${maxBooks} in this category)`) : "Eligible to borrow" };
        }
      }
      return { content: [{ type: "text", text: JSON.stringify({ found: true, book, currentIssue, eligibility }, null, 2) }] };
    }
  );

  // ── 19. library_counter_issue ─────────────────────────────────────────────────
  server.tool(
    "library_counter_issue",
    "Circulation desk: issue a book with eligibility enforcement. Fails if user has reached max books for the category or book is not Available.",
    {
      identifier: z.string().describe("User identifier (reg no or email)"),
      accessionno: z.string(),
      libraryid: z.string().optional(),
      user: z.string().optional()
    },
    async ({ identifier, accessionno, libraryid, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const person = await findUserByIdentifier(colid, identifier);
      if (!person) throw new Error(`User '${identifier}' not found`);
      const bookFilter = { colid, accessionno };
      if (libraryid) bookFilter.libraryid = libraryid;
      const book = await LibraryBookMcp.findOne(bookFilter).lean();
      if (!book) throw new Error(`Book '${accessionno}' not found`);
      if (!/^available$/i.test(book.status || "")) throw new Error(`Book is '${book.status}' — not available`);
      const role = person.role || "Student";
      const cat = book.category || "General";
      const maxBooks = await getMaxBooks(colid, role, cat);
      const activeCount = await LibraryIssueMcp.countDocuments({ colid, $or: [{ regno: person.regno }, { email: person.email }], status: "Issued", category: cat });
      if (activeCount >= maxBooks) throw new Error(`Max books limit reached: ${activeCount}/${maxBooks} already issued in category '${cat}'`);
      const noofdays = await getMaxDays(colid, role, cat);
      const issuedate = new Date();
      const duedate = new Date(issuedate.getTime() + noofdays * 86400000);
      const issue = await LibraryIssueMcp.create({
        colid, libraryid: libraryid || book.libraryid, libraryname: book.libraryname, librarytype: book.librarytype,
        accessionno, bookid: String(book._id), title: book.title, author: book.author,
        classification: book.classification, publisher: book.publisher, category: book.category,
        student: person.name, regno: person.regno, email: person.email, role, phone: person.phone || "",
        program: person.program || "", programcode: person.programcode || "",
        academicyear: person.academicyear || "", semester: person.semester || "",
        issuetype: "Regular", issuedate, duedate, status: "Issued",
        issuedby: user || "", user: user || ""
      });
      await LibraryBookMcp.findOneAndUpdate({ colid, accessionno }, { $set: { status: "Issued" } });
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data: issue, eligibility: { allowed: true, activeCount: activeCount + 1, maxBooks, duedate }, duedate }, null, 2) }] };
    }
  );

  // ── 20. library_counter_return ────────────────────────────────────────────────
  server.tool(
    "library_counter_return",
    "Circulation desk: return a borrowed book. Calculates fine automatically from grace period and per-day rate. Returns fineamount and latedays.",
    {
      id: z.string().describe("Issue record _id"),
      returndate: z.string().optional().describe("ISO date — defaults to now"),
      user: z.string().optional()
    },
    async ({ id, returndate, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const issue = await LibraryIssueMcp.findOne({ _id: id, colid });
      if (!issue) throw new Error("Issue record not found");
      if (/^returned$/i.test(issue.status || "")) throw new Error("Already returned");
      const retDate = new Date(returndate || Date.now());
      const { fineamount, latedays, billabledays } = await calcFine(colid, issue.toObject(), retDate);
      issue.returndate = retDate;
      issue.status = "Returned";
      issue.fineamount = fineamount;
      issue.returnedby = user || "";
      await issue.save();
      await LibraryBookMcp.findOneAndUpdate({ colid, accessionno: issue.accessionno }, { $set: { status: "Available" } });
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data: issue, fineamount, latedays, billabledays, note: fineamount > 0 ? "Fine to be collected — add entry in fees module manually." : "No fine" }, null, 2) }] };
    }
  );

  // ── 21. list_library_requests ─────────────────────────────────────────────────
  server.tool(
    "list_library_requests",
    "List book requests from students/users. Filter by status (Requested, Issued, Rejected), regno, libraryid, or title.",
    {
      libraryid: z.string().optional(),
      regno: z.string().optional(),
      email: z.string().optional(),
      title: z.string().optional(),
      accessionno: z.string().optional(),
      status: z.string().optional().describe("Requested, Issued, Rejected"),
      limit: z.number().int().min(1).max(3000).optional().default(1000)
    },
    async ({ libraryid, regno, email, title, accessionno, status, limit }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (libraryid) filter.libraryid = libraryid;
      if (regno) filter.regno = rx(regno);
      if (email) filter.email = email.toLowerCase();
      if (title) filter.title = rx(title);
      if (accessionno) filter.accessionno = rx(accessionno);
      if (status) filter.status = rx(status);
      const data = await LibraryRequestMcp.find(filter).sort({ requestdate: -1 }).limit(limit || 1000).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 22. reject_library_request ────────────────────────────────────────────────
  server.tool(
    "reject_library_request",
    "Reject a book request. Sets status to 'Rejected' and records the rejection reason.",
    {
      id: z.string().describe("LibraryRequest _id"),
      remarks: z.string().optional().default("Rejected by librarian"),
      user: z.string().optional()
    },
    async ({ id, remarks, user }) => {
      requireAuth();
      await connectDB();
      const data = await LibraryRequestMcp.findByIdAndUpdate(id, {
        $set: { status: "Rejected", actiondate: new Date(), actionby: user || "", remarks: remarks || "Rejected by librarian" }
      }, { new: true });
      if (!data) throw new Error("Request not found");
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 23. list_library_transfers ────────────────────────────────────────────────
  server.tool(
    "list_library_transfers",
    "List inter-library transfer requests. Filter by from/to library name, accessionno, or status (Applied, Approved, Rejected).",
    {
      fromlibraryname: z.string().optional(),
      tolibraryname: z.string().optional(),
      accessionno: z.string().optional(),
      title: z.string().optional(),
      status: z.string().optional()
    },
    async ({ fromlibraryname, tolibraryname, accessionno, title, status }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (fromlibraryname) filter.fromlibraryname = rx(fromlibraryname);
      if (tolibraryname) filter.tolibraryname = rx(tolibraryname);
      if (accessionno) filter.accessionno = rx(accessionno);
      if (title) filter.title = rx(title);
      if (status) filter.status = rx(status);
      const data = await LibraryTransferMcp.find(filter).sort({ transferdate: -1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 24. create_library_transfer ───────────────────────────────────────────────
  server.tool(
    "create_library_transfer",
    "Create an inter-library transfer request (status: Applied). Required: bookid, tolibraryid. The book must be Available and belong to fromlibraryid.",
    {
      bookid: z.string().describe("Book _id from list_library_books"),
      tolibraryid: z.string().describe("Destination library _id"),
      remarks: z.string().optional(),
      user: z.string().optional()
    },
    async ({ bookid, tolibraryid, remarks, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const book = await LibraryBookMcp.findById(bookid).lean();
      if (!book) throw new Error("Book not found");
      if (!/^available$/i.test(book.status || "")) throw new Error(`Book is '${book.status}' — only Available books can be transferred`);
      const toLib = await LibraryMasterMcp.findById(tolibraryid).lean();
      const data = await LibraryTransferMcp.create({
        colid, accessionno: book.accessionno, bookid: String(book._id),
        title: book.title, author: book.author, classification: book.classification, publisher: book.publisher, publisheraddress: book.publisheraddress, invoiceno: book.invoiceno, invoicedate: book.invoicedate, keywords: book.keywords, category: book.category,
        fromlibraryid: book.libraryid, fromlibraryname: book.libraryname,
        tolibraryid: String(toLib?._id || tolibraryid), tolibraryname: toLib?.libraryname || "",
        status: "Applied", requestedby: user || "", remarks: remarks || "", user: user || ""
      });
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 25. approve_library_transfer ──────────────────────────────────────────────
  server.tool(
    "approve_library_transfer",
    "Approve or reject an inter-library transfer. On Approved: updates the book's libraryid and libraryname to the destination library.",
    {
      id: z.string().describe("Transfer _id"),
      status: z.enum(["Approved", "Rejected"]),
      remarks: z.string().optional(),
      user: z.string().optional()
    },
    async ({ id, status, remarks, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const transfer = await LibraryTransferMcp.findOne({ _id: id, colid });
      if (!transfer) throw new Error("Transfer not found");
      transfer.status = status;
      transfer.approvedby = user || "";
      transfer.approveddate = new Date();
      if (remarks) transfer.remarks = remarks;
      await transfer.save();
      if (status === "Approved") {
        await LibraryBookMcp.findOneAndUpdate(
          { colid, accessionno: transfer.accessionno },
          { $set: { libraryid: transfer.tolibraryid, libraryname: transfer.tolibraryname } }
        );
      }
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data: transfer }, null, 2) }] };
    }
  );

  // ── 26. list_library_loans ────────────────────────────────────────────────────
  server.tool(
    "list_library_loans",
    "List inter-library loan requests. Filter by from/to library name, accessionno, or status (Applied, Approved, Returned, Rejected).",
    {
      fromlibraryname: z.string().optional(),
      tolibraryname: z.string().optional(),
      accessionno: z.string().optional(),
      title: z.string().optional(),
      status: z.string().optional()
    },
    async ({ fromlibraryname, tolibraryname, accessionno, title, status }) => {
      requireAuth();
      await connectDB();
      const filter = { colid: resolveColid() };
      if (fromlibraryname) filter.fromlibraryname = rx(fromlibraryname);
      if (tolibraryname) filter.tolibraryname = rx(tolibraryname);
      if (accessionno) filter.accessionno = rx(accessionno);
      if (title) filter.title = rx(title);
      if (status) filter.status = rx(status);
      const data = await LibraryLoanMcp.find(filter).sort({ loandate: -1 }).lean();
      return { content: [{ type: "text", text: JSON.stringify({ data, total: data.length }, null, 2) }] };
    }
  );

  // ── 27. create_library_loan ───────────────────────────────────────────────────
  server.tool(
    "create_library_loan",
    "Create an inter-library loan request (status: Applied). Required: bookid, tolibraryid. duedate sets the expected return date.",
    {
      bookid: z.string().describe("Book _id"),
      tolibraryid: z.string().describe("Borrowing library _id"),
      duedate: z.string().optional().describe("ISO date for expected return"),
      remarks: z.string().optional(),
      user: z.string().optional()
    },
    async ({ bookid, tolibraryid, duedate, remarks, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const book = await LibraryBookMcp.findById(bookid).lean();
      if (!book) throw new Error("Book not found");
      if (!/^available$/i.test(book.status || "")) throw new Error(`Book is '${book.status}' — only Available books can be loaned`);
      const toLib = await LibraryMasterMcp.findById(tolibraryid).lean();
      const data = await LibraryLoanMcp.create({
        colid, accessionno: book.accessionno, bookid: String(book._id),
        title: book.title, author: book.author, classification: book.classification, publisher: book.publisher, publisheraddress: book.publisheraddress, invoiceno: book.invoiceno, invoicedate: book.invoicedate, keywords: book.keywords, category: book.category,
        fromlibraryid: book.libraryid, fromlibraryname: book.libraryname,
        tolibraryid: String(toLib?._id || tolibraryid), tolibraryname: toLib?.libraryname || "",
        duedate: duedate ? new Date(duedate) : undefined,
        status: "Applied", requestedby: user || "", remarks: remarks || "", user: user || ""
      });
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data }, null, 2) }] };
    }
  );

  // ── 28. approve_library_loan ──────────────────────────────────────────────────
  server.tool(
    "approve_library_loan",
    "Approve, reject, or mark a loan as Returned. On 'Returned': records returndate. Status options: Approved, Rejected, Returned.",
    {
      id: z.string().describe("Loan _id"),
      status: z.enum(["Approved", "Rejected", "Returned"]),
      remarks: z.string().optional(),
      user: z.string().optional()
    },
    async ({ id, status, remarks, user }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const loan = await LibraryLoanMcp.findOne({ _id: id, colid });
      if (!loan) throw new Error("Loan not found");
      loan.status = status;
      loan.approvedby = user || "";
      loan.approveddate = new Date();
      if (status === "Returned") loan.returndate = new Date();
      if (remarks) loan.remarks = remarks;
      await loan.save();
      return { content: [{ type: "text", text: JSON.stringify({ status: "success", data: loan }, null, 2) }] };
    }
  );

  // ── 29. get_library_reports ───────────────────────────────────────────────────
  server.tool(
    "get_library_reports",
    "Get library KPI summary: total books, available, issued, returned, pending requests, and total fine collected. Optionally filter by library and date range.",
    {
      libraryid: z.string().optional(),
      fromdate: z.string().optional().describe("ISO date"),
      todate: z.string().optional().describe("ISO date")
    },
    async ({ libraryid, fromdate, todate }) => {
      requireAuth();
      await connectDB();
      const colid = resolveColid();
      const bookFilter = { colid };
      if (libraryid) bookFilter.libraryid = libraryid;
      const [totalbooks, available] = await Promise.all([
        LibraryBookMcp.countDocuments(bookFilter),
        LibraryBookMcp.countDocuments({ ...bookFilter, status: "Available" })
      ]);
      const issueFilter = { colid };
      if (libraryid) issueFilter.libraryid = libraryid;
      if (fromdate || todate) {
        issueFilter.issuedate = {};
        if (fromdate) issueFilter.issuedate.$gte = new Date(fromdate);
        if (todate) issueFilter.issuedate.$lte = new Date(todate);
      }
      const issues = await LibraryIssueMcp.find(issueFilter).lean();
      const issued = issues.filter((i) => i.status === "Issued").length;
      const returned = issues.filter((i) => i.status === "Returned").length;
      const fine = issues.reduce((s, i) => s + (Number(i.fineamount) || 0), 0);
      const pendingRequests = await LibraryRequestMcp.countDocuments({ colid, status: "Requested" });
      const categoryCounts = {};
      issues.forEach((i) => { categoryCounts[i.category || "Unknown"] = (categoryCounts[i.category || "Unknown"] || 0) + 1; });
      const categoryData = Object.entries(categoryCounts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
      return { content: [{ type: "text", text: JSON.stringify({ cards: { totalbooks, available, issued, returned, pendingRequests, fine }, categoryData, totalIssues: issues.length }, null, 2) }] };
    }
  );
}
