import { createServer } from "node:net";
import { readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

interface ContainerState {
  pgName: string;
  redisName: string;
  pgPort: number;
  redisPort: number;
}

const decoder = new TextDecoder();
const FRONTEND_ROOT = resolve(import.meta.dir, "../apps/frontend");
const E2E_NEXT_DIST_DIR = ".next-e2e";
const LEGACY_E2E_DIST_PREFIX = ".next-e2e-";

function randomSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parsePort(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function runSync(
  cmd: string[],
  options?: {
    cwd?: string;
    env?: Record<string, string | undefined>;
    stdout?: "pipe" | "inherit" | "ignore";
    stderr?: "pipe" | "inherit" | "ignore";
  },
) {
  return Bun.spawnSync(cmd, {
    cwd: options?.cwd,
    env: options?.env,
    stdout: options?.stdout ?? "pipe",
    stderr: options?.stderr ?? "pipe",
  });
}

function runOrThrow(
  cmd: string[],
  options?: {
    cwd?: string;
    env?: Record<string, string | undefined>;
    stdout?: "pipe" | "inherit" | "ignore";
    stderr?: "pipe" | "inherit" | "ignore";
  },
) {
  const result = runSync(cmd, options);
  if (result.exitCode !== 0) {
    const stderr =
      options?.stderr === "inherit" ? "" : decoder.decode(result.stderr).trim();
    throw new Error(
      `Command failed (${result.exitCode}): ${cmd.join(" ")}\n${stderr}`,
    );
  }
  return result;
}

function runIgnore(cmd: string[]) {
  runSync(cmd, { stdout: "ignore", stderr: "ignore" });
}

function cleanupFrontendDistDirs() {
  const dirsToDelete = new Set<string>([E2E_NEXT_DIST_DIR]);

  for (const entry of readdirSync(FRONTEND_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(LEGACY_E2E_DIST_PREFIX)) {
      dirsToDelete.add(entry.name);
    }
  }

  for (const dir of dirsToDelete) {
    rmSync(resolve(FRONTEND_ROOT, dir), { recursive: true, force: true });
  }
}

async function isPortAvailable(port: number): Promise<boolean> {
  try {
    await new Promise<void>((resolve, reject) => {
      const server = createServer();
      server.unref();
      server.once("error", reject);
      server.listen(port, "127.0.0.1", () => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    });
    return true;
  } catch {
    return false;
  }
}

async function pickPort({
  preferred,
  start,
  end,
  used,
}: {
  preferred?: number;
  start: number;
  end: number;
  used: Set<number>;
}): Promise<number> {
  if (preferred !== undefined) {
    if (used.has(preferred) || !(await isPortAvailable(preferred))) {
      throw new Error(
        `Requested test port ${preferred} is unavailable. Set another E2E_*_PORT value.`,
      );
    }
    used.add(preferred);
    return preferred;
  }

  for (let attempt = 0; attempt < 300; attempt += 1) {
    const candidate = Math.floor(Math.random() * (end - start + 1)) + start;
    if (used.has(candidate)) continue;
    if (await isPortAvailable(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }

  throw new Error(`Unable to find a free port in range ${start}-${end}`);
}

function getMappedPort(containerName: string, containerPort: number): number {
  const result = runOrThrow([
    "docker",
    "port",
    containerName,
    `${containerPort}/tcp`,
  ]);
  const output = decoder.decode(result.stdout).trim();
  const match = output.match(/:(\d+)\s*$/);
  if (!match) {
    throw new Error(`Unexpected docker port output: "${output}"`);
  }
  return Number(match[1]);
}

async function waitForPort(
  port: number,
  timeoutMs: number,
  intervalMs = 200,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const socket = await Bun.connect({
        hostname: "127.0.0.1",
        port,
        socket: {
          data() {},
          open(sock) {
            sock.end();
          },
          error() {},
          close() {},
        },
      });
      socket.end();
      return;
    } catch {
      await Bun.sleep(intervalMs);
    }
  }
  throw new Error(`Port ${port} is not ready after ${timeoutMs}ms`);
}

async function waitForPgReady(containerName: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = runSync([
      "docker",
      "exec",
      containerName,
      "pg_isready",
      "-U",
      "test",
      "-d",
      "test",
    ]);
    if (result.exitCode === 0) return;
    await Bun.sleep(500);
  }
  throw new Error(`Postgres container ${containerName} is not ready`);
}

function ensureDockerAvailable() {
  const result = runSync(["docker", "info"], {
    stdout: "ignore",
    stderr: "ignore",
  });
  if (result.exitCode !== 0) {
    throw new Error("Docker is not available. Start Docker and retry e2e tests.");
  }
}

async function startContainers(runId: string): Promise<ContainerState> {
  const pgName = `sh-e2e-pg-${runId}`;
  const redisName = `sh-e2e-redis-${runId}`;

  runIgnore(["docker", "rm", "-f", pgName]);
  runIgnore(["docker", "rm", "-f", redisName]);

  try {
    runOrThrow([
      "docker",
      "run",
      "-d",
      "--name",
      pgName,
      "-e",
      "POSTGRES_USER=test",
      "-e",
      "POSTGRES_PASSWORD=test",
      "-e",
      "POSTGRES_DB=test",
      "-p",
      "0:5432",
      "postgres:17-alpine",
    ]);

    runOrThrow([
      "docker",
      "run",
      "-d",
      "--name",
      redisName,
      "-p",
      "0:6379",
      "redis:7-alpine",
    ]);

    const pgPort = getMappedPort(pgName, 5432);
    const redisPort = getMappedPort(redisName, 6379);

    await waitForPort(pgPort, 30_000);
    await waitForPgReady(pgName, 30_000);
    await waitForPort(redisPort, 10_000);

    return { pgName, redisName, pgPort, redisPort };
  } catch (error) {
    // Ensure partially started containers do not leak across retries.
    runIgnore(["docker", "rm", "-f", pgName]);
    runIgnore(["docker", "rm", "-f", redisName]);
    throw error;
  }
}

function stopContainers(state: ContainerState | undefined) {
  if (!state) return;
  runIgnore(["docker", "rm", "-f", state.pgName]);
  runIgnore(["docker", "rm", "-f", state.redisName]);
}

async function main() {
  ensureDockerAvailable();
  cleanupFrontendDistDirs();

  const runId = randomSuffix();
  const usedPorts = new Set<number>();
  const frontendPort = await pickPort({
    preferred: parsePort(process.env.E2E_FRONTEND_PORT),
    start: 42000,
    end: 45999,
    used: usedPorts,
  });
  const backendPort = await pickPort({
    preferred: parsePort(process.env.E2E_BACKEND_PORT),
    start: 46000,
    end: 48999,
    used: usedPorts,
  });
  const frontendUrl = `http://127.0.0.1:${frontendPort}`;
  const backendUrl = `http://127.0.0.1:${backendPort}`;
  const args = process.argv.slice(2);

  let containers: ContainerState | undefined;
  let exitCode = 1;
  try {
    console.log("[e2e] Starting isolated Postgres and Redis containers...");
    containers = await startContainers(runId);

    const env = {
      ...process.env,
      NODE_ENV: "test",
      FRONTEND_PORT: String(frontendPort),
      BACKEND_PORT: String(backendPort),
      FRONTEND_URL: frontendUrl,
      BACKEND_URL: backendUrl,
      NEXT_PUBLIC_FRONTEND_URL: frontendUrl,
      NEXT_PUBLIC_BACKEND_URL: backendUrl,
      NEXT_DIST_DIR: E2E_NEXT_DIST_DIR,
      DATABASE_URL: `postgresql://test:test@127.0.0.1:${containers.pgPort}/test`,
      REDIS_URL: `redis://127.0.0.1:${containers.redisPort}`,
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ?? "e2e-test-secret-for-testing-only",
      CENTRIFUGO_TOKEN_SECRET:
        process.env.CENTRIFUGO_TOKEN_SECRET ?? "e2e-test-centrifugo-secret",
      CENTRIFUGO_URL: "http://127.0.0.1:0",
    } as Record<string, string | undefined>;

    console.log("[e2e] Running database migrations...");
    runOrThrow(["bun", "run", "--cwd", "apps/backend", "migrations:up"], {
      env,
      stdout: "inherit",
      stderr: "inherit",
    });

    console.log(
      `[e2e] Running Playwright on ${frontendUrl} (backend ${backendUrl})`,
    );
    const proc = Bun.spawn(["bunx", "playwright", "test", ...args], {
      env,
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });

    exitCode = await proc.exited;
  } finally {
    console.log("[e2e] Cleaning up isolated containers...");
    stopContainers(containers);
    cleanupFrontendDistDirs();
  }

  process.exit(exitCode);
}

main().catch((error) => {
  console.error("[e2e] Failed to run isolated e2e tests");
  console.error(error);
  process.exit(1);
});
