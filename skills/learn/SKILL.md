---
description: Read and learn from the workspace's ontology repository (the Markdown the team approves in git: AGENT.md, glossary, strategy, market, go-to-market, connectors, definitions, sources, open questions) and from the playbook it follows. Stage 1 of the plum pipeline; nothing here changes a file. TRIGGER when the user wants to see what the ontology holds, read or search a file, understand how the business works, what a term means, what evidence backs a statement, which questions are still open and who could answer them, how the firm's playbook says to do something, what an update changes or whether it merged, or says 'what does the ontology say about', 'show me the ontology', 'read AGENT.md', 'search the ontology for', 'what is still open', 'explain the ICP', 'how do we run discovery', 'what changed in that update'. SKIP when the user wants to change a file or open a pull request (use /plum:improve), to prepare for a call or meeting with the client (use /plum:brief), to add a skill, pattern, workflow or rule to the playbook (use /plum:harness), to chart imported records or make a client deliverable (use /plum:artifacts), or is not signed in yet (use /plum:setup).
argument-hint: "[tree|read <path>|search <words>|explain <topic>|questions|playbook|updates [id]]"
allowed-tools: ["Bash", "AskUserQuestion", "Read", "mcp__plugin_plum_Plum__list_ontology_files", "mcp__plugin_plum_Plum__get_ontology_file", "mcp__plugin_plum_Plum__search_ontology", "mcp__plugin_plum_Plum__exec_bash", "mcp__plugin_plum_Plum__list_ontology_updates", "mcp__plugin_plum_Plum__review_ontology_update", "mcp__plugin_plum_Plum__list_granola_notes", "mcp__plugin_plum_Plum__get_granola_note", "mcp__plugin_plum_Plum__search_granola_notes", "mcp__plugin_plum_Plum__whoami", "mcp__plugin_plum_Plum__list_workspaces", "mcp__plugin_plum_Plum__switch_workspace"]
---

# plum: Learn from the ontology

The ontology is a git repository of Markdown files the team approves changes to. One shared repository holds Plum Consulting's playbook at its root (`AGENT.md`, `skills/`, `patterns/`, `workflows/`, `templates/`, `glossary.md`) and one folder per client engagement under `engagements/`. The workspace reads either one engagement folder or the repository root, and every path you see is relative to what it reads. `AGENT.md` is the router: its rules, business in brief and navigation table say where each topic lives. Every statement in a file is labelled confirmed, inferred or unknown; an unknown is an `**OPEN:**` line naming who could answer.

This skill reads. It never proposes a change: that is `/plum:improve` (the ontology) and `/plum:harness` (the playbook), the next two stages of the pipeline.

## Output

The user wants the result, not the work. Do not narrate what you are about to do, which tool you are calling, or what you are checking; never write "Let me", "I'll", "First I'll" or a summary of your reasoning. Run the steps silently and answer with the outcome only: a short answer whose every statement carries its label and its file (for example "Agencies are the main channel (confirmed, gtm/inbound.md:14)."), a fenced file or diff when a step calls for one, or a single question through `AskUserQuestion`. Never state as fact what the files label inferred or unknown, and never add what the files do not say: when they are silent, say so and name the file that should hold it. When something fails, say what failed and the one command that fixes it, nothing else.

## Lineage

Every statement about the business in an answer names its label and its source, so a wrong answer can be traced and corrected where it was written:

- An ontology file is cited as `path:line`. `get_ontology_file` numbers its lines (the numbers are not part of the file); `exec_bash` with `grep -n` gives the number for one phrase.
- What backs a file line is its cited ids: `sources/<id>.md` says what kind of source it was, who provided it and its authority; a `clm_` id is a claim discovery took from a source; a meeting note is read with `get_granola_note` and cited by its title, date and note id, naming who said it.
- The label is the file's: confirmed, inferred or `OPEN`. Never upgrade one in an answer, and never state as fact what a file labels inferred.
- A statement none of these back is said to be unsourced, in that word, or left out.
- When a meeting note disagrees with a file, show the file line and the note's line side by side; the file is the approved record and the note is informal and dated, so the disagreement is a `/plum:improve` proposal, not a correction made in the answer.

The session-start hook states the short form of this rule to the model once per session, so a question asked outside this skill answers the same way.

## Workspace

The tools answer from one workspace: the engagement folder (or the repository root) the session banner names. When the request names another engagement or workspace of the organization ("the Dundas folder", "what does Stratis say about…"), move there first with `mcp__plugin_plum_Plum__switch_workspace` and that workspace's id (from the banner, or `mcp__plugin_plum_Plum__list_workspaces`), say so in one line, and answer from there; later requests stay there until another is named. When no workspace reads the named folder, say so and stop: never answer about one client from another's files.

## Tool access

The `mcp__plugin_plum_Plum__*` tools come from this plugin's MCP server. When one is not directly callable (Claude Code defers MCP tools when many servers are configured), load it with ToolSearch, for example `select:mcp__plugin_plum_Plum__list_ontology_files`, then call it. If the tools still cannot be called, run the same tool from Bash; it prints the same result:

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/commands/tool.js" list_ontology_files
node "${CLAUDE_PLUGIN_ROOT}/dist/commands/tool.js" get_ontology_file '{"path":"AGENT.md"}'
node "${CLAUDE_PLUGIN_ROOT}/dist/commands/tool.js" exec_bash '{"command":"grep -rn \"OPEN:\" . | sort"}'
```

`tool.js --list` prints every tool. `pageLink.js --page ontology [--path <file>]` prints the link to the Ontology page, optionally opened on one file; never invent a link. Never substitute curl, git, the GitHub CLI, hand-written API calls, or files under `~/.config/plum` (the token there is a secret: do not read or print it). The repository is reached only through these tools; never clone it. If neither route works, tell the user to run `/mcp`, check that the Plum server is connected, and restart Claude Code, then stop.

## Modes

Read `$ARGUMENTS` first. If its first token is one of the modes below, run that mode with the rest as its input. Otherwise, when the arguments ask a question or name a topic, run `explain` with them; with no arguments run `tree`.

| Mode | Trigger | What it does |
|------|---------|--------------|
| `tree` | `tree` (default without arguments) | The shape of the ontology: business in brief, folders and files, how much is open |
| `read` | `read <path>` | One file whole, with its recent changes and its link in the app |
| `search` | `search <words>` | The files and lines that mention something |
| `explain` | `explain <topic>` or a question | What the ontology says about a topic, statement by statement, with labels and sources |
| `questions` | `questions` | Every open question, where it is raised, and who could answer |
| `playbook` | `playbook [<topic>]` | How the firm says to work: the playbook's rules, skills, patterns and workflows |
| `updates` | `updates [<id>]` | Open and merged updates, or what one changes |

## Tree

1. Call `mcp__plugin_plum_Plum__list_ontology_files`. When the workspace has no files, say the ontology is empty and that discovery in the app, or `/plum:improve`, writes the first ones; stop.
2. Call `mcp__plugin_plum_Plum__get_ontology_file` on `AGENT.md`. Call `mcp__plugin_plum_Plum__exec_bash` with `grep -rc "OPEN:" . | grep -v ":0$" | sort` for where the gaps are.
3. Report: the business in brief as `AGENT.md` states it (with its label); the folders with their file counts, one line each, in the order of the navigation table; how many `OPEN` lines there are and the three files with most; and the Ontology page link from `pageLink.js --page ontology`. End with the one next step that fits: `/plum:learn questions` when much is open, `/plum:learn explain <topic>` otherwise.

## Read

1. With a file path, call `get_ontology_file` and show the file whole in a fenced block, then its recent changes (date and first line of each) and the link from `pageLink.js --page ontology --path <path>`. With a folder, call `list_ontology_files`, show the folder's files, and read its `README.md` for what lives there and the phrases people use. When the path does not exist, call `search_ontology` with its last segment and offer the nearest matches.

## Search

1. Call `mcp__plugin_plum_Plum__search_ontology` with the words the user said (folder READMEs list synonyms, so a README hit points at the owning folder). For an exact phrase, or to see every line, call `exec_bash` with `grep -rn "<phrase>" .`. Relay the matches as `path:line` with the line, best match first, and name the owning file in one sentence.

## Explain

1. Read `AGENT.md`'s navigation for the files that own the topic; read each whole with `get_ontology_file`; call `search_ontology` for the topic's words to catch files the navigation misses.
2. Answer from the files only. Every statement carries its label and `path:line`: confirmed, then inferred, then what is `OPEN`. When the user asks what backs a statement, name its cited sources (`sources/<id>.md` gives the kind of source, who provided it and its authority; a meeting note is read with `get_granola_note` when the file cites one). When two files disagree, show both lines and say which `AGENT.md` routes to.
3. When the files do not answer, say so in one line, name the file that should hold the answer, and point at `/plum:improve answer` (to settle it from what the user knows) or `/plum:improve` (to add it from a source).

## Questions

1. Call `get_ontology_file` on `open-questions.md` when it exists, and `exec_bash` with `grep -rn "OPEN:" .` for every open line in place. Merge them: one line per question with the file that raises it and who the file says could answer. Group by folder. When the user names a topic, keep only its questions.
2. End with how to settle one: `/plum:improve answer <question>` writes the answer into the file and closes the question in the same proposal.

## Playbook

1. Call `exec_bash` with `ls /playbook` to see whether the firm's playbook is mounted beside this engagement. When it is, read `/playbook/AGENT.md` and `/playbook/skills/README.md` there with `cat`. When the result says the playbook is unavailable, call `mcp__plugin_plum_Plum__list_workspaces`: the workspace that reads the repository root holds the playbook, and `/plum:setup workspace <name>` moves the plugin there; say so and stop.
2. Report the playbook's rules, its business in brief, and its skills, patterns and workflows as one-line rows (file and "use when"). With a topic, read the skill, pattern or workflow it routes to and show it whole in a fenced block. When something the user needs is missing from the playbook, say so and point at `/plum:harness`.

## Updates

1. Call `mcp__plugin_plum_Plum__list_ontology_updates` and relay each update's id, status, title, date and review link. Open updates wait for an editor or admin in the app or on GitHub; merged ones are in the approved ontology.
2. When the user names an update or asks what it changes, call `mcp__plugin_plum_Plum__review_ontology_update` with its id (and `path` for one file) and relay the file list and diffs in a fenced block. This plugin never approves an update.
