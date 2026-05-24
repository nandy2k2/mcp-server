/**
 * Program management tools — shared between index.js (stdio) and server.js (HTTP)
 *
 * Model   : mprograms  (mirrors backend Models/mprograms.js)
 * Routes  : mirrors backend controllers/mprogramsmanagementctlrds.js
 * No delete tool (by design).
 *
 * Usage:
 *   registerProgramTools(server, { requireAuth, resolveColid, resolveUser, connectDB })
 */

import { z } from "zod";
import mongoose from "mongoose";
import * as XLSX from "xlsx";
import * as fs from "fs";

// ─── MPrograms Mongoose schema ────────────────────────────────────────────────
const mprogramsSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  user:        { type: String, required: true },
  colid:       { type: Number, required: true },
  year:        { type: String },
  program:     { type: String },
  programcode: { type: String },
  type:        { type: String },
  level:       { type: String },
  Order:       { type: Number },
  status1:     { type: String },
  comments:    { type: String }
});

export const MPrograms = mongoose.models.mprograms
  || mongoose.model("mprograms", mprogramsSchema);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const clean = (v) => String(v ?? "").trim();
const toNum = (v) => { const n = Number(v); return Number.isNaN(n) ? 0 : n; };

/** Mirror of backend programPayload() in mprogramsmanagementctlrds.js */
function programPayload(body = {}, colid, user) {
  const program   = clean(body.program || body.name);
  const orderRaw  = body.Order ?? body.order ?? body.programorder ?? "";
  const parsedOrder = (orderRaw === "" || orderRaw == null) ? 0 : Number(orderRaw);
  return {
    name:        program || clean(body.name),
    user:        clean(body.user || user),
    colid:       toNum(body.colid || colid),
    year:        clean(body.year || body.academicyear || body.academicYear),
    program,
    programcode: clean(body.programcode || body.programCode),
    type:        clean(body.type),
    level:       clean(body.level),
    Order:       Number.isNaN(parsedOrder) ? 0 : parsedOrder,
    status1:     clean(body.status1 || body.status || "Active") || "Active",
    comments:    clean(body.comments)
  };
}

function serializeProgram(doc) {
  const d = doc.toObject ? doc.toObject() : doc;
  return {
    id:          String(d._id),
    program:     d.program,
    programcode: d.programcode,
    year:        d.year,
    level:       d.level,
    type:        d.type,
    Order:       d.Order,
    status1:     d.status1,
    comments:    d.comments,
    user:        d.user,
    colid:       d.colid
  };
}

// Excel column header → field aliases (mirrors frontend valueFromRow pattern)
const normalizeKey = (k) => String(k || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const aliasMap = {
  year:        ["year", "academicyear", "acadyear"],
  level:       ["level"],
  type:        ["type"],
  program:     ["program", "programmename", "programme", "name"],
  programcode: ["programcode", "programmecode", "code", "progcode"],
  Order:       ["order", "programorder", "seq", "sequence", "displayorder"],
  status1:     ["status1", "status"],
  comments:    ["comments", "remark", "remarks"]
};

function valueFromRow(row, field) {
  const normalized = {};
  for (const [k, v] of Object.entries(row)) normalized[normalizeKey(k)] = v;
  const keys = aliasMap[field] || [field.toLowerCase()];
  for (const key of keys) if (normalized[key] !== undefined) return normalized[key];
  return "";
}

function excelRowToBody(row) {
  const body = {};
  for (const field of Object.keys(aliasMap)) body[field] = valueFromRow(row, field);
  return body;
}

// ─── Tool registrar ───────────────────────────────────────────────────────────
/**
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server
 * @param {{ requireAuth: Function, resolveColid: Function, resolveUser: Function, connectDB: Function }} helpers
 */
export function registerProgramTools(server, { requireAuth, resolveColid, resolveUser, connectDB }) {
  const text = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });

  // ── list_programs ──────────────────────────────────────────────────────────
  server.tool(
    "list_programs",
    "List academic programs for your college. Login required. Optionally filter by year, level, type, status, programcode, or program name.",
    {
      year:        z.string().optional().describe("Filter by year e.g. 2024-25"),
      level:       z.string().optional().describe("Filter by level: UG / PG / Diploma / Certificate / PhD"),
      type:        z.string().optional().describe("Filter by type: Grant-in / Non Grant / Regular / Self financed"),
      status1:     z.string().optional().describe("Filter by status: Active or Inactive"),
      programcode: z.string().optional().describe("Exact program code filter"),
      program:     z.string().optional().describe("Partial program name search")
    },
    async ({ year, level, type, status1, programcode, program }) => {
      requireAuth();
      await connectDB();
      const colid  = resolveColid(undefined);
      const filter = { colid };
      if (year)        filter.year        = year;
      if (level)       filter.level       = level;
      if (type)        filter.type        = type;
      if (status1)     filter.status1     = status1;
      if (programcode) filter.programcode = programcode;
      if (program)     filter.program     = new RegExp(program.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const data = await MPrograms
        .find(filter)
        .sort({ year: -1, level: 1, type: 1, Order: 1, program: 1 })
        .lean();
      return text({ success: true, total: data.length, colid, programs: data.map(serializeProgram) });
    }
  );

  // ── get_program_options ────────────────────────────────────────────────────
  server.tool(
    "get_program_options",
    "Get all distinct year, type, level and status values that already exist in your college's program list. Useful before adding or filtering.",
    {},
    async () => {
      requireAuth();
      await connectDB();
      const colid = resolveColid(undefined);
      const [years, types, levels, statuses] = await Promise.all([
        MPrograms.distinct("year",    { colid }),
        MPrograms.distinct("type",    { colid }),
        MPrograms.distinct("level",   { colid }),
        MPrograms.distinct("status1", { colid })
      ]);
      return text({
        success:  true,
        colid,
        years:    years.filter(Boolean).sort(),
        types:    types.filter(Boolean).sort(),
        levels:   levels.filter(Boolean).sort(),
        statuses: statuses.filter(Boolean).sort()
      });
    }
  );

  // ── add_program ────────────────────────────────────────────────────────────
  server.tool(
    "add_program",
    "Add a single academic program. 'program' and 'programcode' are required. colid and user are taken from your login session.",
    {
      program:     z.string().min(1).describe("Program name e.g. B.Com"),
      programcode: z.string().min(1).describe("Program code e.g. BCOM"),
      year:        z.string().optional().default("2026-27").describe("Academic year e.g. 2026-27"),
      level:       z.string().optional().default("").describe("UG / PG / Diploma / Certificate / PhD"),
      type:        z.string().optional().default("").describe("Grant-in / Non Grant / Regular / Self financed"),
      Order:       z.number().int().optional().default(0).describe("Display sort order"),
      status1:     z.string().optional().default("Active").describe("Active or Inactive"),
      comments:    z.string().optional().default("").describe("Any remarks")
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid   = resolveColid(undefined);
      const user    = resolveUser(undefined);
      const payload = programPayload(args, colid, user);
      if (!payload.program || !payload.programcode) {
        return text({ error: "program and programcode are required" });
      }
      try {
        const doc = await MPrograms.create(payload);
        return text({ success: true, message: "Program added", program: serializeProgram(doc) });
      } catch (err) {
        return text({ error: err.message });
      }
    }
  );

  // ── update_program ─────────────────────────────────────────────────────────
  server.tool(
    "update_program",
    "Update an existing program by its MongoDB _id. Get the id from list_programs first. colid is taken from session.",
    {
      id:          z.string().describe("Program MongoDB _id (from list_programs)"),
      program:     z.string().min(1).describe("Program name"),
      programcode: z.string().min(1).describe("Program code"),
      year:        z.string().optional().default("").describe("Academic year"),
      level:       z.string().optional().default("").describe("UG / PG / Diploma / Certificate / PhD"),
      type:        z.string().optional().default("").describe("Type"),
      Order:       z.number().int().optional().default(0).describe("Display order"),
      status1:     z.string().optional().default("Active").describe("Active or Inactive"),
      comments:    z.string().optional().default("").describe("Remarks")
    },
    async (args) => {
      requireAuth();
      await connectDB();
      const colid   = resolveColid(undefined);
      const user    = resolveUser(undefined);
      const payload = programPayload(args, colid, user);
      if (!payload.program || !payload.programcode) {
        return text({ error: "program and programcode are required" });
      }
      try {
        const doc = await MPrograms.findOneAndUpdate(
          { _id: args.id, colid },
          payload,
          { new: true, runValidators: true }
        );
        if (!doc) return text({ error: "Program not found or does not belong to your college" });
        return text({ success: true, message: "Program updated", program: serializeProgram(doc) });
      } catch (err) {
        return text({ error: err.message });
      }
    }
  );

  // ── bulk_upload_programs_from_excel ────────────────────────────────────────
  server.tool(
    "bulk_upload_programs_from_excel",
    "Upload programs from an Excel file (.xlsx/.xls). First row must be headers. Required columns: program, programcode. Optional: year, level, type, Order, status1, comments.",
    {
      file_path: z.string().describe("Absolute path to the Excel file"),
      upsert:    z.boolean().optional().default(false)
                  .describe("false (default) = always insert as new rows. true = update existing row if programcode+colid already exists")
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

      const colid     = resolveColid(undefined);
      const user      = resolveUser(undefined);
      const errors    = [];
      let inserted = 0, updated = 0;

      for (let i = 0; i < excelRows.length; i++) {
        const rowNum  = i + 2;
        const payload = programPayload(excelRowToBody(excelRows[i]), colid, user);
        if (!payload.program || !payload.programcode) {
          errors.push({ row: rowNum, message: "program and programcode are required" });
          continue;
        }
        try {
          if (upsert) {
            const res = await MPrograms.updateOne(
              { colid, programcode: payload.programcode },
              { $set: payload },
              { upsert: true, runValidators: true }
            );
            res.upsertedCount > 0 ? inserted++ : updated++;
          } else {
            await MPrograms.create(payload);
            inserted++;
          }
        } catch (err) {
          errors.push({ row: rowNum, message: err.message });
        }
      }
      return text({
        success:     true,
        colid,
        total_rows:  excelRows.length,
        inserted,
        updated,
        error_count: errors.length,
        errors:      errors.slice(0, 20)
      });
    }
  );

  // ── bulk_upload_programs_from_json ─────────────────────────────────────────
  server.tool(
    "bulk_upload_programs_from_json",
    "Upload multiple programs by providing a JSON array. Each object must have 'program' and 'programcode'. colid and user are taken from your session.",
    {
      programs: z.array(z.object({
        program:     z.string(),
        programcode: z.string(),
        year:        z.string().optional(),
        level:       z.string().optional(),
        type:        z.string().optional(),
        Order:       z.number().optional(),
        status1:     z.string().optional(),
        comments:    z.string().optional()
      })).min(1).describe("Array of program objects — each needs at least program and programcode"),
      upsert: z.boolean().optional().default(false)
               .describe("false (default) = insert. true = update if programcode+colid exists")
    },
    async ({ programs, upsert }) => {
      requireAuth();
      await connectDB();
      const colid  = resolveColid(undefined);
      const user   = resolveUser(undefined);
      const errors = [];
      let inserted = 0, updated = 0;

      for (let i = 0; i < programs.length; i++) {
        const payload = programPayload(programs[i], colid, user);
        if (!payload.program || !payload.programcode) {
          errors.push({ row: i + 1, message: "program and programcode are required" });
          continue;
        }
        try {
          if (upsert) {
            const res = await MPrograms.updateOne(
              { colid, programcode: payload.programcode },
              { $set: payload },
              { upsert: true, runValidators: true }
            );
            res.upsertedCount > 0 ? inserted++ : updated++;
          } else {
            await MPrograms.create(payload);
            inserted++;
          }
        } catch (err) {
          errors.push({ row: i + 1, message: err.message });
        }
      }
      return text({
        success:     true,
        colid,
        total:       programs.length,
        inserted,
        updated,
        error_count: errors.length,
        errors:      errors.slice(0, 20)
      });
    }
  );

  // ── get_excel_template_programs ────────────────────────────────────────────
  server.tool(
    "get_excel_template_programs",
    "Generate a sample Excel template file for bulk program upload with all column headers and one example row.",
    {
      output_path: z.string().describe("Absolute path where the .xlsx template should be saved e.g. /tmp/program_template.xlsx")
    },
    async ({ output_path }) => {
      const sample = [{
        year: "2026-27", level: "UG", type: "Grant-in",
        program: "B.Com", programcode: "BCOM",
        Order: 1, status1: "Active", comments: ""
      }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sample), "Programs");
      XLSX.writeFile(wb, output_path);
      return { content: [{ type: "text", text: JSON.stringify({
        success: true, path: output_path,
        columns: Object.keys(sample[0]),
        note: "Fill from row 2 onward. 'program' and 'programcode' are required in every row."
      }, null, 2) }] };
    }
  );
}
