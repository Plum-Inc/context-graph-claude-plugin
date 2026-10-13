---
description: Improve the workspace's ontology repository from Claude Code: change or add its Markdown files (AGENT.md's navigation, folder READMEs, definitions, conventions, decision notes, strategy, market, connector notes, the glossary, open questions), settle an open question, bring in what a meeting note or document says, show the diff against the approved version, and open every change as a proposal (a pull request a reviewer approves). Stage 2 of the plum pipeline. TRIGGER when the user wants to edit, add, rewrite or retire an ontology file, write or change a definition, record a decision, answer or close an open question, update the ontology from a meeting or document, fix something the ontology gets wrong, open a pull request on the ontology repository, or says 'update the ontology', 'edit the ontology repo', 'write a definition file', 'the ICP is wrong, fix it', 'answer the open question about', 'add what we learned in the kickoff', 'open a PR on the ontology'. SKIP when the user only wants to read or search (use /plum:learn), to add a skill, pattern, workflow or rule to the playbook (use /plum:harness), to publish numbered ontology versions over imported records (use /plum:ontology), or is not signed in yet (use /plum:setup).
argument-hint: "[edit <change>|answer <question>|ingest <meeting or document>|updates [id]]"
allowed-tools: ["Bash", "AskUserQuestion", "Read", "mcp__plugin_plum_Plum__list_ontology_files", "mcp__plugin_plum_Plum__get_ontology_file", "mcp__plugin_plum_Plum__search_ontology", "mcp__plugin_plum_Plum__exec_bash", "mcp__plugin_plum_Plum__preview_ontology_update", "mcp__plugin_plum_Plum__propose_ontology_update", "mcp__plugin_plum_Plum__list_ontology_updates", "mcp__plugin_plum_Plum__review_ontology_update", "mcp__plugin_plum_Plum__list_granola_notes", "mcp__plugin_plum_Plum__get_granola_note", "mcp__plugin_plum_Plum__search_granola_notes", "mcp__plugin_plum_Plum__whoami", "mcp__plugin_plum_Plum__list_workspaces"]
---

# plum: Improve the ontology

The ontology is a git repository of Markdown files the team approves changes to. The workspace reads one engagement folder of the shared repository, or the repository root, and every path you see or send is relative to what it reads. Nothing here changes the approved ontology directly: every change is a proposal, a branch and pull request on the repository, and an editor or admin approves it in the app or merges it on GitHub. `/plum:learn` is the stage before this one (read first); `/plum:harness` is the stage after it (a lesson that applies beyond this client becomes a pattern, a skill or a workflow in the playbook).

## Output

The user wants the result, not the work. Do not narrate what you are about to do, which tool you are calling, or what you are checking; never write "Let me", "I'll", "First I'll" or a summary of your reasoning. Run the steps silently and answer with the outcome only: the preview diff in a fenced block followed by one question through `AskUserQuestion`, or one or two lines once the proposal is open (for example "Opened pr_7f2a: Define enterprise account for GTM (2 files). An editor approves it in the app or on GitHub." plus the review link). When something fails, say what failed and the one command that fixes it, nothing else.

## Tool access

The `mcp__plugin_plum_Plum__*` tools come from this plugin's MCP server. When one is not directly callable (Claude Code defers MCP tools when many servers are configured), load it with ToolSearch, for example `select:mcp__plugin_plum_Plum__preview_ontology_update`, then call it. If the tools still cannot be called, run the same tool from Bash; it prints the same result:

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/commands/tool.js" get_ontology_file '{"path":"AGENT.md"}'
node "${CLAUDE_PLUGIN_ROOT}/dist/commands/tool.js" preview_ontology_update '{"files":[{"path":"gtm/definitions/enterprise-account.md","content":"---\ntype: definition\n…"}]}'
```

`tool.js --list` prints every tool. `pageLink.js --page ontology [--path <file>]` prints the link to the Ontology page; never invent a link. Never substitute curl, git, the GitHub CLI, hand-written API calls, or files under `~/.config/plum` (the token there is a secret: do not read or print it). The repository is reached only through these tools; never clone it or open a pull request by other means. If neither route works, tell the user to run `/mcp`, check that the Plum server is connected, and restart Claude Code, then stop.

## Modes

Read `$ARGUMENTS` first. If its first token is one of the modes below, run that mode with the rest as its input. Otherwise, when the arguments describe a change, run `edit` with them as the request; with no arguments, ask with `AskUserQuestion` what should change, offering `/plum:learn questions` as the way to find out what is open.

| Mode | Trigger | What it does |
|------|---------|--------------|
| `edit` | `edit <change>` or a described change | Change or add files, show the diff, open one proposal when the user says go |
| `answer` | `answer <question>` | Settle an open question with what the user or a source says, and close it in the same proposal |
| `ingest` | `ingest <meeting or document>` | Read a meeting note or document and propose every change it supports |
| `updates` | `updates [<id>]` | List open and merged proposals, or show what one changes |

## Ground rules for every change

- **Read before you write.** Start with `mcp__plugin_plum_Plum__get_ontology_file` on `AGENT.md`: its navigation table says which file owns each topic. Read every file you will change, whole, before drafting it. Never send a file you have not read in this conversation.
- **Search before you add.** Call `mcp__plugin_plum_Plum__search_ontology` with the words people use, and `mcp__plugin_plum_Plum__exec_bash` with `grep -rn` for exact phrases. When a file already owns the topic, edit it; do not add a second one.
- **Send whole files.** The tools replace a file in full. Keep the frontmatter block, set `as_of` to today, keep every `id`, `key` and `supersedes` line, and keep lines you were not asked to change exactly as they are.
- **Label every statement** confirmed, inferred or unknown, and write an unknown as an `**OPEN:**` line naming who could answer. Never state an inference as fact, and never upgrade a label without a source: only a person confirms.
- **One topic per proposal.** When you add, rename or retire a file, change the folder's `README.md` and `AGENT.md`'s navigation table in the same proposal. Paths are lowercase hyphenated folders ending in a `.md` file; `AGENT.md` and `README.md` are the only uppercase names.
- **Which repository you are in.** When `AGENT.md` carries `playbook: true`, the workspace reads the playbook root: its skills, patterns, workflows and templates are the firm's methods and belong to `/plum:harness`, not here. Without it, the workspace reads one client's ontology (an engagement folder), and the playbook is out of reach: a change to a skill, pattern or workflow asked for here is a playbook change; say so and point at `/plum:harness`.
- **The user decides.** Show the preview diff and open the proposal only after they say go. Never approve or merge: that is a reviewer's step in the app or on GitHub.

## Edit

1. Work out which files the request touches: `AGENT.md` navigation, search, then read each file whole. When the request could mean two files, list them and ask with `AskUserQuestion`.
2. Draft the whole new content of each file under the ground rules. When the change rests on a meeting or document the user names, read it (`list_granola_notes`, `get_granola_note`, or the file they point at) so the statement and its label come from the source, and name that source in the rationale. When the change is a definition, say what it includes and excludes and keep measured values out of it.
3. Call `mcp__plugin_plum_Plum__preview_ontology_update` with every file. Relay its diff in a fenced block (every hunk; a new file is shown as its line count and its first lines), say nothing is opened yet, and fix anything it says the repository would refuse (a path outside the layout, a missing frontmatter block). Drop files it reports unchanged.
4. Ask with `AskUserQuestion`: "Open a proposal with these N files?" with options "Open proposal", "Keep editing", "Drop it". On "Keep editing", take the next change and preview again.
5. On "Open proposal", call `mcp__plugin_plum_Plum__propose_ontology_update` with a `title` in the imperative under 70 characters ("Define enterprise account for GTM"), a `rationale` that says why and names the sources (document names, meeting dates, who said it), and the same files. Report one line: the proposal id, its title and file count, the review link, and that an editor or admin approves it in the app or on GitHub. The approved ontology is unchanged until then.
6. Failures: `INVALID_REQUEST` names the path, size or metric problem; fix the file and preview again. `FORBIDDEN` means this account is a viewer, who cannot open proposals; say so. `SERVICE_UNAVAILABLE` means the workspace has no repository to write to; say so and stop.
7. When what you learned applies to other engagements too (a trap in a kind of data, a step the method missed), say so in one line after the proposal and name `/plum:harness pattern` or `/plum:harness skill`.

## Answer

1. Find the question: `get_ontology_file` on `open-questions.md`, and `exec_bash` with `grep -rn "OPEN:" .` for the line in place. When the words match several, list them and ask with `AskUserQuestion`.
2. Take the answer from what the user said or from the source they name (a meeting note through `get_granola_note`, a document they point at). Label it: confirmed when a named owner said it (name them in the rationale), inferred when it is read from records or documents, and leave the question open when the source does not settle it (say so and stop).
3. Draft the files: replace the `OPEN` line with the labelled statement, keep the question's id when it carries one, remove the entry from `open-questions.md` (or mark it answered the way the file does), and update the glossary or definition the answer changes. Then preview, confirm and open the proposal as in Edit steps 3 to 6, with a title such as "Settle: whether API-only users count as active".

## Ingest

1. Read the source: `search_granola_notes` or `list_granola_notes` to find the meeting, then `get_granola_note` (with `transcript: true` when the summary is thin), or the file the user points at. List for yourself every statement it makes about the business, each with who said it.
2. For each statement, find the file that owns the topic (`AGENT.md` navigation, `search_ontology`). Group the statements by file and topic. Statements that answer an `OPEN` line close it (as in Answer); statements that contradict a file become a change to that file with the old line's label downgraded or the new one marked `inferred` until an owner confirms; statements about a new topic become a new file with its README and navigation rows.
3. Show the user the list of changes you would make, one line each (file, what changes, label), and ask with `AskUserQuestion` which to make: "All", "Pick", or "None". Open one proposal per topic (Edit steps 3 to 6), each rationale naming the meeting date and who said it. Report the proposals in one line each.

## Updates

1. Call `mcp__plugin_plum_Plum__list_ontology_updates` and relay each update's id, status, title, date and review link. Open updates wait for an editor or admin in the app or on GitHub; merged ones are in the approved ontology.
2. When the user names an update or asks what it changes, call `mcp__plugin_plum_Plum__review_ontology_update` with its id (and `path` for one file) and relay the file list and diffs in a fenced block. To change an open proposal, open a new one with the corrected files and say the old one can be closed on GitHub. This plugin never approves an update.
