# Student Data Upload — MCP Server

A Node.js MCP (Model Context Protocol) server that lets Claude directly manage student records in your MongoDB database — add one by one, update, delete, or bulk-upload from an Excel file.

---

## Tools exposed to Claude

### Authentication (call `login` first — everything else auto-fills)

| Tool | What it does |
|---|---|
| `login` | Sign in with email + password. Stores `colid`, `user`, `name`, `role`, `insname` and all session fields (mirrors frontend `global1`) |
| `get_session` | Show the current session — who is logged in, colid, role, institution, etc. |
| `logout` | Clear the session |

### Student data (colid + user auto-injected from session after login)

| Tool | What it does |
|---|---|
| `list_students` | List all students for your college |
| `add_student` | Add a single student record |
| `update_student` | Update a student by MongoDB `_id` |
| `delete_student` | Delete a student by MongoDB `_id` |
| `bulk_upload_from_excel` | Read an `.xlsx` file and upsert all rows |
| `bulk_upload_from_json` | Accept a JSON array and upsert all rows |
| `download_excel_template` | Generate a blank Excel template with the right headers |

---

## Step 1 — Prerequisites

Make sure you have:

- **Node.js 18+** installed  
  Check: `node -v`  
  Download: https://nodejs.org

- **npm** (comes with Node)  
  Check: `npm -v`

---

## Step 2 — Configure the database

Open (or create) the `.env` file in this folder:

```
/Users/suman/Documents/claude/mcp server/.env
```

Set your MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://user3:Hello123456@cluster0.bhzac.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

> The connection string above already matches `DATABASE2` from the backend `config.env`.  
> Change it if you use a different database.

---

## Step 3 — Install dependencies

Open Terminal and run:

```bash
cd "/Users/suman/Documents/claude/mcp server"
npm install
```

---

## Step 4 — Test the server locally

Run it directly to verify it starts without errors:

```bash
cd "/Users/suman/Documents/claude/mcp server"
node index.js
```

The server uses **stdio** transport (no HTTP port). It will appear to hang — that is correct. It is waiting for MCP messages over stdin/stdout. Press `Ctrl+C` to stop it.

---

## Step 5 — Connect to Claude Desktop App

### Locate the Claude config file

On macOS:

```
~/Library/Application Support/Claude/claude_desktop_config.json
```

Open Terminal:

```bash
open ~/Library/Application\ Support/Claude/
```

If the file does not exist, create it.

### Add the MCP server entry

Edit `claude_desktop_config.json` and add the `mcpServers` section:

```json
{
  "mcpServers": {
    "student-data-upload": {
      "command": "node",
      "args": ["/Users/suman/Documents/claude/mcp server/index.js"],
      "env": {
        "MONGODB_URI": "mongodb+srv://user3:Hello123456@cluster0.bhzac.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
      }
    }
  }
}
```

> **Important:** Use the full absolute path to `index.js`. Do not use `~`.

### Restart Claude Desktop

Quit Claude completely (Cmd+Q), then reopen it.

### Verify the tools are loaded

Click the **plug icon** (⊕ or 🔌) in the Claude chat input area.  
You should see `student-data-upload` listed with all 7 tools.

---

## Step 6 — Use it in Claude

Try these prompts in Claude Desktop:

**Step 1 — Login first (always):**
```
Login with email admin@mycollege.edu and password MyPass123
```
Claude will call the `login` tool, authenticate against MongoDB, and store your `colid`, `user`, `name`, `role`, `insname` in the session. You never need to type colid or user again.

**Step 2 — Check your session:**
```
Show my session details
```

**Step 3 — List students (colid auto-used from login):**
```
List all students
```

**Step 4 — Add one student:**
```
Add a student: name=Ravi Kumar, email=ravi@example.com, regno=2024001, program=B.Sc CS, programcode=BSCS, semester=3, section=A
```

**Step 5 — Bulk upload from Excel:**
```
Upload students from the Excel file at /Users/suman/Desktop/students.xlsx
```

**Step 6 — Download Excel template:**
```
Download the student upload Excel template to /Users/suman/Desktop/student_template.xlsx
```

**Logout:**
```
Logout
```

---

## Step 7 — Connect to Claude Code (CLI)

If you use Claude Code in the terminal, add the server to your project's MCP config.

Create or edit `/Users/suman/Documents/claude/mcp server/.claude/settings.json`:

```json
{
  "mcpServers": {
    "student-data-upload": {
      "command": "node",
      "args": ["/Users/suman/Documents/claude/mcp server/index.js"],
      "env": {
        "MONGODB_URI": "mongodb+srv://user3:Hello123456@cluster0.bhzac.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
      }
    }
  }
}
```

Or add it globally at `~/.claude/settings.json` to make it available in every project.

Then restart Claude Code. Verify with:

```
/mcp
```

---

## Step 8 — Deploy (Optional — run on a server)

If you want the MCP server to run on a remote machine (e.g. for team use):

### Option A — Keep stdio, run locally

The stdio transport is designed to run locally alongside Claude Desktop. No deployment needed — Claude Desktop launches the process automatically.

### Option B — Deploy as a background process with PM2

```bash
npm install -g pm2
cd "/Users/suman/Documents/claude/mcp server"
pm2 start index.js --name student-mcp
pm2 save
pm2 startup   # follow the printed command to auto-start on reboot
```

Check logs:

```bash
pm2 logs student-mcp
```

### Option C — Docker

Create a `Dockerfile` in the mcp server folder:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["node", "index.js"]
```

Build and run:

```bash
docker build -t student-mcp .
docker run -e MONGODB_URI="your-connection-string" student-mcp
```

---

## Excel File Format

The first row must be headers. The only required column is **email**.

| Column | Notes |
|---|---|
| name | Full name |
| regno | Registration number |
| email | **Required**, must be unique |
| phone | Mobile number |
| program | e.g. B.Sc Computer Science |
| programcode | e.g. BSCS |
| regulation | e.g. 2021 |
| Major / Minor / AEC / SEC / VAC / IDC | Subject electives |
| academicyear | e.g. 2024-25 |
| admissionyear | e.g. 2023-24 |
| rollno | Roll number |
| gender | Male / Female / Not specified |
| category | General / SC / ST / OBC |
| state / city / district / pincode | Address fields |
| guardianname / guardianmobile / guardianemail | Parent info |
| semester | 1 – 10 |
| section | e.g. A |

Download the template from Claude:
```
Download the student upload Excel template to /Users/suman/Desktop/student_template.xlsx
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `MONGODB_URI not set` | Check that `.env` file exists in the mcp server folder |
| `Tools not appearing in Claude` | Restart Claude Desktop fully (Cmd+Q then reopen) |
| `MongoServerError: bad auth` | Check username/password in the MongoDB URI |
| `Cannot find module` | Run `npm install` in the mcp server folder |
| Server hangs on start | Normal — stdio MCP servers wait for input |

---

## File Structure

```
mcp server/
├── index.js          ← MCP server (all tools)
├── package.json
├── .env              ← your MongoDB URI (not committed)
├── .env.example      ← template for .env
└── README.md         ← this file
```
