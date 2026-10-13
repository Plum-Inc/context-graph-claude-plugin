---
description: Change the files of the company ontology repository from Claude Code and open every change as a pull request a reviewer approves. The repository is the Markdown the team maintains in git (AGENT.md, folder READMEs, definitions, conventions, notes, strategy, market, connectors, metrics) and, in Plum Consulting's playbook, its skills, patterns and templates. Reads and searches the files, drafts the edit, shows the diff, opens the pull request only when the user says go; adds a new skill to the playbook; lists open updates and shows what one changes. TRIGGER when the user wants to edit, add or rewrite an ontology file, a definition file, a convention, a decision note, a connector note, AGENT.md's navigation or a folder README, add or change a skill, pattern or template in the playbook (the plum-consulting-ontology repository), open a pull request on the ontology repository, or asks what an open ontology update changes or whether it merged, or says 'edit the ontology repo', 'add a skill to the playbook', 'write a new skill', 'write a definition file', 'open a PR on the ontology', 'what is in that ontology update'. SKIP when the user wants numbered ontology versions, entities, rules over imported records, publishing or membership previews (use /context-graph:ontology), or sections of the context graph or business document (use /context-graph:graph).
argument-hint: "[edit|skill|read|search|updates] [what to change]"
allowed-tools: ["Bash", "AskUserQuestion", "Read", "mcp__plugin_context-graph_ContextGraph__list_ontology_files", "mcp__plugin_context-graph_ContextGraph__get_ontology_file", "mcp__plugin_context-graph_ContextGraph__search_ontology", "mcp__plugin_context-graph_ContextGraph__exec_bash", "mcp__plugin_context-graph_ContextGraph__preview_ontology_update", "mcp__plugin_context-graph_ContextGraph__propose_ontology_update", "mcp__plugin_context-graph_ContextGraph__list_ontology_updates", "mcp__plugin_context-graph_ContextGraph__review_ontology_update", "mcp__plugin_context-graph_ContextGraph__whoami", "mcp__plugin_context-graph_ContextGraph__list_organizations", "mcp__plugin_context-graph_ContextGraph__list_granola_notes", "mcp__plugin_context-graph_ContextGraph__get_granola_note", "mcp__plugin_context-graph_ContextGraph__search_granola_notes"]
---

# plum: Ontology repository

The company ontology is a git repository of Markdown files the team approves changes to. One shared repository holds Plum Consulting's playbook at its root (`AGENT.md`, `skills/`, `patterns/`, `templates/`, `glossary.md`) and one folder per client engagement under `engagements/`. A workspace reads either the whole repository or one engagement folder, and every path you see or send is relative to what it reads. Nothing here changes the approved ontology directly: every change is a pull request on the repository, and an editor or admin approves it in the app or merges it on GitHub.

## Output

The user wants the result, not the work. Do not narrate what you are about to do, which tool you are calling, or what you are checking; never write "Let me", "I'll", "First I'll" or a summary of your reasoning. Run the steps silently and answer with the outcome only: one or two lines (for example "Opened pull request pr_7f2a: Add skill ingest-support-ticket (3 files). An editor approves it in the app or on GitHub." plus the review link), a fenced diff when a step calls for one, or a single question through `AskUserQuestion`. When something fails, say what failed and the one command that fixes it, nothing else.

## Tool access

The `mcp__plugin_context-graph_ContextGraph__*` tools come from this plugin's MCP server. When one is not directly callable (Claude Code defers MCP tools when many servers are configured), load it with ToolSearch, for example `select:mcp__plugin_context-graph_ContextGraph__list_ontology_files`, then call it. If the tools still cannot be called, run the same tool from Bash; it prints the same result:

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/commands/tool.js" list_ontology_files
node "${CLAUDE_PLUGIN_ROOT}/dist/commands/tool.js" get_ontology_file '{"path":"AGENT.md"}'
```

`tool.js --list` prints every tool. Never substitute curl, git, the GitHub CLI, hand-written API calls, or files under `~/.config/context-graph` (the token there is a secret: do not read or print it). The repository is reached only through these tools; never clone it or open a pull request by other means. If neither route works, tell the user to run `/mcp`, check that the ContextGraph server is connected, and restart Claude Code, then stop.

## Modes

Read `$ARGUMENTS` first. If its first token is one of the modes below, run that mode. Otherwise, when the arguments describe a change, run `edit` with them as the request; when they ask for a skill, run `skill`; with no arguments run `read`.

| Mode | Trigger | What it does |
|------|---------|--------------|
| `edit` | `edit` or a described change | Change or add files, show the diff, open one pull request when the user says go |
| `skill` | `skill` or "add a skill", "new skill" | Add one skill to the playbook's `skills/` folder, with its README row and navigation entry, as one pull request |
| `read` | `read [path]` (default without arguments) | List the files, or show one whole |
| `search` | `search <words>` | Find the files and lines that mention something |
| `updates` | `updates [id]` | List open and merged updates, or show what one changes |

## Ground rules for every change

- **Read before you write.** Start with `mcp__plugin_context-graph_ContextGraph__get_ontology_file` on `AGENT.md`: its navigation table says which file owns each topic. Read every file you will change, whole, before drafting it. Never send a file you have not read in this conversation.
- **Search before you add.** Call `mcp__plugin_context-graph_ContextGraph__search_ontology` with the words people use, and `mcp__plugin_context-graph_ContextGraph__exec_bash` with `grep -rn` for exact phrases. When a file already owns the topic, edit it; do not add a second one.
- **Send whole files.** The tools replace a file in full. Keep the frontmatter block, set `as_of` to today, keep every `id`, `key` and `supersedes` line, and keep lines you were not asked to change exactly as they are.
- **Label every statement** confirmed, inferred or unknown, and write an unknown as an `**OPEN:**` line naming who could answer. Never state an inference as fact. Playbook files (`skills/`, `patterns/`, `templates/`) hold the firm's methods and never a client name, person or number.
- **One topic per pull request.** When you add, rename or retire a file, change the folder's `README.md` and `AGENT.md`'s navigation table in the same pull request. Paths are lowercase hyphenated folders ending in a `.md` file; `AGENT.md` and `README.md` are the only uppercase names.
- **Which repository you are in.** When `AGENT.md` carries `playbook: true`, the workspace reads the playbook root and the engagement folders beneath it. Without it, the workspace reads one client's ontology (an engagement folder or a repository of its own), paths are relative to that folder, and the playbook's `skills/`, `patterns/` and `templates/` are out of reach. A skill, pattern or template asked for from such a workspace is a playbook change: say so, and offer `/context-graph:setup org` to move to the organization that reads the playbook root, then run this again.
- **The user decides.** Show the preview diff and open the pull request only after they say go. Never approve or merge: that is a reviewer's step in the app or on GitHub.

## Edit

1. Work out which files the request touches: `AGENT.md` navigation, search, then read each file whole. When the request could mean two files, list them and ask with `AskUserQuestion`.
2. Draft the whole new content of each file under the ground rules. When the change rests on a meeting or document the user names, read it (`list_granola_notes`, `get_granola_note`, or the file they point at) so the statement and its label come from the source, and name that source in the rationale.
3. Call `mcp__plugin_context-graph_ContextGraph__preview_ontology_update` with every file. Relay its diff in a fenced block (every hunk; a new file is shown as its line count and its first lines), say nothing is opened yet, and fix anything it says the repository would refuse (a path outside the layout, a missing frontmatter block). Drop files it reports unchanged.
4. Ask with `AskUserQuestion`: "Open a pull request with these N files?" with options "Open pull request", "Keep editing", "Drop it". On "Keep editing", take the next change and preview again.
5. On "Open pull request", call `mcp__plugin_context-graph_ContextGraph__propose_ontology_update` with a `title` in the imperative under 70 characters ("Define enterprise account for GTM"), a `rationale` that says why and names the sources (document names, meeting dates, who said it), and the same files. Report one line: the update id, its title and file count, the review link, and that an editor or admin approves it in the app or on GitHub. The approved ontology is unchanged until then.
6. Failures: `INVALID_REQUEST` names the path, size or metric problem; fix the file and preview again. `FORBIDDEN` means this account is a viewer, who cannot open updates; say so. `SERVICE_UNAVAILABLE` means the workspace has no repository to write to; say so and stop.

## Skill

A skill is one file under `skills/` in the playbook: when to use it, the steps, and what never to do. It ships with its row in `skills/README.md` and its row in `AGENT.md`'s navigation, so people and agents can find it.

1. Confirm the workspace reads the playbook root (`AGENT.md` has `playbook: true`); otherwise follow the ground rule above and stop.
2. Read `skills/README.md`, `AGENT.md`, and one existing skill such as `skills/write-definition.md` for the shape. Search for the task's words: when an existing skill already covers it, say which and ask with `AskUserQuestion` whether to extend that one instead.
3. Name the file for the task, lowercase and hyphenated, as a verb phrase (`ingest-support-ticket.md`, not `support.md`).
4. Write the file whole: a frontmatter block with `type: skill`, `owner: system` (or the team the user names), `status: draft`, `as_of: <today>`; a `# Title` in the imperative; one "Use when …" line; `## Steps` as a numbered list; `## Never` as a bulleted list of what the skill forbids. Take the steps from what the user said and what the conversation holds; when they are missing, ask once with `AskUserQuestion` rather than inventing a method, and write anything still unsettled as an `**OPEN:**` line.
5. Add a row to the table in `skills/README.md` (`| <file> | <use when> |`) and a row to `AGENT.md`'s navigation (`| <what people ask, synonyms included> | skills/<file> |`), keeping the rest of both files as they are.
6. Preview, confirm and open the pull request as in Edit steps 3 to 6, with the title "Add skill: <name>" and a rationale that says what the skill is for and where its steps come from.

## Read

1. With no path, call `mcp__plugin_context-graph_ContextGraph__list_ontology_files` and relay the paths grouped by folder, with the version it reads. With a path, call `get_ontology_file` and show the file in a fenced block with its recent changes. `exec_bash` with `tree`, `ls` or `wc -l` answers questions about shape and size.

## Search

1. Call `search_ontology` with the words the user said (READMEs list synonyms, so matches there point at the owning folder). For an exact phrase, or to see every line, call `exec_bash` with `grep -rn "<phrase>" .`. Relay the matches as `path:line` with the line, best match first, and name the owning file when the user is about to change something.

## Updates

1. Call `mcp__plugin_context-graph_ContextGraph__list_ontology_updates` and relay each update's id, status, title, date and review link. Open updates wait for an editor or admin in the app or on GitHub; merged ones are in the approved ontology.
2. When the user names an update or asks what it changes, call `mcp__plugin_context-graph_ContextGraph__review_ontology_update` with its id (and `path` for one file) and relay the file list and diffs in a fenced block. This plugin never approves an update.
