import { atom, read, update } from 'claude-code';
import type { EngineInterface, Register } from 'claude-code';
import type { RunsSnapshot } from '../types';

/*
 * The live runs pane: `/plum-runs` opens a pane beside the conversation that lists the discovery runs of the connected
 * workspace newest first, what each is working through, and the newest events, refreshed every 20 seconds while the
 * pane is open. A run reaching completed or failed raises a toast, and the status line carries the counts while a run
 * is queued or running, so the person follows a run without spending a turn on it. The data comes from
 * `dist/commands/discoveryRuns.js`, the same API calls the MCP tools make, so the token never leaves the plugin's own
 * code.
 */
const PANE = 'plum-runs';
const REFRESH_MS = 20_000;
const snapshot = atom({ plugin: 'plum', key: 'runs' } as const, null);
const pane = atom({ plugin: 'plum', key: 'runsPane' } as const, { error: null, refreshedAt: null });

const TERMINAL = new Set(['completed', 'failed', 'superseded']);
const STATUS_ORDER = ['queued', 'running', 'waiting_for_input', 'completed', 'failed', 'superseded'];
const GLYPH: Record<string, string> = {
  queued: '·',
  running: '▶',
  waiting_for_input: '?',
  completed: '✓',
  failed: '✗',
  superseded: '↷',
};
const plain = (status: string) => status.replace(/_/g, ' ');
const age = (iso: string, now: number) => {
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86_400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86_400)}d`;
};
const counts = (runCounts: Record<string, number>) =>
  STATUS_ORDER.filter(status => runCounts[status])
    .map(status => `${runCounts[status]} ${plain(status)}`)
    .join(' · ');
const domainsOf = (run: RunsSnapshot['runs'][number]) =>
  run.domains.map(domain => `${domain.domain}${domain.gapCount ? `(${domain.gapCount})` : ''}`).join(' ');

/** One timer for the module: the pane's refresh, running while the pane is open and stopped once it is closed. */
let timer: { cancel: () => void } | null = null;

function startRefreshing($: EngineInterface) {
  if (timer) return;
  timer = $.clock.every(REFRESH_MS, () => void refresh($));
}
function stopRefreshing($: EngineInterface) {
  timer?.cancel();
  timer = null;
  $.ui.status(undefined);
}

/** Reads the runs through the plugin's own command and keeps the pane, the status line and the toasts current. */
async function refresh($: EngineInterface) {
  const open = (await $.ui.panes()).some(item => item.id === PANE);
  if (!open) {
    stopRefreshing($);
    return;
  }
  const ran = await $.process.run(['node', `${$.plugin.root}/dist/commands/discoveryRuns.js`, '--limit', '8']);
  if (ran.exitCode !== 0) {
    const reason = ran.stderr.trim().split('\n')[0] ?? 'discoveryRuns failed';
    await update($, pane, state => ({ ...state, error: reason }));
    return;
  }
  let next: RunsSnapshot;
  try {
    next = JSON.parse(ran.stdout) as RunsSnapshot;
  } catch {
    await update($, pane, state => ({ ...state, error: 'discoveryRuns printed something that is not JSON' }));
    return;
  }
  const previous = await read($, snapshot);
  for (const run of next.runs) {
    const before = previous?.runs.find(item => item.id === run.id);
    if (before && before.status !== run.status && TERMINAL.has(run.status))
      $.ui.toast(
        `Discovery run ${run.id.slice(0, 12)} ${plain(run.status)}${run.status === 'completed' ? ': /plum:discovery status shows its proposal' : run.failure ? `: ${run.failure.slice(0, 80)}` : ''}`,
      );
  }
  await update($, snapshot, () => next);
  await update($, pane, () => ({ error: null, refreshedAt: new Date().toISOString() }));
  const active = (next.runCounts.queued ?? 0) + (next.runCounts.running ?? 0);
  $.ui.status(active ? `plum: ${counts(next.runCounts)}` : undefined);
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'plum-runs',
      description: "Open a live pane of the connected plum workspace's discovery runs",
    });
    return next(e);
  });

  on('command.run', { command: 'plum-runs' }, async $ => {
    const opened = await $.ui.open({ id: PANE, title: 'plum runs' });
    startRefreshing($);
    void refresh($);
    return {
      text: opened.isPlaced
        ? 'Discovery runs pane opened; it refreshes every 20 seconds while open. /plum-runs brings it back.'
        : `Discovery runs pane waits for room (${opened.reason}); it appears once the terminal is wide enough, and /plum-runs brings it back.`,
    };
  });

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e);
    const [data, state] = await Promise.all([read($, snapshot), read($, pane)]);
    const now = Date.now();
    const rows = Math.max(6, (e.viewport?.rows ?? 24) - 2);
    if (!data)
      return (
        <Box flexDirection="column">
          <Text dimColor>{state.error ?? 'Reading discovery runs…'}</Text>
        </Box>
      );
    const runs = data.runs.slice(0, Math.max(1, Math.min(data.runs.length, Math.floor((rows - 3) / 2))));
    const eventRoom = Math.max(0, rows - 3 - runs.length * 2);
    const events = data.events.slice(0, eventRoom);
    return (
      <Box flexDirection="column">
        <Text>
          <Text bold>{data.intake?.companyName ?? 'No intake yet'}</Text>
          <Text dimColor>
            {' '}
            · {counts(data.runCounts) || 'no runs'}
            {state.refreshedAt ? ` · ${age(state.refreshedAt, now)} ago` : ''}
          </Text>
        </Text>
        {state.error && <Text color="red">{state.error}</Text>}
        {runs.map(run => (
          <Box flexDirection="column" key={run.id}>
            <Text>
              <Text color={run.status === 'failed' ? 'red' : run.status === 'running' ? 'green' : undefined}>
                {GLYPH[run.status] ?? '·'} {plain(run.status)}
              </Text>
              <Text dimColor>
                {' '}
                {run.id.slice(0, 12)} · {age(run.updatedAt, now)} ago
              </Text>
            </Text>
            <Text dimColor>
              {'  '}
              {run.failure ? run.failure.slice(0, 80) : domainsOf(run) || 'not started'}
            </Text>
          </Box>
        ))}
        {events.length > 0 && <Text dimColor>events</Text>}
        {events.map((event, index) => (
          <Text dimColor key={`${event.createdAt}-${index}`}>
            {age(event.createdAt, now)} {event.message.replace(/\s+/g, ' ').slice(0, 90)}
          </Text>
        ))}
      </Box>
    );
  });
};
