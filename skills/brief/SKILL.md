---
description: Write a one-page call prep (a brief) for a meeting with the client from the engagement's ontology, structured by the ten sections of the Discovery Framework (business model, revenue model, funding model, technology model, competitive model, ideal customer profile, point of differentiation, industry trends, org chart, company news), with the open questions to ask first, every line labelled and cited to its file and line, website claims dated and weighed low, and meeting notes read after the files so a note that disagrees with a file is shown as a change to propose rather than as the answer. Reads only. TRIGGER when the user is preparing for a call, meeting, demo, kickoff, review or interview with a client or prospect, or says 'prep me for', 'brief me on', 'what should I ask on the call', 'call prep', 'before my meeting with', 'one-pager on the client'. SKIP when the user wants to read or search the ontology with no meeting in view (use /plum:learn), to write what a meeting said into the ontology (use /plum:improve ingest), to start or steer the discovery agent (use /plum:discovery), or is not signed in yet (use /plum:setup).
argument-hint: "[<meeting, person or topic>]"
allowed-tools: ["Bash", "AskUserQuestion", "Read", "Write", "mcp__plugin_plum_Plum__list_ontology_files", "mcp__plugin_plum_Plum__get_ontology_file", "mcp__plugin_plum_Plum__search_ontology", "mcp__plugin_plum_Plum__exec_bash", "mcp__plugin_plum_Plum__list_granola_notes", "mcp__plugin_plum_Plum__get_granola_note", "mcp__plugin_plum_Plum__search_granola_notes", "mcp__plugin_plum_Plum__whoami", "mcp__plugin_plum_Plum__list_workspaces"]
---

# plum: Brief for a call

A brief is one page a consultant reads before a call with the client: what the firm already knows about the company, where that knowledge comes from, and what to ask because nobody knows yet. It is written from the ontology, the Markdown repository the team approves changes to, which holds one client per engagement folder; this workspace is one engagement, so the company is the one `AGENT.md` describes. Every statement in a file is labelled confirmed, inferred or unknown, and an unknown is an `**OPEN:**` line naming who could answer. The brief keeps those labels, puts the open lines first, and follows the ten sections of the firm's Discovery Framework in their order, so two briefs for two companies read the same way and nothing needs reordering by hand.

This skill reads. It never proposes a change: what the call teaches goes back through `/plum:improve ingest` afterwards.

## Output

The user wants the result, not the work. Do not narrate what you are about to do, which tool you are calling, or what you are checking; never write "Let me", "I'll", "First I'll" or a summary of your reasoning. Run the steps silently and answer with the brief only, in the shape under "Write the brief": a line that is inferred says so, a section the files say nothing about says "unknown", and nothing is added that the files do not say. Never state as fact what the files label inferred or unknown. When something fails, say what failed and the one command that fixes it, nothing else.

## Sources

The brief is read by a person before a call, so it carries no file paths, line numbers, commits or source ids; those are given when someone asks where a line comes from (`exec_bash` with `grep -n` finds the line, and its cited `sources/<id>.md` says what backs it).

- The label is the file's: confirmed, inferred or `OPEN`. Never upgrade one, and never state as fact what a file labels inferred.
- A line whose only source is a web page carries the page's fetched date: "(website, fetched 2026-10-11)".
- A meeting note is informal and dated: the file is the approved record. When a note disagrees with a file, the brief shows both under "Since the files" and names `/plum:improve ingest` as the way to propose the change; it never overrules the file.
- Meeting notes are machine transcribed. A name that does not fit what the files say is likely misheard; use the name the files use.
- A statement nothing backs is left out.

## Tool access

The `mcp__plugin_plum_Plum__*` tools come from this plugin's MCP server. When one is not directly callable (Claude Code defers MCP tools when many servers are configured), load it with ToolSearch, for example `select:mcp__plugin_plum_Plum__get_ontology_file`, then call it. If the tools still cannot be called, run the same tool from Bash; it prints the same result:

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/commands/tool.js" get_ontology_file '{"path":"AGENT.md"}'
node "${CLAUDE_PLUGIN_ROOT}/dist/commands/tool.js" exec_bash '{"command":"grep -rn \"OPEN:\" . | sort"}'
node "${CLAUDE_PLUGIN_ROOT}/dist/commands/tool.js" search_granola_notes '{"query":"kickoff"}'
```

`tool.js --list` prints every tool. `pageLink.js --page ontology [--path <file>]` prints the link to the Ontology page; never invent a link. Never substitute curl, git, the GitHub CLI, hand-written API calls, or files under `~/.config/plum` (the token there is a secret: do not read or print it). The repository is reached only through these tools; never clone it. If neither route works, tell the user to run `/mcp`, check that the Plum server is connected, and restart Claude Code, then stop.

## Steps

### 1. Scope

1. The company is the engagement this workspace is: `AGENT.md`'s business in brief names it. When `$ARGUMENTS` names another company, call `mcp__plugin_plum_Plum__list_workspaces`; when a workspace is that engagement, say that `/plum:setup workspace <name>` moves the plugin there, and stop; otherwise say the ontology holds nothing about that company, and stop.
2. `$ARGUMENTS` may name a meeting (words from its title, or a date), a person, or a topic. That is the focus: it picks which open questions come first and which notes are read. Without arguments the brief is for the next call with the company, whatever it is about.
3. Never ask what the meeting is about. A brief with no focus is still the one page the user needs.

### 2. Read the ontology first

1. Call `mcp__plugin_plum_Plum__get_ontology_file` on `AGENT.md` for the business in brief, the rules and the navigation. When the workspace has no files, say the ontology is empty and that `/plum:discovery start` or `/plum:improve` writes the first ones; stop.
2. For each of the ten sections, read whole the files the navigation routes to, and call `mcp__plugin_plum_Plum__search_ontology` with the section's words from the table below to catch files the navigation misses. Read `open-questions.md` when it exists, and call `mcp__plugin_plum_Plum__exec_bash` with `grep -rn "OPEN:" .` for every open line in place.
3. Keep each file's `as_of`. For a line that cites a `src_` id, read the id's `connector` and `fetched_at` from `sources/<id>.md` (one `exec_bash` with `grep -H "connector:\|fetched_at:" sources/*.md` covers them all).

The ontology is one engagement folder, so reading every file the navigation routes to is the right amount; never read a note's transcript to fill a section.

### 3. Then the meeting notes

1. Call `mcp__plugin_plum_Plum__search_granola_notes` with the focus words and the company's name; when the focus is a date, or the search finds nothing, call `mcp__plugin_plum_Plum__list_granola_notes`. Read the three most recent matching notes with `mcp__plugin_plum_Plum__get_granola_note` (the summary; the transcript only when the user asks for it).
2. The notes give three things: who the user is likely to meet (attendees, with titles when the note names them), what was said last time, and statements newer than the `as_of` of the file that owns their topic.
3. A note never fills a section on its own. A section with nothing in the files stays unknown, and what the note says about it goes under "Since the files"; a note statement that contradicts a file line goes there too, side by side with the line.

### 4. Weigh website claims

A line whose only source is a web page is shown with its fetched date ("website, fetched <date>") and never decides a section alone: a company's own site can change its home page headline within days of a crawl. When the fetch is older than 14 days, add "check" after the date. A line a person confirmed outranks a website line that disagrees, whatever their dates.

### 5. Write the brief

One page, about 60 lines; when it runs long, drop the least useful lines first. This shape, in this order:

```
# Brief: <company> · <focus, or "next call"> · <today's date>
From <n> ontology files (as of <latest as_of>) and <m> meeting notes (latest <date>).

## Ask first
1. <question in the file's words> · ask <who the file names>; <attendee> is on the call
2. <section the files leave unknown, as the framework's question>

## Since the files
- <what the note says> (<note title>, <date>, <who said it>) vs what the file says → /plum:improve ingest

## What we know
### Business model · how do they make money?
- <statement>, with "(inferred)" when the file labels it so
### Revenue model · how do they price?
unknown
…one heading per section, all ten, in the framework's order…

## People on the call
- <name>, <title> · last met <date> (<note title>)
```

- **Ask first** holds every `OPEN` line that touches the focus, then one question for each section the files leave unknown, in the framework's own words. Order: questions someone on the call can answer first, then the framework's order. At most ten; when more were left out, say how many and that `/plum:learn questions` lists them all.
- **Since the files** appears only when a note adds to or disagrees with a file; leave the heading out when it would be empty.
- **What we know** has all ten sections every time, in the framework's order, each heading carrying the framework's question; one to three lines per section; a section with nothing says "unknown". No line in it comes from a note.
- **People on the call** comes from the org chart files and the notes' attendees; a title the files do not give stays "title unknown".
- No narration, no closing summary, no advice beyond the questions. End with the Ontology page link from `pageLink.js --page ontology`.

### 6. Deliver

Print the brief in the conversation. When the user asks for a file, write it with `Write` where they say; never into the ontology repository, since a brief is a working document and not an approved file. What the call teaches goes back through `/plum:improve ingest <meeting>` afterwards.

## The ten sections

| Section | The framework's question | Words to search | Usually lives in |
|---------|--------------------------|-----------------|------------------|
| Business model | How do they make money? What job do they do for their customers? | business model, sells, customers pay, job to be done | `AGENT.md` business in brief, `strategy/` |
| Revenue model | How do they price their product or service? | pricing, plans, per seat, subscription, contract value | `strategy/pricing.md` |
| Funding model | How are they financed? | funding, raised, investors, bootstrapped, runway, profitable | `market/`, `strategy/` |
| Technology model | What tools do they use today, and how integrated are they? | CRM, Salesforce, stack, tools, integration, spreadsheet | `connectors/`, `systems/` |
| Competitive model | Who do they lose to, and why? | competitor, lose to, lost, alternative, switched, churned | `market/competitors/` |
| Ideal customer profile | Who do they sell best to? | ideal customer, ICP, segment, best customers, verticals | `gtm/` |
| Point of differentiation | Why do they win? | win, differentiation, why us, unique, chose us | `gtm/`, `strategy/` |
| Domain and industry trends | What technology, geopolitical or social pressures act on the business? | trend, regulation, pressure, market shift, prices | `market/` |
| Org chart | Who decides, and who reports to whom? | CEO, CTO, reports to, head of, decision maker, owner | `people/` |
| Company news | What press, releases or posts has the company put out recently? | announced, launched, press, news, release, hiring | `market/`, `notes/` |
