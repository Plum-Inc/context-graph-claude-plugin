---
description: Connect Claude Code to a plum workspace, and move it between organizations and between the workspaces of one organization. TRIGGER when the user wants to sign in to plum, connect the plugin, check whether it is signed in, switch organization or workspace, see which organizations or workspaces they have, work in a named engagement's workspace, set or clear the workspace this project's sessions start in, point the plugin at another deployment, or sign out, or says 'context graph login', 'connect context graph', 'context graph status', 'switch org', 'change organization', 'switch workspace', 'work in the Dundas workspace', 'default workspace for this project', 'I am in the wrong workspace', 'where are my other views'. SKIP when the user wants to edit the context graph or ontology (use /plum:graph or /plum:ontology) or update the plugin (use /plum:update).
argument-hint: "[login|status|logout|org [<name>]|workspace [<name>|default [<name>|clear]]|url <app-url>]"
allowed-tools: ["Bash", "AskUserQuestion", "mcp__plugin_plum_Plum__whoami", "mcp__plugin_plum_Plum__list_context_models", "mcp__plugin_plum_Plum__list_organizations", "mcp__plugin_plum_Plum__switch_organization", "mcp__plugin_plum_Plum__list_workspaces", "mcp__plugin_plum_Plum__switch_workspace", "mcp__plugin_plum_Plum__list_views"]
---

# plum Setup

Sign the plugin in to a plum workspace from the browser, check its state, or sign out. Sign-in never pastes a secret into chat: the browser approves a one-time ticket and the token is saved under `~/.config/plum/`.

**CLI commands** available via Bash (all paths relative to `${CLAUDE_PLUGIN_ROOT}/dist/commands/`):

| Command | Description |
|---------|-------------|
| `login.js [--force] [--url <app-url>] [--label <name>]` | Open the browser sign-in and wait for approval; saves the token |
| `status.js` | Service URL, version and update availability, sign-in state |
| `logout.js` | Revoke this machine's token on the server and forget it |
| `switchOrg.js [<organizationId>]` | List the organizations this person belongs to, or move the plugin to one of them |
| `workspaceDefault.js [<workspaceId>\|clear]` | Show, set or clear the workspace sessions in this project start in (`.plum/config.local.json`) |
| `pageLink.js [--page graph\|document] [--context <id>]` | Print a link to the graph (step 3) or document (step 4) page |

## Output

The user wants the result, not the work. Do not narrate what you are about to do, which tool you are calling, or what you are checking; never write "Let me", "I'll", "First I'll" or a summary of your reasoning. Run the steps silently and answer with the outcome only: one or two lines (for example "Signed in to Acme as owner@acme.com (admin)." plus the graph page link), or a single question through `AskUserQuestion`. When something fails, say what failed and the one command that fixes it, nothing else.

## Tool access

When `mcp__plugin_plum_Plum__whoami` is not directly callable (Claude Code defers MCP tools when many servers are configured), load it with ToolSearch (`select:mcp__plugin_plum_Plum__whoami`) or run `node "${CLAUDE_PLUGIN_ROOT}/dist/commands/tool.js" whoami`. Never read or print files under `~/.config/plum`: the token there is a secret. Never invent page links: only `pageLink.js` prints them.

## Modes

Read `$ARGUMENTS` first. If its first token is one of the modes below, run that mode. Otherwise run `login`.

| Mode | Trigger | What it does |
|------|---------|--------------|
| `login` | `login` (default) | Sign in through the browser, then open the graph page |
| `status` | `status` | Report sign-in state, organization, service URL and plugin version |
| `org` | `org [<name>]` | Show which organization the plugin works in, and move it to another |
| `workspace` | `workspace [<name>]` | Show which workspace of the organization the plugin works in, and move it to another |
| `workspace default` | `workspace default [<name>\|clear]` | Show, set or clear the workspace sessions started in this project begin in |
| `logout` | `logout` | Revoke the token and sign out |
| `url` | `url <app-url>` | Point the plugin at another deployment (local dev server, preview) and sign in there |

**Natural-language aliases:** "switch org", "change organization", "I'm in the wrong organization" → `org`; "switch workspace", "work in the Dundas workspace", "which workspace am I in", "where are my other views" → `workspace`; "always start in", "default workspace for this project", "pin this workspace" → `workspace default`.

## Login

1. Run the status command and read its output:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/dist/commands/status.js"
   ```

   - **`Status: signed in as …`**: already connected. Tell the user who they are signed in as and which workspace, then go to step 3.
   - **`Status: not signed in`** or **`saved token rejected`**: continue with step 2.
   - If the output mentions an update, tell the user in one line that `/plum:update` applies it; do not block on it.
2. Run the login command. It prints the sign-in link, opens it in the OS-default browser, and polls until the browser approves the ticket (up to ten minutes):

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/dist/commands/login.js"
   ```

   Relay the link as a clickable URL in case the browser did not open. The browser asks the person to sign in to the app and then shows "Connected". When the command prints `Signed in as …`, continue. If it prints `expired` or `timed out`, ask whether to try again and re-run with `--force`.
3. Call `mcp__plugin_plum_Plum__whoami` once to confirm the MCP server sees the token (the server reads the saved token per call, so no restart is needed). If it reports `UNAUTHENTICATED`, the token file was not written: re-run step 2.
4. Call `mcp__plugin_plum_Plum__list_context_models`. If there are none, tell the user to connect a source and run discovery in the app (steps 1 and 2) before editing anything. Otherwise print the link to the graph page:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/dist/commands/pageLink.js" --page graph
   ```

   Relay the `url` from the JSON line as a clickable link and stop. Suggest `/plum:graph` to start editing.

## Status

1. Run `node "${CLAUDE_PLUGIN_ROOT}/dist/commands/status.js"` and relay every line. If signed in, also call `mcp__plugin_plum_Plum__whoami` and `mcp__plugin_plum_Plum__list_workspaces` and report the organization and the workspace by name. When the person belongs to more than one organization, say which one the plugin is in and that `/plum:setup org` moves it; when the organization has more than one workspace, that `/plum:setup workspace` moves it. Stop.

## Org

Every organization is its own workspace: its own sources, discovery, ontology, context models and views. The plugin holds a token for exactly one of them — whichever was active in the browser when it signed in — so "my view has disappeared" and "the plugin cannot see our Salesforce data" are usually one organization away from being true.

1. Call `mcp__plugin_plum_Plum__list_organizations`. It marks the organization the plugin is in now and names the others with the person's role in each. If the tool cannot be called, run `node "${CLAUDE_PLUGIN_ROOT}/dist/commands/switchOrg.js"`, which prints one JSON line with the same list.

   - **Only one organization**: say which one the plugin is in and that there is nowhere else to switch. Stop.
   - **The person named one** (in their request): match it case-insensitively against the names. On exactly one match, use its id. On none or several, ask.
   - **Otherwise**: use `AskUserQuestion` to choose, listing each organization by name and role and marking the current one.
2. Switch with `mcp__plugin_plum_Plum__switch_organization`, passing the chosen `organizationId` (or `null` for the shared workspace). The server checks the membership, issues a token for that workspace and retires the old one; the plugin saves the new token itself. Equivalent from Bash: `node "${CLAUDE_PLUGIN_ROOT}/dist/commands/switchOrg.js" <organizationId>`.

   Never print, read or ask for a token, and never read files under `~/.config/plum`.
3. Report the switch in two lines:
   - which organization the plugin now reads and writes, and that everything after this (sources, ontology, context models, views) is that organization's;
   - that the browser does not follow on its own: the person picks the same organization in the app's own switcher to watch the plugin work.

   Then call `mcp__plugin_plum_Plum__list_views` and say how many views this organization has, with the Views page link, so the person sees immediately whether what they were looking for is here. Stop.

## Workspace

An organization holds one or more workspaces, each with its own sources, ontology (often one engagement folder of the playbook repository), context models and views. The plugin's token is bound to exactly one of them. "The plugin cannot see the Dundas AI files" and "my view is gone" are usually one workspace away from being true.

1. Call `mcp__plugin_plum_Plum__list_workspaces`. It marks the workspace the plugin is in now and names the others with the engagement folder each reads.

   - **Only one workspace**: say which one the plugin is in and that an admin creates another from the app's sidebar ("New workspace"). Stop.
   - **The person named one** (in their request): match it case-insensitively against the names and the engagement folders. On exactly one match, use its id. On none or several, ask.
   - **Otherwise**: use `AskUserQuestion` to choose, listing each workspace by name and engagement and marking the current one.
2. Switch with `mcp__plugin_plum_Plum__switch_workspace`, passing the chosen `workspaceId`. The server checks the membership, issues a token bound to that workspace and retires the old one; the plugin saves the new token itself. Equivalent from Bash: `node "${CLAUDE_PLUGIN_ROOT}/dist/commands/tool.js" switch_workspace '{"workspaceId":"<id>"}'`.

   Never print, read or ask for a token, and never read files under `~/.config/plum`.
3. Report the switch in two lines: which workspace the plugin now reads and writes (and its engagement folder), and that the browser does not follow on its own: the person picks the same workspace in the app's sidebar to watch the plugin work. Then call `mcp__plugin_plum_Plum__list_views` and say how many views this workspace has, with the Views page link. Stop.

## Workspace default

Sessions started in this project (the working directory, or any folder above it holding `.plum/config.local.json`) can begin in one workspace: the session-start hook moves the install there when it is connected elsewhere in the same organization, and the banner says so.

1. With no further argument, run `node "${CLAUDE_PLUGIN_ROOT}/dist/commands/workspaceDefault.js"` and relay its JSON line: the default workspace id and the file it comes from, or that the project names none. Stop.
2. With `clear`, run `node "${CLAUDE_PLUGIN_ROOT}/dist/commands/workspaceDefault.js" clear` and say the project no longer names a default. Stop.
3. With a name, resolve it to a workspace id as in Workspace step 1 (the current workspace when the person says "this one"), then run `node "${CLAUDE_PLUGIN_ROOT}/dist/commands/workspaceDefault.js" <workspaceId>`. Say which file now names the default and that every new session in this project starts there. The file holds no secret; it may be committed when the whole team should start in that workspace.

## Logout

1. Ask the user to confirm with `AskUserQuestion` (one question, options "Sign out" and "Keep signed in"). On confirmation run `node "${CLAUDE_PLUGIN_ROOT}/dist/commands/logout.js"` and relay the result. Stop.

## Url

1. The second token of `$ARGUMENTS` is the app URL (for example `http://localhost:5173` for a local copy of the app). Run:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/dist/commands/login.js" --force --url "<app-url>"
   ```

   Then continue from Login step 3. The URL is saved as the service URL for every later command and MCP call.
