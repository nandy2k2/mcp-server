#!/usr/bin/env node
/**
 * generate-token.js
 * -----------------
 * Run this in a terminal to get a JWT session_token for the MCP server.
 * Then paste the token into Claude:  "connect <token>"
 *
 * Usage:
 *   node generate-token.js <email> <password>
 *
 * Example:
 *   node generate-token.js admin@college.edu Admin@123
 */

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import * as path from "path";
import * as url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET  = process.env.JWT_SECRET  || "kumropatash-kuchu-pablo-posto-1980";
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || "200h";

if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI is not set in .env");
  process.exit(1);
}

const [,, email, password] = process.argv;

if (!email || !password) {
  console.error("Usage:  node generate-token.js <email> <password>");
  console.error("Example: node generate-token.js admin@college.edu Admin@123");
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  email:    { type: String },
  name:     { type: String },
  password: { type: String },
  role:     { type: String },
  colid:    { type: Number },
  status:   { type: Number }
}, { strict: false });

const User = mongoose.models.Users || mongoose.model("Users", userSchema);

try {
  await mongoose.connect(MONGODB_URI);

  const found = await User.findOne({ email: email.toLowerCase().trim() }).lean();
  if (!found) {
    console.error("ERROR: User not found —", email);
    process.exit(1);
  }
  if (found.password !== password) {
    console.error("ERROR: Incorrect password");
    process.exit(1);
  }
  if (found.status === 0) {
    console.error("ERROR: Account is blocked");
    process.exit(1);
  }

  const token = jwt.sign(
    { user: found.email, colid: String(found.colid) },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  console.log("\n✅ Token generated for:", found.name, `(${found.role})`);
  console.log("─".repeat(60));
  console.log(token);
  console.log("─".repeat(60));
  console.log("\nPaste into Claude:");
  console.log(`  connect ${token}`);
  console.log("\nToken valid for:", JWT_EXPIRES);

  await mongoose.disconnect();
  process.exit(0);
} catch (err) {
  console.error("ERROR:", err.message);
  process.exit(1);
}
