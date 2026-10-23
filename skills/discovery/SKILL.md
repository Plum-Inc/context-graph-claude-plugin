---
description: Start and steer plum's discovery agent from Claude Code. Discovery reads the company website and the connected sources, records claims with their evidence, asks clarification questions it cannot settle, and ends a run by opening a proposal on the ontology repository. This skill saves the intake (company name, website, point of contact), queues a run, follows it, shows what it found and asked, records a person's answer to one of its questions, and passes it a message. TRIGGER when the user wants to start, run, kick off, restart or check on discovery, see what discovery found or is asking, answer one of discovery's questions, tell discovery something, or says 'start discovery', 'run the discovery agent', 'is discovery still running', 'what has discovery found', 'what is discovery asking', 'answer discovery', 'tell discovery'. SKIP when the user wants to read or search the ontology files (use /plum:learn), to edit a file or settle an OPEN line in the ontology (use /plum:improve), to change the playbook (use /plum:harness), to chart imported records or make a client deliverable (use /plum:artifacts), or is not signed in yet (use /plum:setup).
argument-hint: '[start [<company> <website>]|status|findings|questions|answer <question>: <answer>|tell <message>]'
allowed-tools:
  [
    'Bash',
    'AskUserQuestion',
    'mcp__plugin_plum_Plum__get_discovery',
    'mcp__plugin_plum_Plum__get_discovery_run',
    'mcp__plugin_plum_Plum__save_discovery_intake',
    'mcp__plugin_plum_Plum__start_discovery',
    'mcp__plugin_plum_Plum__list_discovery_claims',
    'mcp__plugin_plum_Plum__list_discovery_questions',
    'mcp__plugin_plum_Plum__answer_discovery_question',
    'mcp__plugin_plum_Plum__send_discovery_message',
    'mcp__plugin_plum_Plum__list_sources',
    'mcp__plugin_plum_Plum__list_ontology_updates',
    'mcp__plugin_plum_Plum__review_ontology_update',
    'mcp__plugin_plum_Plum__whoami',
    'mcp__plugin_plum_Plum__list_workspaces',
    'mcp__plugin_plum_Plum__switch_workspace',
  ]
---

# plum: Run discovery

Discovery is the agent that works out what the business is and does. It starts from the intake (the company name and its website, the person to ask first), reads the connected sources, records every claim with the evidence behind it, asks a clarification question when the evidence cannot settle a meaning, and ends a run by opening a proposal on the ontology repository that an editor or admin approves. Nothing here writes a file: the proposal is the output, and `/plum:learn updates` shows it. Before anyone reads it, the agent grades its own files against the playbook's review rubric and writes the score, the criteria and what to fix first into the proposal; `status` relays that verdict with the proposal. Starting, answering and messaging take an admin of the workspace; reading is open to everyone.

## Output

The user wants the result, not the work. Do not narrate what you are about to do, which tool you are calling, or what you are checking; never write "Let me", "I'll", "First I'll" or a summary of your reasoning. Run the steps silently and answer with the outcome only: one or two lines (for example "Queued run run_8c1f for Acme. It reads acme.com and the Salesforce import, and ends by opening a proposal on the ontology; /plum:discovery status follows it."), a short list, or a single question through `AskUserQuestion`. When something fails, say what failed and the one command that fixes it, nothing else.

## Tool access

The `mcp__plugin_plum_Plum__*` tools come from this plugin's MCP server. When one is not directly callable (Claude Code defers MCP tools when many servers are configured), load it with ToolSearch, for example `select:mcp__plugin_plum_Plum__get_discovery`, then call it. If the tools still cannot be called, run the same tool from Bash; it prints the same result:

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/commands/tool.js" get_discovery
node "${CLAUDE_PLUGIN_ROOT}/dist/commands/tool.js" save_discovery_intake '{"companyName":"Acme","website":"https://acme.com"}'
```

`tool.js --list` prints every tool. Never substitute curl, hand-written API calls, or files under `~/.config/plum` (the token there is a secret: do not read or print it). If neither route works, tell the user to run `/mcp`, check that the Plum server is connected, and restart Claude Code, then stop.

## Modes

Read `$ARGUMENTS` first. If its first token is one of the modes below, run that mode with the rest as its input. Otherwise run `start` with the arguments as the company name and website when they hold one.

| Mode        | Trigger                                 | What it does                                                                                                      |
| ----------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `start`     | `start [<company> <website>]` (default) | Save the intake when there is none, then queue a run                                                              |
| `status`    | `status`                                | Where discovery stands: how many runs in each status, the newest runs and what they are working through, counts, recent events, the proposal the newest completed run opened and its score against the playbook rubric |
| `run`       | `run <run id>`                          | One run: its status, lease and failure, the domains it is working through with their attempts and gaps, and its own events newest first |
| `watch`     | `watch [<run id>]`                      | Follow a run until it ends, one notification per change, through Claude Code's Monitor tool; the newest run when none is named |
| `findings`  | `findings`                              | The claims discovery has made, with their evidence and what stays uncertain                                       |
| `questions` | `questions`                             | The clarification questions waiting for a person                                                                  |
| `answer`    | `answer <question>: <answer>`           | Record the person's answer to one question                                                                        |
| `tell`      | `tell <message>`                        | Pass discovery a fact, a correction or where to look next                                                         |

## Ground rules

- **Discovery runs in the workspace the request names.** The session banner names the workspace the tools act in. When the request names another engagement or workspace of the organization ("start discovery for Dundas"), move there first with `mcp__plugin_plum_Plum__switch_workspace` and that workspace's id (from the banner, or `mcp__plugin_plum_Plum__list_workspaces`), say so in one line, and stay there; when no workspace reads the named folder, say so and stop.
- **Discovery's questions are not the ontology's.** A clarification question is what the agent asked during a run and is answered here; an `OPEN` line in an ontology file is answered by `/plum:improve answer`. When the words fit both, say which one you are answering.
- **Answers are the person's words.** Record what the user said, as they said it. Never answer a question from the files or from your own reading: only a person settles a meaning.
- **Every write queues a run.** Saving a changed intake, answering a question and sending a message each queue a run; say so once, not after every call.
- **A run takes minutes, not seconds.** Report the state and stop; never poll in a loop yourself. The person runs `/plum:discovery status` when they want to look again, or `watch` hands the waiting to the Monitor tool, which notifies once per change and costs nothing while nothing moves.
- **Runs are listed newest first with counts by status.** The first run line is the newest; the counts say how many the workspace holds in all, so a long history (a workspace with dozens of runs "waiting for input") never hides the run just queued. `get_discovery_run` reads one run by id with its own events.

## Start

1. Call `mcp__plugin_plum_Plum__get_discovery`.
2. **No intake:** take the company name and website from the arguments. When either is missing, ask once with `AskUserQuestion` for the company name, its website, and optionally who to ask first (name, role, email). Call `mcp__plugin_plum_Plum__save_discovery_intake`; a saved intake queues the first run by itself. Report the intake and the run in one line.
3. **A run already queued or running:** say so with its id and status, and ask with `AskUserQuestion`: "Wait for it" or "Queue another run". On "Wait for it", stop.
4. **Otherwise:** call `mcp__plugin_plum_Plum__start_discovery`. Report the run id, what it reads (the website, and the connected sources from `mcp__plugin_plum_Plum__list_sources` when there are any; when there are none, say it reads the website alone and that a source is connected in the app), and that it ends by opening a proposal on the ontology.
5. Failures: `FORBIDDEN` means this account is not an admin of the workspace; say so. `SERVICE_UNAVAILABLE` means discovery is not set up on this deployment; say so and stop. A run that stays `queued` well past a few minutes means an operator has paused discovery on this deployment; say so.

## Status

1. Call `mcp__plugin_plum_Plum__get_discovery`. Relay in plain words: the counts of runs by status, the newest run (the first line) and its state (queued, running, waiting for input, completed, failed, superseded), what a running investigation is working through, how many claims, open questions and answers there are, and the last few events as one line each. A run still `queued` after a few minutes means an operator has paused discovery on this deployment; say so.
2. When the newest run is `waiting_for_input`, name the open questions (`mcp__plugin_plum_Plum__list_discovery_questions`) and say `/plum:discovery answer` records an answer.
3. When the newest run is `completed`, call `mcp__plugin_plum_Plum__list_ontology_updates` and name the proposal discovery opened (the newest one opened by `discovery-agent`) with its review link; an editor or admin approves it in the app or on GitHub. Then give the evals: call `mcp__plugin_plum_Plum__review_ontology_update` with its id and relay, from the proposal's rationale, the score against the playbook rubric and whether it passed, the hard fail if there is one, every criterion scored below 2 with its reason, and the "Fix first" line, as a short list. When the rationale says the model could not grade the files, say the proposal is ungraded and that the rubric is `skills/review-discovery-output.md` in the playbook. When no proposal appears, say the run ended without one and that `findings` shows what it recorded.
4. When it `failed`, relay the failure in one line and say `/plum:discovery start` queues another run.

## Run

1. Take the run id from the arguments; when there is none, call `mcp__plugin_plum_Plum__get_discovery` and use the first run listed (the newest). Call `mcp__plugin_plum_Plum__get_discovery_run` with it.
2. Relay in plain words: the status and when it last moved, the lease when it is running (held or lapsed), the failure when there is one, the domains with their status, attempts and gaps, and the run's events newest first, one line each. Keep the tool's advice line for the status (what to do next). `NOT_FOUND` means no run has that id in this workspace; `get_discovery` lists them.

## Watch

1. Resolve the run id as in **Run**. When the run is already completed, failed or superseded, relay it as **Run** does and stop: there is nothing to wait for.
2. Arm the `Monitor` tool (load it with ToolSearch `select:Monitor` when it is deferred) with a 30-second poll that prints a line only when the run's first line or its "Working through" line changes, and exits when the status is completed, failed or superseded. The script, with `${CLAUDE_PLUGIN_ROOT}` replaced by this plugin's root:

   ```bash
   prev=""
   while true; do
     cur=$(node "${CLAUDE_PLUGIN_ROOT}/dist/commands/tool.js" get_discovery_run '{"runId":"<run id>","limit":5}' 2>&1 | grep -E "^Run |^Working through|^Failed|^- " | head -8) || true
     [ "$cur" != "$prev" ] && [ -n "$cur" ] && printf '%s\n' "$cur"
     prev=$cur
     echo "$cur" | grep -qE "^Run \S+ · (completed|failed|superseded)" && break
     sleep 30
   done
   ```

   Set `timeout_ms` to 1800000 and a description naming the run. Say in one line that the run is being watched and that each change arrives as a notification; then stop.
3. When a notification arrives, relay what changed in one line. When it says the run completed, continue as **Status** does for a completed run (the proposal and its score). When the monitor expires with the run still going, say so and re-arm it only if the person asks.

## Findings

1. Call `mcp__plugin_plum_Plum__list_discovery_claims`. Group the claims by subject and relay each in one line: what it states, its status, its basis (configured, observed, confirmed, derived), how many sources support and contradict it, and what stays uncertain. Say which claims a person confirmed and which are only observed in records.
2. When the list is empty, say discovery has recorded nothing yet and what `status` shows. Once a proposal is approved, the same findings live in the ontology files, where `/plum:learn` reads them.

## Questions

1. Call `mcp__plugin_plum_Plum__list_discovery_questions`. Relay each unanswered question in one line with why it matters and its choices. Say `/plum:discovery answer <question>: <answer>` records an answer, and that discovery continues once it has one.

## Answer

1. Call `mcp__plugin_plum_Plum__list_discovery_questions` and match the user's words to one question. When they match several, ask with `AskUserQuestion` which one.
2. Work out the action from what the user said: `confirm` when it agrees with what discovery proposed or picks one of the choices, `correct` when it says something different, `defer` when they want to come back to it, `unknown` when nobody knows. When it is unclear, ask once with `AskUserQuestion` (options Confirm, Correct, Defer, Unknown).
3. Call `mcp__plugin_plum_Plum__answer_discovery_question` with the question id, the user's answer in their words and the action. Report one line: what was recorded and that a run is queued to take it into account.
4. `CONFLICT` means the question changed or was answered meanwhile: list the questions again, tell the user, and answer again only if it is still open.

## Tell

1. Call `mcp__plugin_plum_Plum__send_discovery_message` with the user's message in their words (a fact about the business, a correction, where to look next). Report one line: that it was recorded and a run is queued. A reply does not come back as chat; it comes back as claims, questions or a proposal, which `status` and `findings` show.
