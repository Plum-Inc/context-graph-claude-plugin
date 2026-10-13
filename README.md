# plum for Claude Code

Edit context graph revisions and ontology versions from Claude Code while the browser page follows along.

The plugin talks to the plum app's API with a token bound to you, so every change it makes is a normal revision: it appears in the versions menu on the Context graph (step 3) and Document (step 4) pages, marked "Claude Code", and those pages refresh within seconds while the plugin is working.

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

This opens a sign-in page in your browser. Approve it and the plugin is connected. Point it at another deployment (a local dev server, a preview) with `/plum:setup url http://localhost:5173`.

The plugin was named `context-graph` before version 0.5. An install under that name keeps running but no longer updates: remove it with `claude plugin uninstall context-graph@context-graph` and install `plum@plum`. The first run copies the saved sign-in from `~/.config/context-graph` to `~/.config/plum`, so nobody signs in again, and a project's `.context-graph/config.local.json` is still read until it is renamed to `.plum/config.local.json`.

## Skills

| Skill | What it does |
|---|---|
| `/plum:setup [login\|status\|org\|workspace [default]\|logout\|url <app-url>]` | Sign in from the browser, check the connection, move the plugin to another organization or to another workspace of the same organization, pin the workspace this project's sessions start in, sign out, or switch deployments |
| `/plum:graph [edit\|review\|history\|revert]` | Change section headings, prose and rules of the context model one revision at a time; review sections; diff revisions; revert a section |
| `/plum:ontology [edit\|versions\|save\|draft\|publish\|compare\|settings]` | Stage edits to entities, definitions, relationships, metrics or processes, see the diff against the original, and save them as the next draft only when you say save; list versions; ask the model for a draft; preview exact membership changes and publish; diff versions; set automatic drafting |
| `/plum:repo [edit\|skill\|read\|search\|updates]` | Change the files of the company ontology repository (AGENT.md, definitions, conventions, notes, connectors, and the playbook's skills, patterns and templates): read and search them, see the diff of your change against the approved version, and open it as one pull request only when you say go; add a new skill to the playbook with its README row and navigation entry; list open updates and see what one changes. A reviewer approves the pull request in the app or on GitHub |
| `/plum:views [edit\|list\|delete] <question>` | Show what the data represents on the app's Views page (step 5) as whatever UI the question needs (a waterfall for revenue attribution, a funnel for pipeline stages, a trend, a pie, a sankey, a heatmap, cards, a table, a KPI row), computed over every imported record with the published definitions applied; the page opens in the app within seconds and is replaced in place when you ask for a change. Charts write their numbers on the marks and can draw a second measure behind them, so a funnel shows the count on each step and the amount behind it |
| `/plum:update [check]` | Report the version state, or apply an update the automatic one could not. Updates are not offered: the plugin applies an available one when a session starts and the banner tells you to restart |

## MCP tools

The plugin registers an MCP server named `Plum`; tools appear as `mcp__plugin_plum_Plum__<tool>`.

Context model: `list_context_models`, `get_context_model`, `get_context_document`, `get_context_graph`, `edit_context_section`, `save_context_revision`, `comment_context_section`, `compare_context_revisions`, `preview_context_publication`.

Ontology: `get_ontology`, `get_ontology_version`, `edit_ontology_entry` (stages), `show_ontology_changes`, `save_ontology_changes`, `discard_ontology_changes`, `save_ontology_version`, `configure_ontology`, `request_ontology_draft`, `preview_ontology_publication`, `publish_ontology`, `update_ontology_settings`, `compare_ontology_versions`.

Ontology repository: `list_ontology_files`, `get_ontology_file`, `search_ontology`, `exec_bash` (one read-only bash command over every file), `preview_ontology_update` (diff proposed files against the approved version, name what the repository would refuse), `propose_ontology_update` (open the files as one pull request), `list_ontology_updates` and `review_ontology_update` (an update's status, files and diffs).

Sources and identity: `list_sources`, `get_imported_model`, `search_entities`, `whoami`, `list_organizations`, `switch_organization`, `list_workspaces`, `switch_workspace`, `get_plugin_activity`.

Views: `aggregate_records` (group and total every record of a type on the server: fields, date buckets such as `CloseDate:month`, or a referenced record's attribute such as `AccountId.Industry`, filtered with the rule language `StageName != "Closed Lost" and Amount > 0`), `export_records` (every record of a type, up to 5,000, to a JSON file on this machine for row-level charts), `get_view_catalog` (the components a view may use), `save_view` (validate a json-render spec against that catalog and put it on the app's Views page with its caption and facts, or replace one by id) , `list_views` and `delete_view`.

Every write takes the revision you read as `expectedRevision` and is refused when a newer revision landed first, the same rule the browser follows.

## Organizations and workspaces

An organization holds one or more workspaces, each with its own sources, ontology (often one engagement folder of the playbook repository), context models and views. The plugin signs in to one workspace — the one your browser was in at the time — so a view or a source you cannot find is often one workspace or one organization away. `/plum:setup workspace` lists the organization's workspaces and moves the plugin to one; `/plum:setup org` does the same across organizations. Neither needs a browser sign-in, and the app's own switchers move the browser.

A project can name the workspace its sessions start in: `/plum:setup workspace default <name>` writes `workspaceId` to `.plum/config.local.json` (found upward from the working directory, so it can sit at a repository root and be committed), and every new session in that project moves the plugin there when it is elsewhere in the same organization. `/plum:setup workspace default clear` forgets it.

## Telemetry

The plugin reports how it went — which skill ran, which tool was called, how long it took, whether it failed and with which code, and which version applied an update — to your own workspace, so the rough edges are visible to you. It never sends anything you wrote: no prompt text, no file paths, no record values, no view specs, no tokens. Turn it off with `CONTEXT_GRAPH_TELEMETRY=0`, or permanently:

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
| `pageLink.js [path] [--page graph\|document\|views] [--context <id>] [--section <id>] [--node <id>] [--view <id>]` | Print a link into the app |

## Configuration

| Location | Holds |
|---|---|
| `~/.config/plum/config.json` | `serviceUrl`, an anonymous `installId` |
| `~/.config/plum/credentials.json` | `token` |
| `.plum/config.local.json` (searched upward from the working directory) | Per-project `serviceUrl` |
| `CONTEXT_GRAPH_URL`, `CONTEXT_GRAPH_TOKEN` | Environment overrides |

Sign an installation out from the "Claude Code" panel on the graph or document page at any time.

## Development

The plugin lives in `apps/plugin/` of the [plum](https://github.com/Plum-Inc/plum) repository and is bundled with esbuild into `dist/` (the shared contracts and the MCP SDK are inlined, so the published plugin has no dependencies).

```sh
cd plugin
bun run typecheck && bun run test && bun run build
node ../scripts/check-plugin-command-surface.mjs
```

To try a local build in Claude Code: `claude plugin marketplace add ./plugin` from the repository root, then `claude plugin install plum@plum`.
