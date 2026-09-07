# Snyk Agent Scan

Scan agent components (MCP servers, skills) for prompt injections, malware, and vulnerabilities.

**Repository:** https://github.com/snyk/agent-scan

---

## Setup

1. Get your API token from [https://app.snyk.io/account](https://app.snyk.io/account)
2. Set environment variable:

   ```bash
   export SNYK_TOKEN=your-api-token-here
   ```

3. Install `uv`: https://docs.astral.sh/uv/getting-started/installation/

---

## Scan Commands

**Scan entire machine:**

```bash
uvx snyk-agent-scan@latest
```

**Scan specific location:**

```bash
uvx snyk-agent-scan@latest ~/.vscode/mcp.json
uvx snyk-agent-scan@latest ~/.claude/skills
uvx snyk-agent-scan@latest ~/path/to/SKILL.md
```

**Skip skills:**

```bash
uvx snyk-agent-scan@latest --no-skills
```

---

## ⚠️ Security Warning

Agent Scan executes MCP server commands during scanning. For untrusted configs, use a sandbox (Docker/VM) before running the scan.

For more details, visit the [GitHub repository](https://github.com/snyk/agent-scan).

