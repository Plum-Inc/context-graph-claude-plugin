---
description: Create and manage artifacts, the branded deliverables a consultant shares with a client: briefs, findings reports, snapshot dashboards, workflow diagrams and target lists, built from the ontology and the imported records. They are drawn in the firm's brand kit on the app's Artifacts page, kept as revisions, and shared with each client on their own link. TRIGGER when the user wants to make, fill, revise, retitle, list, publish, share, unpublish, revoke or take down a client-facing deliverable, or to chart, plot or break down the imported data, or says 'make an artifact', 'chart the pipeline by stage', 'draw the renewal workflow as a diagram', 'a findings report on', 'a snapshot dashboard for the client', 'share it with Dana at Northwind', 'publish the report', 'revoke Acme's link', 'take the link down', 'list my artifacts'. SKIP when the user wants a call prep to read before a meeting, which is never shared (use /plum:brief), wants to read or change the ontology's files (use /plum:learn or /plum:improve), or is not signed in yet (use /plum:setup).
argument-hint: "[create|edit|list|publish|unpublish] <what to make or change, e.g. a findings report on pipeline leakage>"
allowed-tools: ["Bash", "Read", "AskUserQuestion", "mcp__plugin_plum_Plum__list_artifacts", "mcp__plugin_plum_Plum__get_artifact", "mcp__plugin_plum_Plum__get_artifact_brand", "mcp__plugin_plum_Plum__create_artifact", "mcp__plugin_plum_Plum__save_artifact", "mcp__plugin_plum_Plum__publish_artifact", "mcp__plugin_plum_Plum__unpublish_artifact", "mcp__plugin_plum_Plum__get_view_catalog", "mcp__plugin_plum_Plum__get_imported_model", "mcp__plugin_plum_Plum__aggregate_records", "mcp__plugin_plum_Plum__list_ontology_files", "mcp__plugin_plum_Plum__get_ontology_file", "mcp__plugin_plum_Plum__search_ontology", "mcp__plugin_plum_Plum__exec_bash", "mcp__plugin_plum_Plum__whoami", "mcp__plugin_plum_Plum__list_organizations"]
---

# plum: Artifacts

An artifact is a deliverable for the client: a brief, a findings report, a snapshot dashboard, a workflow diagram or a target list. It is a spec over the view catalog, drawn as a document in the firm's brand. The person who makes it owns it, and only they change it. Every save is a new revision and the earlier ones never change. Sharing gives each recipient their own link, opened without signing in, to the revision it was made at. The owner sees how often each link was opened, moves one to a newer revision, or revokes one without touching the others.

The brand comes from the playbook's brand kit skill: its colours, fonts and chart palette are applied by the app, and its prose says how each kind of artifact should read and be laid out. An engagement may carry its own brand kit, which then wins.

## Output

The user wants the result, not the work. Do not narrate what you are about to do, which tool you are calling, or what you are checking; never write "Let me", "I'll", "First I'll" or a summary of your reasoning. Run the steps silently and answer with the outcome only: the Artifacts page link the tool printed, plus one line on what the artifact holds and what it rests on, or the public link and the revision it shows, or a single question through `AskUserQuestion`. Never paste the spec into the chat. When something fails, say what failed and the one command that fixes it, nothing else.

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
| `publish`   | `publish <artifact> [to <recipients>]` | Give each recipient a link, or move a link to the latest revision |
| `unpublish` | `unpublish <artifact> [<recipient>]`   | Revoke one recipient's link, or every link                        |

The Artifacts page gives the owner a prompt to paste here, `/plum:artifacts edit <id> (<title>): <the change>`; an `art_` id in `$ARGUMENTS` names the artifact directly. Otherwise, to find an artifact the person names, call `mcp__plugin_plum_Plum__list_artifacts` and match the title. Several close matches: ask with `AskUserQuestion`, one option per artifact. None: say so; artifacts belong to one organization's workspace, so check `list_organizations` before saying it does not exist.

### List

Call `mcp__plugin_plum_Plum__list_artifacts`. It lists the whole workspace's artifacts, whoever made them. Report each on one line: title, revision, whether it is shared and at which revision, when it last changed; then the links added by hand on the Artifacts page (deliverables that live at a link), each with its address and who added it. End with the Artifacts page link. Stop.

### Create

Artifacts are made only here: the Artifacts page lists them and shares them, but never creates one.

1. **Shape it.** From the request, decide what kind of deliverable it is and use the kind as a rough idea of its shape, never as a form to fill:
   - a **brief**: the point the conversation turns on, what is known, what to ask;
   - a **findings report**: the headline finding, one section per finding with the numbers behind it, what to do next;
   - a **snapshot dashboard**: a few headline numbers at one snapshot date over the table behind them;
   - a **workflow diagram**: the steps, each with who does it (`Steps`), and where it breaks down;
   - a **target list**: the whole population, each filter that narrows it with the count left after it (`Funnel` with `form` "taper"), how any score was assigned (`Rubric`), then the list itself and what its terms mean.

   Follow the request where it differs from these, and the brand kit's guidance on layout over both. Ask with `AskUserQuestion` only when nothing in the request says what the deliverable is for.
2. **Compose it.** Run steps 1 to 4 of **Compose** to read the brand, the catalog and the evidence, and lay out the whole document.
3. **Create it.** Call `mcp__plugin_plum_Plum__create_artifact` with `title` (two to eight words, the title the Artifacts page lists it by), `caption`, `facts` and `spec`. When the spec is refused, fix every issue it lists and create again. Answer as in step 6 of **Compose**.

### Edit

1. Call `mcp__plugin_plum_Plum__get_artifact`. When the person is not the owner it names, say who owns it and offer to make a copy they own (`create_artifact` with the document's spec, title and caption), then stop unless they say yes.
2. Run **Compose** with the change they asked for, against the revision `get_artifact` reported.

### Compose

1. **Read the brand.** Call `mcp__plugin_plum_Plum__get_artifact_brand` and follow its guidance for voice and for the layout of this kind of artifact. Never write a colour, font or pixel into the spec: the app applies them.
2. **Read the catalog** once with `mcp__plugin_plum_Plum__get_view_catalog`. The artifact is a spec over it, rooted in a Page. Workflows use `Steps`.
3. **Gather the evidence.** Words about the business come from the ontology: `search_ontology`, then `get_ontology_file` for the owning file, keeping each statement's label (confirmed, inferred, OPEN) and its `path:line`. Numbers come from `aggregate_records` over the imported records. Never invent a number, a name or a quotation. Where the evidence does not settle something, keep or write an `OPEN:` line naming what is missing. Fill every `OPEN:` line the evidence settles, and leave the rest marked `OPEN:`.
4. **Lay it out as a document.** The app draws an artifact as a document, not a dashboard, and the spec decides how well it reads:
   - **Lead with the answer.** The first section carries the number or the argument the deliverable exists for: a `Kpi` with `headline` true, a taper `Funnel`, or a `Callout`. What is still missing goes in one `Callout` or `Note` beside the part it affects, never in a section about the state of the work.
   - **One section per step of the argument**, in the order a reader follows it. Give each an `eyebrow` naming where it sits ("The target list", "Step 2 in detail", "The brands", "Definitions") and a title saying what it shows. One main visual per section; put a supporting panel beside it in a `Row` with weights, not under it.
   - **Provenance goes in the document's `caption`**, drawn under the page: the sources, the snapshot date, the ontology version, and what is modeled rather than reported. Do not open the page with a `Caption`. Cite a single number's source in the note beside it.
   - **Tables are for looking things up.** Write numbers on the marks rather than adding a `DataTable` under every chart. A list of records is a `DataTable` with `formats`: `link` for websites and sources, `currency` with the code the source states, and `detail` to put a qualifier such as "Modeled" under the value it qualifies. Add `search` and `download` once it runs past about fifteen rows.
   - **Explain a score with `Rubric`** and a run of filters with a taper `Funnel`. **Switch segments with `Segments`** only when every version's numbers come from a tool result; never derive one segment's numbers from another in your head.
   - **Definitions last**, as `Cards` with the term as the heading and its meaning as the body, in the ontology's words.
   - Set the one or two names a sentence turns on in **bold** with double asterisks.
5. **Save it.** Call `mcp__plugin_plum_Plum__save_artifact` with the whole document (title, caption, facts, spec) and the revision you read as `expectedRevision`. Keep the element keys of parts you keep. When the spec is refused, fix every issue it lists and save again. When the save is refused because the artifact changed, call `get_artifact` again, tell the person what changed, and redo the change on the new revision.
6. Answer with the link and one line on what it holds, what it rests on and how many `OPEN:` lines remain. Say that it is private until shared, and which links still show an earlier revision.

### Publish

1. Call `mcp__plugin_plum_Plum__get_artifact` for the latest revision and its links.
2. Work out who it is for. Each recipient gets their own link, named for a person or a company ("Dana Lee, Northwind"). When the request names a recipient who already has a link, move that link (`linkId`) rather than making a second one. When it names nobody, ask with `AskUserQuestion` who it goes to.
3. Unless the person said "publish", "share" or "send" about this artifact in their own words in this conversation, confirm with `AskUserQuestion` first. Name the artifact, the revision and the recipients, and say that whoever holds a link can read everything on the page, folded sections included. Ask whether the links should expire, offering 30 days, and pass `expiresInDays` when they choose one.
4. Call `mcp__plugin_plum_Plum__publish_artifact` with that revision as `expectedRevision` and `recipients`, or `linkId` to move a link. Answer with each recipient's link on its own line, and say these addresses are shown only now: plum keeps only a fingerprint of each, so a lost link means a new one. A moved link keeps its address.

### Unpublish

Find the link in `get_artifact`'s list by its recipient. Confirm with `AskUserQuestion` unless the person asked for it themselves, then call `mcp__plugin_plum_Plum__unpublish_artifact` with its `linkId`, or without one to revoke every link. Say that the link stops working at once, that the other links keep working, that copies people already saved cannot be recalled, and that a new link for the same recipient has a new address.

## Never

- Never share without the person's say-so: a link is outward-facing.
- Never change an artifact someone else owns; offer a copy instead.
- Never write brand colours, fonts or styles into a spec, and never put another client's names or numbers into an artifact.
