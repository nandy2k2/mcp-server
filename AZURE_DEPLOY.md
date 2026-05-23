# Azure Deployment Guide — Student Data MCP Server

Two files are used:
| File | Purpose |
|---|---|
| `index.js` | **Local** — stdio transport, works with Claude Desktop on your Mac |
| `server.js` | **Azure** — HTTP/SSE transport, accessible from anywhere |

---

## Architecture on Azure

```
Claude Desktop / Claude Code (your laptop)
        │
        │  HTTPS   x-api-key header
        ▼
Azure App Service  ──────────────────────────────────────────
  server.js (Express + StreamableHTTPServerTransport)
        │  POST/GET /mcp
        │
        ▼
MongoDB Atlas (same cluster used by your backend)
```

---

## Prerequisites

Install these on your Mac before starting:

1. **Azure CLI**
   ```bash
   brew install azure-cli
   az login          # opens browser, sign in to your Azure account
   ```

2. **Docker Desktop** (only for the Container option)
   Download: https://www.docker.com/products/docker-desktop/

3. **Node.js 20+**
   ```bash
   node -v   # must be ≥ 20
   ```

---

## Option A — Azure App Service (Node.js) — Easiest

### Step 1 — Create a Resource Group

```bash
az group create \
  --name rg-student-mcp \
  --location eastus
```

### Step 2 — Create an App Service Plan (free tier works)

```bash
az appservice plan create \
  --name plan-student-mcp \
  --resource-group rg-student-mcp \
  --sku B1 \
  --is-linux
```

> B1 = Basic tier ($13/month). Use F1 for free (30 min CPU/day limit).

### Step 3 — Create the Web App

```bash
az webapp create \
  --name student-mcp-server \
  --resource-group rg-student-mcp \
  --plan plan-student-mcp \
  --runtime "NODE:20-lts"
```

This gives you the URL: `https://student-mcp-server.azurewebsites.net`

### Step 4 — Set Environment Variables

```bash
az webapp config appsettings set \
  --name student-mcp-server \
  --resource-group rg-student-mcp \
  --settings \
    MONGODB_URI="mongodb+srv://user3:Hello123456@cluster0.bhzac.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0" \
    MCP_API_KEY="choose-a-strong-random-secret-here" \
    JWT_SECRET="kumropatash-kuchu-pablo-posto-1980" \
    JWT_EXPIRES_IN="200h" \
    NODE_ENV="production" \
    WEBSITE_NODE_DEFAULT_VERSION="~20"
```

> **Important:** Replace `MCP_API_KEY` with a strong random string — this is what Claude will use to authenticate to your server. You can generate one with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### Step 5 — Set the startup command

```bash
az webapp config set \
  --name student-mcp-server \
  --resource-group rg-student-mcp \
  --startup-file "node server.js"
```

### Step 6 — Deploy the code

From inside the `mcp server` folder:

```bash
cd "/Users/suman/Documents/claude/mcp server"

# Zip deploy — quickest method
zip -r deploy.zip . \
  --exclude "*.env" \
  --exclude ".git/*" \
  --exclude ".DS_Store" \
  --exclude "deploy.zip"

az webapp deployment source config-zip \
  --name student-mcp-server \
  --resource-group rg-student-mcp \
  --src deploy.zip

rm deploy.zip
```

### Step 7 — Verify

```bash
curl https://student-mcp-server.azurewebsites.net/health
```

Expected response:
```json
{
  "status": "ok",
  "activeSessions": 0,
  "dbConnected": true,
  "uptime": 12
}
```

---

## Option B — Azure Container Apps (Docker) — More scalable

### Step 1 — Create Azure Container Registry

```bash
az acr create \
  --name studentmcpregistry \
  --resource-group rg-student-mcp \
  --sku Basic \
  --admin-enabled true
```

Get the credentials:

```bash
az acr credential show --name studentmcpregistry
# Note the username and password
```

### Step 2 — Build and push the Docker image

```bash
cd "/Users/suman/Documents/claude/mcp server"

# Login to ACR
az acr login --name studentmcpregistry

# Build and push
az acr build \
  --registry studentmcpregistry \
  --image student-mcp-server:latest \
  .
```

### Step 3 — Create Container Apps environment

```bash
az containerapp env create \
  --name env-student-mcp \
  --resource-group rg-student-mcp \
  --location eastus
```

### Step 4 — Deploy the container

```bash
# Get ACR password
ACR_PASSWORD=$(az acr credential show --name studentmcpregistry --query passwords[0].value -o tsv)

az containerapp create \
  --name student-mcp-server \
  --resource-group rg-student-mcp \
  --environment env-student-mcp \
  --image studentmcpregistry.azurecr.io/student-mcp-server:latest \
  --registry-server studentmcpregistry.azurecr.io \
  --registry-username studentmcpregistry \
  --registry-password "$ACR_PASSWORD" \
  --target-port 8000 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --env-vars \
    MONGODB_URI="mongodb+srv://user3:Hello123456@cluster0.bhzac.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0" \
    MCP_API_KEY="choose-a-strong-random-secret-here" \
    JWT_SECRET="kumropatash-kuchu-pablo-posto-1980" \
    JWT_EXPIRES_IN="200h" \
    NODE_ENV="production"
```

### Step 5 — Get the deployed URL

```bash
az containerapp show \
  --name student-mcp-server \
  --resource-group rg-student-mcp \
  --query properties.configuration.ingress.fqdn \
  -o tsv
```

This returns something like:
`student-mcp-server.nicefield-abc123.eastus.azurecontainerapps.io`

Your MCP URL will be:
`https://student-mcp-server.nicefield-abc123.eastus.azurecontainerapps.io/mcp`

---

## Step — Allow MongoDB Atlas traffic from Azure

MongoDB Atlas blocks unknown IPs by default.

**Option 1 (quick):** Allow all IPs — OK for development

In Atlas → Network Access → Add IP Address → `0.0.0.0/0`

**Option 2 (production):** Add Azure outbound IPs

```bash
# Get outbound IPs for App Service
az webapp show \
  --name student-mcp-server \
  --resource-group rg-student-mcp \
  --query outboundIpAddresses \
  -o tsv
```

Add each IP to Atlas → Network Access.

---

## Connecting Claude Desktop to the Azure Server

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "student-data-upload": {
      "url": "https://student-mcp-server.azurewebsites.net/mcp",
      "headers": {
        "x-api-key": "your-MCP_API_KEY-value-here"
      }
    }
  }
}
```

> Replace the URL with your actual Azure URL and the API key with the value you set in Step 4.

Restart Claude Desktop (Cmd+Q, reopen). The tools will appear under the plug icon.

---

## Connecting Claude Code (CLI) to the Azure Server

Edit `~/.claude/settings.json` (global) or `.claude/settings.json` (project):

```json
{
  "mcpServers": {
    "student-data-upload": {
      "type": "http",
      "url": "https://student-mcp-server.azurewebsites.net/mcp",
      "headers": {
        "x-api-key": "your-MCP_API_KEY-value-here"
      }
    }
  }
}
```

Verify with:
```bash
claude mcp list
```

---

## Connecting Claude.ai (claude.ai/settings) — Remote MCP

If you have Claude Pro/Team:

1. Go to **claude.ai → Settings → Integrations**
2. Click **Add Integration**
3. Enter:
   - **URL:** `https://student-mcp-server.azurewebsites.net/mcp`
   - **Header name:** `x-api-key`
   - **Header value:** your API key

---

## Using the server after connecting

The workflow in Claude is the same whether local or Azure:

```
1. Login with email admin@college.edu and password YourPassword
   → Claude calls 'login' tool → session stored for this connection

2. List all students
   → colid from login session used automatically

3. Add student name=Priya, email=priya@example.com, semester=3
   → colid + user injected from session

4. Upload students from /tmp/batch2024.xlsx
   → file must exist ON THE AZURE SERVER
   → For cloud use, prefer 'bulk_upload_from_json' instead
```

> **Note about Excel upload on Azure:** The `bulk_upload_from_excel` tool reads a file from the server's disk. On Azure App Service, use `/tmp/` for temporary files. A better approach for cloud is to use `bulk_upload_from_json` and paste the data directly.

---

## Updating the deployed server

### App Service (re-deploy):

```bash
cd "/Users/suman/Documents/claude/mcp server"
zip -r deploy.zip . --exclude "*.env" --exclude ".git/*" --exclude ".DS_Store" --exclude "deploy.zip" --exclude "node_modules/*"
az webapp deployment source config-zip \
  --name student-mcp-server \
  --resource-group rg-student-mcp \
  --src deploy.zip
rm deploy.zip
```

### Container Apps (rebuild + redeploy):

```bash
az acr build --registry studentmcpregistry --image student-mcp-server:latest .
az containerapp update \
  --name student-mcp-server \
  --resource-group rg-student-mcp \
  --image studentmcpregistry.azurecr.io/student-mcp-server:latest
```

---

## Viewing logs

### App Service:

```bash
az webapp log tail \
  --name student-mcp-server \
  --resource-group rg-student-mcp
```

### Container Apps:

```bash
az containerapp logs show \
  --name student-mcp-server \
  --resource-group rg-student-mcp \
  --follow
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ Yes | MongoDB Atlas connection string |
| `MCP_API_KEY` | ✅ Yes (prod) | API key Claude sends in `x-api-key` header |
| `JWT_SECRET` | ✅ Yes | Must match backend `config.env` JWT_SECRET |
| `JWT_EXPIRES_IN` | No | Default `200h` |
| `PORT` | No | Default `8000` (Azure sets this automatically) |
| `NODE_ENV` | No | Set to `production` on Azure |

---

## File Summary

```
mcp server/
├── index.js          ← LOCAL stdio MCP server (Claude Desktop on Mac)
├── server.js         ← AZURE HTTP MCP server (StreamableHTTP transport)
├── Dockerfile        ← For Azure Container Apps deployment
├── .dockerignore
├── .gitignore
├── package.json
├── .env              ← local secrets (never commit this)
├── .env.example      ← template
├── README.md         ← local usage + Claude Desktop config
└── AZURE_DEPLOY.md   ← this file
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `401 Unauthorized` from Claude | Check `x-api-key` in Claude config matches `MCP_API_KEY` in Azure |
| `503 Service Unavailable` | App still starting — wait 30s, check logs |
| `dbConnected: false` in /health | MongoDB URI wrong or Atlas IP not whitelisted |
| Tools not showing in Claude | Restart Claude Desktop; check URL has `/mcp` at end |
| `Session not found` error | Claude reconnected — call `login` again |
| `File not found` in bulk_upload | Use `bulk_upload_from_json` on Azure (no file system) |
| App Service restarts wiping sessions | Expected — always call `login` first in each chat |
