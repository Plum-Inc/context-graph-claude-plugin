---
description: Create and manage artifacts, the branded deliverables a consultant shares with a client: briefs, findings reports, snapshot dashboards, workflow diagrams and target lists, built from the ontology and the imported records. They are drawn in the firm's brand kit on the app's Artifacts page, kept as revisions, and shared with each client on their own link. TRIGGER when the user wants to make, fill, revise, retitle, list, publish, share, unpublish, revoke or take down a client-facing deliverable, or to chart, plot or break down the imported data, or says 'make an artifact', 'chart the pipeline by stage', 'draw the renewal workflow as a diagram', 'a findings report on', 'a snapshot dashboard for the client', 'share it with Dana at Northwind', 'publish the report', 'revoke Acme's link', 'take the link down', 'list my artifacts', 'save this deck link as an artifact', 'add this link to the Artifacts page', 'I can't find the Stratis brief in this workspace'. SKIP when the user wants a call prep to read before a meeting, which is never shared (use /plum:brief), wants to read or change the ontology's files (use /plum:learn or /plum:improve), or is not signed in yet (use /plum:setup).
argument-hint: "[create|edit|list|link|publish|unpublish] <what to make or change, e.g. a findings report on pipeline leakage>"
allowed-tools: ["Bash", "Read", "AskUserQuestion", "mcp__plugin_plum_Plum__list_artifacts", "mcp__plugin_plum_Plum__get_artifact", "mcp__plugin_plum_Plum__get_artifact_brand", "mcp__plugin_plum_Plum__create_artifact", "mcp__plugin_plum_Plum__add_artifact_link", "mcp__plugin_plum_Plum__save_artifact", "mcp__plugin_plum_Plum__publish_artifact", "mcp__plugin_plum_Plum__unpublish_artifact", "mcp__plugin_plum_Plum__export_records", "mcp__plugin_plum_Plum__get_imported_model", "mcp__plugin_plum_Plum__aggregate_records", "mcp__plugin_plum_Plum__list_ontology_files", "mcp__plugin_plum_Plum__get_ontology_file", "mcp__plugin_plum_Plum__search_ontology", "mcp__plugin_plum_Plum__exec_bash", "mcp__plugin_plum_Plum__whoami", "mcp__plugin_plum_Plum__list_organizations", "mcp__plugin_plum_Plum__switch_workspace"]
---

# plum: Artifacts

An artifact is a deliverable for the client: a brief, a findings report, a snapshot dashboard, a workflow diagram or a target list. It is one HTML page in the firm's brand, which the app shows in a sealed frame. The person who makes it owns it, and only they change it. Every save is a new revision and the earlier ones never change. Sharing gives each recipient their own link, opened without signing in, to the revision it was made at. The owner sees how often each link was opened, moves one to a newer revision, or revokes one without touching the others.

The brand comes from the playbook's brand kit skill: the app hands the page its colours, fonts and chart palette as CSS custom properties, and its prose says how each kind of artifact should read and be laid out. An engagement may carry its own brand kit, which then wins.

## Output

The user wants the result, not the work. Do not narrate what you are about to do, which tool you are calling, or what you are checking; never write "Let me", "I'll", "First I'll" or a summary of your reasoning. Run the steps silently and answer with the outcome only: the Artifacts page link the tool printed, plus one line on what the artifact holds and what it rests on, or the public link and the revision it shows, or a single question through `AskUserQuestion`. Never paste the page into the chat. When something fails, say what failed and the one command that fixes it, nothing else.

## Tool access

The `mcp__plugin_plum_Plum__*` tools come from this plugin's MCP server. When one is not directly callable (Claude Code defers MCP tools when many servers are configured), load it with ToolSearch, for example `select:mcp__plugin_plum_Plum__create_artifact`, then call it. If the tools still cannot be called, run the same tool from Bash; it prints the same result:

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/commands/tool.js" list_artifacts
node "${CLAUDE_PLUGIN_ROOT}/dist/commands/tool.js" get_artifact '{"id":"art_…"}'
```

`pageLink.js --page artifacts [--artifact <id>]` prints the link to the Artifacts page. Never invent a link: only the tools and `pageLink.js` print them. Never substitute curl, hand-written API calls, or files under `~/.config/plum` (the token there is a secret: do not read or print it). If neither route works, tell the user to run `/mcp`, check that the Plum server is connected, and restart Claude Code, then stop.

## Modes

Read `$ARGUMENTS` first. If its first token is one of the modes below, run that mode and treat the rest as its input. Otherwise run `create` with the whole of `$ARGUMENTS` as the request; when the request names an artifact that already exists ("the renewal report"), run `edit` instead.

| Mode        | Trigger                    | What it does                                                  |
| ----------- | -------------------------- | ------------------------------------------------------------- |
| `create`    | `create` (default)         | Make a new artifact and fill it from the workspace's evidence |
| `edit`      | `edit <artifact> <change>` | Revise an artifact the person owns                            |
| `list`      | `list`                     | Show the workspace's artifacts with their links               |
| `link`      | `link <title> <https address>` | Save a deliverable that lives at a link to the Artifacts page |
| `publish`   | `publish <artifact> [to <recipients>]` | Give each recipient a link, or move a link to the latest revision |
| `unpublish` | `unpublish <artifact> [<recipient>]`   | Revoke one recipient's link, or every link                        |

The Artifacts page gives the owner a prompt to paste here, `/plum:artifacts edit <id> (<title>): <the change>`; an `art_` id in `$ARGUMENTS` names the artifact directly. Otherwise, to find an artifact the person names, call `mcp__plugin_plum_Plum__list_artifacts` and match the title. Several close matches: ask with `AskUserQuestion`, one option per artifact. None: artifacts belong to one workspace, so call `mcp__plugin_plum_Plum__list_artifacts` with `workspaces` "others" and match the title in the organization's other workspaces. Found in another workspace: say which one holds it and ask with `AskUserQuestion` whether to switch there or stay; only on a yes call `mcp__plugin_plum_Plum__switch_workspace` with that workspace's id, say so in one line, and carry on with the request there. Never switch without asking. When a tool answers that an artifact id is in another workspace, ask the same way. Still none: check `list_organizations` before saying it does not exist.

### List

Call `mcp__plugin_plum_Plum__list_artifacts`. It lists the whole workspace's artifacts, whoever made them. Report each on one line: title, revision, whether it is shared and at which revision, when it last changed; then the links added by hand on the Artifacts page (deliverables that live at a link), each with its address and who added it. End with the Artifacts page link. When the person asked for every engagement's artifacts, or this workspace has none, also call it with `workspaces` "others" and report each other workspace's artifacts under its name; reading or changing one there needs the person's yes to switch first. Stop.

### Link

A deliverable that already lives somewhere else (a deck, a shared document, a claude.ai artifact) is listed on the Artifacts page by its title and address. A request that hands over an address to keep ("save this deck link", "add https://… to our artifacts") runs this mode, not `create`. Take the address and a title from the request; with no title, ask for one with `AskUserQuestion`, offering a title drawn from the conversation. Call `mcp__plugin_plum_Plum__add_artifact_link` with `title` and `url`. An address that is not a full `https://` one is refused: say so and ask for the https address. Answer with the line the tool printed. Stop.

### Create

Artifacts are made only here: the Artifacts page lists them and shares them, but never creates one.

1. **Shape it.** From the request, decide what kind of deliverable it is and use the kind as a rough idea of its shape, never as a form to fill:
   - a **brief**: the point the conversation turns on, what is known, what to ask;
   - a **findings report**: the headline finding, one section per finding with the numbers behind it, what to do next;
   - a **snapshot dashboard**: a few headline numbers at one snapshot date over the table behind them;
   - a **workflow diagram**: the steps, each with who does it, and where it breaks down;
   - a **target list**: the whole population, each filter that narrows it with the count left after it, how any score was assigned, then the list itself and what its terms mean.

   Follow the request where it differs from these, and the brand kit's guidance on layout over both. Ask with `AskUserQuestion` only when nothing in the request says what the deliverable is for.
2. **Compose it.** Run steps 1 to 3 of **Compose** to read the brand and the evidence, and write the whole page to a new `.html` file in the scratchpad.
3. **Create it.** Call `mcp__plugin_plum_Plum__create_artifact` with `title` (two to eight words, the title the Artifacts page lists it by), `caption`, `facts` and `htmlFile`. When it is refused, fix what it names and create again. Answer as in step 5 of **Compose**.

### Edit

1. Call `mcp__plugin_plum_Plum__get_artifact`. It writes the page to a file and names it. When the person is not the owner it names, say who owns it and offer to make a copy they own (`create_artifact` with that file as `htmlFile`, the title and the caption), then stop unless they say yes.
2. Run **Compose** with the change they asked for, editing the file `get_artifact` named, against the revision it reported. Change only what the request touches.

### Compose

1. **Read the brand.** Call `mcp__plugin_plum_Plum__get_artifact_brand` and follow its guidance for voice and for the layout of this kind of artifact. Style the page with the custom properties it lists (`var(--brand-accent)`, `var(--brand-font-body)`, `var(--brand-chart-1)`…), each with a plain fallback, and never hard-code a brand colour or font.
2. **Gather the evidence.** Words about the business come from the ontology: `search_ontology`, then `get_ontology_file` for the owning file, keeping each statement's label (confirmed, inferred, OPEN). Numbers come from `aggregate_records` over the imported records, or `export_records` when a table needs each row. Never invent a number, a name or a quotation. Where the evidence does not settle something, keep or write an `OPEN:` line naming what is missing. Fill every `OPEN:` line the evidence settles, and leave the rest marked `OPEN:`.
3. **Write the page.** One self-contained HTML document a client reads, not a dashboard:
   - **It runs sealed.** The page has no network: it cannot fetch anything, so embed every number in it (a `<script type="application/json">` block for chart data). Styles and scripts are inline; a chart library may load from cdn.jsdelivr.net, cdnjs.cloudflare.com or unpkg.com at an exact version, fonts from Google Fonts, and images are inline SVG or `data:` URIs. Plain HTML and inline SVG charts are preferred over a library when they do the job.
   - **Lead with the answer.** The first section carries the number or the argument the deliverable exists for. What is still missing goes in one callout beside the part it affects, never in a section about the state of the work.
   - **One section per step of the argument**, in the order a reader follows it, each with a short label naming where it sits and a title saying what it shows. One main visual per section.
   - **Provenance goes in the document's `caption`**, shown under the page: the sources, the snapshot date, the ontology version, and what is modeled rather than reported. Cite a single number's source beside it.
   - **Tables are for looking things up.** Write numbers on the marks of a chart rather than adding a table under every one. A list of records is a table with links for websites and sources, currency in the code the source states, and qualifiers such as "Modeled" under the value they qualify. Give it a filter box once it runs past about fifteen rows.
   - **Explain a score** with a grid of levels by criteria, and a run of filters with each count left after it. When the page switches between segments, every segment's numbers come from a tool result; never derive one from another in your head.
   - **Definitions last**, the term as the heading and its meaning in the ontology's words.
   - It reads on a phone: no fixed widths past the screen, and wide tables scroll inside their own box.
4. **Save it.** Call `mcp__plugin_plum_Plum__save_artifact` with the title, caption, facts, the page as `htmlFile`, and the revision you read as `expectedRevision`. When it is refused, fix what it names and save again. When the save is refused because the artifact changed, call `get_artifact` again, tell the person what changed, and redo the change on the new revision.
5. Answer with the link and one line on what it holds, what it rests on and how many `OPEN:` lines remain. Say that it is private until shared, and which links still show an earlier revision.

### Publish

1. Call `mcp__plugin_plum_Plum__get_artifact` for the latest revision and its links.
2. Work out who it is for. Each recipient gets their own link, named for a person or a company ("Dana Lee, Northwind"). When the request names a recipient who already has a link, move that link (`linkId`) rather than making a second one. When it names nobody, ask with `AskUserQuestion` who it goes to.
3. Unless the person said "publish", "share" or "send" about this artifact in their own words in this conversation, confirm with `AskUserQuestion` first. Name the artifact, the revision and the recipients, and say that whoever holds a link can read everything in the page, hidden parts included. Ask whether the links should expire, offering 30 days, and pass `expiresInDays` when they choose one.
4. Call `mcp__plugin_plum_Plum__publish_artifact` with that revision as `expectedRevision` and `recipients`, or `linkId` to move a link. Answer with each recipient's link on its own line, and say these addresses are shown only now: plum keeps only a fingerprint of each, so a lost link means a new one. A moved link keeps its address.

### Unpublish

Find the link in `get_artifact`'s list by its recipient. Confirm with `AskUserQuestion` unless the person asked for it themselves, then call `mcp__plugin_plum_Plum__unpublish_artifact` with its `linkId`, or without one to revoke every link. Say that the link stops working at once, that the other links keep working, that copies people already saved cannot be recalled, and that a new link for the same recipient has a new address.

## Never

- Never share without the person's say-so: a link is outward-facing.
- Never change an artifact someone else owns; offer a copy instead.
- Never hard-code brand colours or fonts into a page, and never put another client's names or numbers into an artifact.
