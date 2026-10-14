import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);

// src/config.ts
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
var DEFAULT_SERVICE_URL = "https://tryplum.io";
var CONFIG_DIR = path.join(os.homedir(), ".config", "plum");
var CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
var CREDENTIALS_FILE = path.join(CONFIG_DIR, "credentials.json");
var PROJECT_CONFIG = path.join(".plum", "config.local.json");
var LEGACY_CONFIG_DIR = path.join(os.homedir(), ".config", "context-graph");
var LEGACY_PROJECT_CONFIG = path.join(".context-graph", "config.local.json");
function migrateLegacyConfig(from = LEGACY_CONFIG_DIR, to = CONFIG_DIR) {
  try {
    if (fs.existsSync(path.join(to, "config.json")) || !fs.existsSync(from)) return false;
    let copied = false;
    for (const name of fs.readdirSync(from)) {
      const target = path.join(to, name);
      if (fs.existsSync(target)) continue;
      fs.cpSync(path.join(from, name), target, { recursive: true });
      copied = true;
    }
    if (!fs.existsSync(path.join(to, "config.json"))) writeJson(path.join(to, "config.json"), {});
    return copied;
  } catch {
    return false;
  }
}
var PENDING_LOGIN_FILE = path.join(CONFIG_DIR, "pending-login.json");
function readJson(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}
`, { mode: 384 });
}
function findProjectConfig(start = process.cwd()) {
  let dir = path.resolve(start);
  for (; ; ) {
    for (const name of [PROJECT_CONFIG, LEGACY_PROJECT_CONFIG]) {
      const file = path.join(dir, name);
      const values = readJson(file);
      if (values) return { file, values };
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
function saveProjectWorkspace(workspaceId, cwd = process.cwd()) {
  const found = findProjectConfig(cwd);
  const file = found?.file ?? path.join(cwd, PROJECT_CONFIG);
  const values = { ...found?.values ?? {} };
  if (workspaceId) values.workspaceId = workspaceId;
  else delete values.workspaceId;
  writeJson(file, values);
  return file;
}
function normalizeServiceUrl(value) {
  const url = new URL(value.trim());
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash)
    throw new Error("Use an http(s) URL without credentials, query, or fragment.");
  return url.href.replace(/\/$/, "");
}
function getConfig(env = process.env) {
  migrateLegacyConfig();
  const found = findProjectConfig();
  const project = found?.values;
  const global = readJson(CONFIG_FILE) ?? {};
  const credentials = readJson(CREDENTIALS_FILE) ?? {};
  const fromEnv = env.CONTEXT_GRAPH_URL;
  const serviceUrl = fromEnv ?? (typeof project?.serviceUrl === "string" ? project.serviceUrl : typeof global.serviceUrl === "string" ? global.serviceUrl : DEFAULT_SERVICE_URL);
  const token = env.CONTEXT_GRAPH_TOKEN ?? (typeof credentials.token === "string" ? credentials.token : null);
  const telemetry = env.CONTEXT_GRAPH_TELEMETRY === "0" || env.CONTEXT_GRAPH_TELEMETRY === "false" ? false : global.telemetry !== false;
  return {
    serviceUrl: normalizeServiceUrl(serviceUrl),
    token,
    verbose: env.CONTEXT_GRAPH_VERBOSE === "1" || global.verbose === true,
    telemetry,
    defaultWorkspaceId: typeof project?.workspaceId === "string" && project.workspaceId.trim() ? project.workspaceId.trim() : null,
    projectConfigFile: found?.file ?? null
  };
}
var SESSION_FILE = path.join(CONFIG_DIR, "session.json");
var SESSION_TTL_MS = 24 * 60 * 60 * 1e3;

// src/parseArgs.ts
var label = (spec) => spec.required !== false ? `<${spec.name}>` : `[${spec.name}]`;
var flagLabel = (spec) => spec.boolean ? `[--${spec.name}]` : `[--${spec.name} <${spec.name}>${spec.default !== void 0 ? ` (default: ${spec.default})` : ""}]`;
function commandName(argv) {
  return argv[1]?.replace(/.*[\\/]/, "").replace(/\.[jt]s$/, "") ?? "command";
}
function buildHelp(command, spec) {
  const positional = spec.positional ?? [];
  const flags = spec.flags ?? [];
  const lines = [
    `Usage: ${[command, ...positional.map(label), ...flags.map(flagLabel)].join(" ")}`,
    "",
    spec.description
  ];
  const width = Math.max(0, ...positional.map((item) => item.name.length), ...flags.map((item) => item.name.length + 2));
  const described = positional.filter((item) => item.description);
  if (described.length) {
    lines.push("", "Arguments:");
    for (const item of described) lines.push(`  ${item.name.padEnd(width)}  ${item.description}`);
  }
  if (flags.length) {
    lines.push("", "Flags:");
    for (const item of flags)
      lines.push(
        `  ${`--${item.name}`.padEnd(width)}  ${[item.description, item.default !== void 0 ? `(default: ${item.default})` : ""].filter(Boolean).join(" ")}`.trimEnd()
      );
  }
  return lines.join("\n");
}
function printHelpIfRequested(spec) {
  const argv = spec.argv ?? process.argv;
  if (!argv.slice(2).some((token) => token === "-h" || token === "--help")) return;
  console.log(buildHelp(commandName(argv), spec));
  process.exit(0);
}
var UsageError = class extends Error {
};
function parseArgs(spec) {
  const argv = spec.argv ?? process.argv;
  printHelpIfRequested(spec);
  const positional = [];
  const flags = {};
  for (const flag of spec.flags ?? []) if (flag.default !== void 0) flags[flag.name] = flag.default;
  const raw = argv.slice(2);
  for (let index = 0; index < raw.length; index++) {
    const token = raw[index];
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }
    const flag = (spec.flags ?? []).find((item) => `--${item.name}` === token);
    if (!flag) throw new UsageError(`Unknown flag: ${token}`);
    if (flag.boolean) {
      flags[flag.name] = true;
      continue;
    }
    const value = raw[index + 1];
    if (value === void 0 || value.startsWith("--")) throw new UsageError(`Flag ${token} requires a value.`);
    flags[flag.name] = value;
    index += 1;
  }
  const required = (spec.positional ?? []).filter((item) => item.required !== false).length;
  if (positional.length < required)
    throw new UsageError(
      `Expected at least ${required} argument${required === 1 ? "" : "s"}, got ${positional.length}.`
    );
  if (positional.length > (spec.positional ?? []).length)
    throw new UsageError(
      `Expected at most ${(spec.positional ?? []).length} argument${(spec.positional ?? []).length === 1 ? "" : "s"}, got ${positional.length}.`
    );
  return { positional, flags };
}
async function runCommand(spec, work) {
  try {
    await work(parseArgs(spec));
  } catch (error) {
    if (error instanceof UsageError) {
      console.error(buildHelp(commandName(spec.argv ?? process.argv), spec));
      console.error(error.message);
      process.exit(1);
    }
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// src/commands/workspaceDefault.ts
function runWorkspaceDefault(argument, cwd = process.cwd()) {
  if (argument === void 0) {
    const config = getConfig();
    return { event: "default", workspaceId: config.defaultWorkspaceId, file: config.projectConfigFile };
  }
  const workspaceId = argument === "clear" ? null : argument.trim();
  if (workspaceId !== null && !workspaceId) throw new UsageError('Give a workspace id, or "clear".');
  return { event: "saved", workspaceId, file: saveProjectWorkspace(workspaceId, cwd) };
}
if (process.env.VITEST === void 0) {
  void runCommand(
    {
      description: "Show, set or clear the workspace sessions in this project start in (.plum/config.local.json). The session-start hook moves the install there when it is elsewhere in the same organization.",
      positional: [
        {
          name: "workspaceId",
          required: false,
          description: 'Workspace id from list_workspaces to start sessions in, or "clear" to forget it. Omit to show it.'
        }
      ]
    },
    async ({ positional }) => {
      console.log(JSON.stringify(runWorkspaceDefault(positional[0])));
    }
  );
}
export {
  runWorkspaceDefault
};
