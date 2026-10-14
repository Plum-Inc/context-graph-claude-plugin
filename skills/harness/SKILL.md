---
description: Improve the harness itself: the playbook every engagement's agents read (the plum-consulting-ontology repository's root). Add or change a skill under skills/, context in AGENT.md (rules, business in brief, navigation), the glossary, a folder README or a pattern, a workflow under workflows/ that sequences skills, or a template, and open each change as a proposal (a pull request a reviewer approves). Stage 3 of the plum pipeline. TRIGGER when the user wants to add, write or change a skill, pattern, workflow, rule, template or navigation row in the playbook, teach the agents how the firm does something, turn a lesson from an engagement into a pattern, or says 'add a skill to the playbook', 'write a new skill', 'the agent should always', 'add a rule to AGENT.md', 'make this a pattern', 'add a workflow for onboarding a client', 'improve the harness'. SKIP when the user wants to change a client's ontology files (use /plum:improve), only to read the playbook (use /plum:learn playbook), to change this Claude Code plugin's own skills (not a plum workspace), or is not signed in yet (use /plum:setup).
argument-hint: "[skill|context|pattern|workflow|template] <what to add or change>"
allowed-tools: ["Bash", "AskUserQuestion", "Read", "mcp__plugin_plum_Plum__list_ontology_files", "mcp__plugin_plum_Plum__get_ontology_file", "mcp__plugin_plum_Plum__search_ontology", "mcp__plugin_plum_Plum__exec_bash", "mcp__plugin_plum_Plum__preview_ontology_update", "mcp__plugin_plum_Plum__propose_ontology_update", "mcp__plugin_plum_Plum__list_ontology_updates", "mcp__plugin_plum_Plum__review_ontology_update", "mcp__plugin_plum_Plum__list_granola_notes", "mcp__plugin_plum_Plum__get_granola_note", "mcp__plugin_plum_Plum__whoami", "mcp__plugin_plum_Plum__list_workspaces", "mcp__plugin_plum_Plum__switch_workspace"]
---

# plum: Improve the harness

The harness is what every engagement's agents read before they work: the playbook at the root of the shared ontology repository. `AGENT.md` holds the firm's rules, business in brief and navigation; `skills/` one file per task (when to use it, the steps, what never to do); `patterns/` lessons that recur across engagements; `workflows/` sequences of skills with their handoffs; `templates/` the starting files of a new engagement; `glossary.md` the firm's words. A merged change here reaches every engagement at once, so the playbook never holds a client name, a person or a number: a lesson is written as the firm learned it, not as the client lived it. Every change is a proposal on the repository that an editor or admin approves in the app or on GitHub.

## Output

The user wants the result, not the work. Do not narrate what you are about to do, which tool you are calling, or what you are checking; never write "Let me", "I'll", "First I'll" or a summary of your reasoning. Run the steps silently and answer with the outcome only: the preview diff in a fenced block followed by one question through `AskUserQuestion`, or one or two lines once the proposal is open (for example "Opened pr_7f2a: Add skill: ingest-support-ticket (3 files). An editor approves it in the app or on GitHub." plus the review link). When something fails, say what failed and the one command that fixes it, nothing else.

## Tool access

The `mcp__plugin_plum_Plum__*` tools come from this plugin's MCP server. When one is not directly callable (Claude Code defers MCP tools when many servers are configured), load it with ToolSearch, for example `select:mcp__plugin_plum_Plum__list_workspaces`, then call it. If the tools still cannot be called, run the same tool from Bash; it prints the same result:

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/commands/tool.js" get_ontology_file '{"path":"skills/README.md"}'
node "${CLAUDE_PLUGIN_ROOT}/dist/commands/tool.js" switch_workspace '{"workspaceId":"<id>"}'
```

`tool.js --list` prints every tool. `pageLink.js --page ontology [--path <file>]` prints the link to the Ontology page; never invent a link. Never substitute curl, git, the GitHub CLI, hand-written API calls, or files under `~/.config/plum` (the token there is a secret: do not read or print it). The repository is reached only through these tools; never clone it or open a pull request by other means. If neither route works, tell the user to run `/mcp`, check that the Plum server is connected, and restart Claude Code, then stop.

## Modes

Read `$ARGUMENTS` first. If its first token is one of the modes below, run that mode with the rest as its input. Otherwise pick the mode from the request: a task the agents should know how to do is `skill`; a rule, a navigation row, a glossary term or a README is `context`; a lesson is `pattern`; a sequence of tasks with handoffs is `workflow`; starting files for a new engagement are `template`. When two fit, ask with `AskUserQuestion`.

| Mode | Trigger | What it does |
|------|---------|--------------|
| `skill` | `skill <task>` | Add or change one skill under `skills/`, with its README row and navigation row |
| `context` | `context <what>` | Change `AGENT.md` (rules, business in brief, navigation), `glossary.md`, a folder README or `open-questions.md` |
| `pattern` | `pattern <lesson>` | Record a lesson from an engagement under `patterns/`, scrubbed of client details |
| `workflow` | `workflow <name>` | Add or change a sequence of skills under `workflows/`, with its handoffs and sign-offs |
| `template` | `template <name>` | Change the starting files under `templates/` for a new engagement |

## Where the harness lives

The playbook is edited from a workspace that reads the repository root, where `AGENT.md` carries `playbook: true`. Do this first in every mode:

1. Call `mcp__plugin_plum_Plum__get_ontology_file` on `AGENT.md`. When its frontmatter has `playbook: true`, continue with the mode.
2. Otherwise this workspace is one client's engagement folder. Call `mcp__plugin_plum_Plum__list_workspaces`. When one workspace reads the repository root (it is listed without an engagement folder), ask with `AskUserQuestion`: "Move the plugin to <name> to change the playbook?" with options "Move" and "Not now". On "Move", call `mcp__plugin_plum_Plum__switch_workspace` with its id, read `AGENT.md` again to confirm the marker, remember the workspace you came from, and continue. On "Not now", stop.
3. When no workspace reads the root, say that an admin makes one from the app's sidebar ("New engagement" with "Playbook workspace" ticked), or points an existing one at the repository root from its settings in the sidebar (everyone in that workspace then reads the playbook), or that the playbook may be in another organization (`/plum:setup org`), and stop.

When you moved the plugin, end the session's answer with one line saying which workspace it is in now and that `/plum:setup workspace <previous name>` moves it back, and offer to do that.

## Ground rules for every change

- **Read the harness before changing it.** Read `AGENT.md` whole, the README of the folder you change, and one sibling file for the shape (`skills/write-definition.md` for a skill, a file under `patterns/` for a pattern). Call `mcp__plugin_plum_Plum__search_ontology` and `exec_bash` with `grep -rn` for the task's words: when a skill, pattern or workflow already covers it, say which and ask with `AskUserQuestion` whether to extend that one instead of adding another.
- **The firm's method, never the client's facts.** No client name, person, number, deal or date from an engagement. Take the steps from what the user said and what the conversation holds; when they are missing, ask once with `AskUserQuestion` rather than inventing a method, and write anything still unsettled as an `**OPEN:**` line naming who decides.
- **Send whole files**, frontmatter included: `type` (`skill`, `pattern`, `workflow`, `readme`, `agent`, `glossary`), `owner` (`system` or the team the user names), `status: draft`, `as_of: <today>`. Keep lines you were not asked to change exactly as they are.
- **Findable or it does not exist.** A new file gets its row in the folder's `README.md` table and, for a skill or workflow, a row in `AGENT.md`'s navigation written in the words people say, synonyms included. A new folder (`workflows/` the first time) gets a `README.md` of its own with the same frontmatter and a one-line table.
- **One topic per proposal.** Titles read "Add skill: <name>", "Change skill: <name>", "Add pattern: <name>", "Add workflow: <name>", "Change AGENT.md: <what>". Paths are lowercase hyphenated verb phrases (`skills/ingest-support-ticket.md`, `workflows/onboard-engagement.md`), never a noun alone.
- **The user decides.** Show the preview diff and open the proposal only after they say go. Never approve or merge: that is a reviewer's step in the app or on GitHub.

## Skill

1. Name the file for the task as a verb phrase. Read `skills/README.md` and an existing skill for the shape.
2. Write the file whole: the frontmatter block; a `# Title` in the imperative; one "Use when …" line; `## Steps` as a numbered list, each step one action with what it reads and what it produces; `## Never` as a bulleted list of what the skill forbids. When the skill came from an engagement, write what the firm learned, not what the client said.
3. Add a row to the table in `skills/README.md` (`| <file> | <use when> |`) and a row to `AGENT.md`'s navigation (`| <what people ask, synonyms included> | skills/<file> |`). For a change to an existing skill, send only the files that change.
4. Preview, confirm and open the proposal as in Propose below.

## Context

1. Read the file the change belongs to: `AGENT.md` for a rule (the `## Rules` list), the business in brief or a navigation row; `glossary.md` for a term; a folder `README.md` for what lives there and the phrases people use; `open-questions.md` for a question the firm has not settled. A rule is one line, imperative, about how agents work ("Read the skill for a task before doing it."), never a fact about a client. A navigation row's left column is the words people say; its right column is one canonical file or folder, never a copy.
2. Draft the whole file with the change in place, then preview, confirm and open the proposal as in Propose below.

## Pattern

1. Read `patterns/README.md` and one pattern for the shape. Name the file for the lesson as a short phrase (`account-industry-is-not-company-industry.md`).
2. Write the file whole: frontmatter with `type: pattern`; a `# Title` that states the lesson; a "**Lesson:**" line; "**How it was learned:**" in one or two sentences without the client, the person or the number; "**What to do:**" as a short list, naming the skill or workflow it changes when one does; "**Also known as:**" the words people use for it. Add its row to `patterns/README.md`.
3. When the lesson changes how a skill should work, say so and offer to change that skill in the same proposal (one topic: the lesson and the step it corrects).
4. Preview, confirm and open the proposal as in Propose below.

## Workflow

A workflow sequences skills: what runs first, what each stage takes and produces, who signs off between stages, and where it stops when something is missing.

1. Read `workflows/README.md` when it exists (create it when it does not, with the same frontmatter as `skills/README.md` and a one-row table) and `skills/README.md` so every stage names a skill that exists. Name the file as a verb phrase (`workflows/onboard-engagement.md`).
2. Write the file whole: frontmatter with `type: workflow`; a `# Title` in the imperative; one "Use when …" line; `## Stages` as a numbered list where each stage names the skill it runs (`skills/<file>`), what it needs from the stage before, what it produces, and who signs off before the next; `## Handoffs` for what moves between stages and where it is written; `## Stop when` for the conditions that end the workflow early (a missing source, an unanswered question, a reviewer's no); `## Never`. A stage that needs a skill the playbook lacks becomes an `**OPEN:**` line, and you offer `/plum:harness skill` for it.
3. Add the row to `workflows/README.md` and the navigation row to `AGENT.md`.
4. Preview, confirm and open the proposal as in Propose below.

## Template

1. Read `templates/README.md` and the files of the template you change (`list_ontology_files` shows them under `templates/`). A template is copied into a new engagement once, with `<Client>` replaced by the client's name, so every file keeps the `<Client>` placeholder and its `OPEN` lines where discovery fills things in.
2. Draft the files whole, add the row to `templates/README.md` for a new template folder, then preview, confirm and open the proposal as in Propose below.

## Propose

1. Call `mcp__plugin_plum_Plum__preview_ontology_update` with every file. Relay its diff in a fenced block (every hunk; a new file is shown as its line count and its first lines), say nothing is opened yet, and fix anything it says the repository would refuse (a path outside the layout, a missing frontmatter block). Drop files it reports unchanged.
2. Ask with `AskUserQuestion`: "Open a proposal with these N files?" with options "Open proposal", "Keep editing", "Drop it". On "Keep editing", take the next change and preview again.
3. On "Open proposal", call `mcp__plugin_plum_Plum__propose_ontology_update` with the title from the ground rules, a `rationale` that says what the change is for and where its steps come from (which engagement taught it, which meeting, which session), and the same files. Report one line: the proposal id, its title and file count, the review link, and that an editor or admin approves it in the app or on GitHub. Every engagement reads the change once it merges.
4. Failures: `INVALID_REQUEST` names the path, size or frontmatter problem; fix the file and preview again. `FORBIDDEN` means this account is a viewer, who cannot open proposals; say so. `SERVICE_UNAVAILABLE` means the workspace has no repository to write to; say so and stop. `mcp__plugin_plum_Plum__list_ontology_updates` and `review_ontology_update` show the open proposals and what one changes.
