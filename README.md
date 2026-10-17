# plum for Claude Code

Start the discovery agent, learn from your workspace's ontology, improve it through proposals, and grow the playbook the agents follow, all from Claude Code.

The plugin talks to the plum app's API with a token bound to you. It reads the ontology repository (the Markdown the team approves in git) the way the app's Ontology page does, and every change it makes is a proposal: a branch and pull request a reviewer approves in the app or on GitHub. The approved ontology never changes without that step.

The app's own setup guide is at `<your app>/plugin`.

## Install

```sh
claude plugin marketplace add anikal2001/context-graph-claude-plugin
claude plugin install plum@plum
```

Then, inside Claude Code:

```
/plum:setup
```

This opens a sign-in page in your browser. Approve it and the plugin is connected. The first session already shows the same link in its banner: open it, approve, and the next thing you ask is answered signed in, with no command and no restart. Point the plugin at another deployment (a local dev server, a preview) with `/plum:setup url http://localhost:5173`.

The plugin was named `context-graph` before version 0.5. An install under that name keeps running but no longer updates: remove it with `claude plugin uninstall context-graph@context-graph` and install `plum@plum`. The first run copies the saved sign-in from `~/.config/context-graph` to `~/.config/plum`, so nobody signs in again, and a project's `.context-graph/config.local.json` is still read until it is renamed to `.plum/config.local.json`.

## The pipeline

Three skills, in the order the work happens:

| Stage | Skill | What it does |
|---|---|---|
| 1. Learn | `/plum:learn [tree\|read <path>\|search <words>\|explain <topic>\|questions\|playbook\|updates [id]]` | Read the ontology without changing it: the shape of the repository, one file whole, every line that mentions something, what the files say about a topic with each statement's label (confirmed, inferred, unknown) and file, which questions are still open and who could answer them, how the playbook says to work, and what an update changes or whether it merged |
| 2. Improve | `/plum:improve [edit <change>\|answer <question>\|ingest <meeting or document>\|updates [id]]` | Change the ontology: edit or add files (definitions, conventions, decision notes, strategy, market, connectors, the glossary, AGENT.md's navigation, folder READMEs), settle an open question and close it in the same change, or bring in everything a meeting note or document supports. Each change is shown as a diff against the approved version and opened as a proposal only when you say go |
| 3. Harness | `/plum:harness [skill\|context\|pattern\|workflow\|template] <what>` | Change the playbook every engagement's agents read: a skill under `skills/`, context in `AGENT.md` (rules, business in brief, navigation), the glossary or a README, a pattern (a lesson scrubbed of client details), a workflow that sequences skills with handoffs and sign-offs, or an engagement template. Works from a workspace that reads the repository root and moves the plugin there when you agree |

Beside the pipeline:

| Skill | What it does |
|---|---|
| `/plum:discovery [start [<company> <website>]\|status\|findings\|questions\|answer <question>: <answer>\|tell <message>]` | Start and steer the discovery agent: save the intake (the company, its website, who to ask first) and queue a run that reads the website and the connected sources, records claims with their evidence, asks what it cannot settle, and ends by opening a proposal on the ontology; follow the run, read what it found and asked, record your answer to a question, or tell it something |
| `/plum:setup [login\|status\|org\|workspace [default]\|logout\|url <app-url>]` | Sign in from the browser, check the connection, move the plugin to another organization or to another workspace of the same organization (an engagement folder, or the repository root that holds the playbook), pin the workspace this project's sessions start in, sign out, or switch deployments |
| `/plum:ontology [edit\|versions\|save\|draft\|publish\|compare\|settings]` | The numbered ontology versions over imported records: stage edits to entities, definitions with executable rules, relationships, metrics or processes, see the diff, save a draft only when you say save; preview exact membership changes and publish; diff versions; set automatic drafting |
| `/plum:views [edit\|list\|delete] <question>` | Show what the data represents on the app's Views page as whatever UI the question needs (a waterfall, a funnel, a trend, a pie, a sankey, a heatmap, cards, a table, a KPI row), computed over every imported record with the published definitions applied; replaced in place when you ask for a change |
| `/plum:artifacts [create\|edit\|list\|publish\|unpublish] <what>` | Make and manage client deliverables (a brief, a findings report, a snapshot dashboard, a workflow diagram) in the firm's brand kit on the app's Artifacts page: start from a template or a saved view, fill it from the ontology and the imported records, revise it as new revisions, and publish one revision to a public link, or take the link down, only when you say so |
| `/plum:update [check]` | Report the version state, or apply an update the automatic one could not. Updates are not offered: the plugin applies an available one when a session starts and the banner tells you to restart |

## MCP tools

The plugin registers an MCP server named `Plum`; tools appear as `mcp__plugin_plum_Plum__<tool>`.

Ontology repository: `list_ontology_files`, `get_ontology_file`, `search_ontology`, `exec_bash` (one read-only bash command over every file, with the playbook mounted beside an engagement when the deployment has one), `preview_ontology_update` (diff proposed files against the approved version, name what the repository would refuse), `propose_ontology_update` (open the files as one proposal), `list_ontology_updates` and `review_ontology_update` (an update's status, files and diffs).

Meeting notes: `list_granola_notes`, `get_granola_note`, `search_granola_notes`, `link_granola_note`, `unlink_granola_note`.

Numbered ontology versions: `get_ontology`, `get_ontology_version`, `edit_ontology_entry` (stages), `show_ontology_changes`, `save_ontology_changes`, `discard_ontology_changes`, `save_ontology_version`, `configure_ontology`, `request_ontology_draft`, `preview_ontology_publication`, `publish_ontology`, `update_ontology_settings`, `compare_ontology_versions`.

Sources and identity: `list_sources`, `get_imported_model`, `search_entities`, `whoami`, `list_organizations`, `switch_organization`, `list_workspaces`, `switch_workspace`, `get_plugin_activity`.

Views: `aggregate_records` (group and total every record of a type on the server), `export_records` (every record of a type, up to 5,000, to a JSON file on this machine), `get_view_catalog`, `save_view`, `list_views` and `delete_view`.

MCP resources: every file of the ontology repository as `plum://ontology/<path>` (markdown), plus the newest and the published numbered ontology version.

## Organizations and workspaces

An organization holds one or more workspaces, each with its own sources, ontology and views. A workspace reads one engagement folder of the shared ontology repository, or the repository root, which in Plum Consulting's repository is the playbook itself. The plugin signs in to one workspace, the one your browser was in at the time, so a file or a view you cannot find is often one workspace or one organization away. `/plum:setup workspace` lists the organization's workspaces and moves the plugin to one; `/plum:setup org` does the same across organizations. Neither needs a browser sign-in, and the app's own switchers move the browser. Naming an engagement in a prompt is enough ("go look at the Dundas folder", "work in Stratis"): the session banner names the organization's workspaces, so the plugin moves there, says so in one line, and stays for the rest of the session.

A project can name the workspace its sessions start in: `/plum:setup workspace default <name>` writes `workspaceId` to `.plum/config.local.json` (found upward from the working directory, so it can sit at a repository root and be committed), and every new session in that project moves the plugin there when it is elsewhere in the same organization. `/plum:setup workspace default clear` forgets it.

## Telemetry

The plugin reports how it went, which skill ran, which tool was called, how long it took, whether it failed and with which code, and which version applied an update, to your own workspace, so the rough edges are visible to you. It never sends anything you wrote: no prompt text, no file paths, no file contents, no record values, no view specs, no tokens. Turn it off with `CONTEXT_GRAPH_TELEMETRY=0`, or permanently:

```json
// ~/.config/plum/config.json
{ "telemetry": false }
```

## Commands

Every `dist/commands/*.js` answers `-h`:

| Command | Purpose |
|---|---|
| `login.js [--force] [--url <app-url>] [--label <name>]` | Browser sign-in through a one-time ticket (PKCE); saves the token |
| `logout.js` | Revoke the token on the server and forget it |
| `status.js` | Service URL, version, build, update availability, sign-in state |
| `update.js [--check]` | Apply the latest published version through `claude plugin` |
| `switchOrg.js [<organizationId>]` | List the organizations this person belongs to, or move the plugin to one |
| `workspaceDefault.js [<workspaceId>\|clear]` | Show, set or clear the workspace this project's sessions start in |
| `pageLink.js [path] [--page ontology\|views] [--path <file>] [--view <id>]` | Print a link into the app: the Ontology page, optionally on one file, or the Views page |
| `tool.js <tool> ['<json>']` | Run any MCP tool from the shell; `--list` names them |

## Configuration

| Location | Holds |
|---|---|
| `~/.config/plum/config.json` | `serviceUrl`, an anonymous `installId` |
| `~/.config/plum/credentials.json` | `token` |
| `.plum/config.local.json` (searched upward from the working directory) | Per-project `serviceUrl` and `workspaceId` |
| `CONTEXT_GRAPH_URL`, `CONTEXT_GRAPH_TOKEN` | Environment overrides |

Sign an installation out from the "Claude Code" panel on the Views page at any time.

## Development

The plugin lives in `apps/plugin/` of the [plum](https://github.com/Plum-Inc/plum) repository and is bundled with esbuild into `dist/` (the shared contracts and the MCP SDK are inlined, so the published plugin has no dependencies).

```sh
cd apps/plugin
bun run typecheck && bun run test && bun run build
node ../../scripts/check-plugin-command-surface.mjs
```

To try a local build in Claude Code: `claude plugin marketplace add ./apps/plugin` from the repository root, then `claude plugin install plum@plum`.
