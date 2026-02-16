import { readdirSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";
import {
  GenericContainer,
  type StartedTestContainer,
  Wait,
} from "testcontainers";

interface ContainerState {
  postgres: StartedTestContainer;
  redis: StartedTestContainer;
  pgHost: string;
  pgPort: number;
  redisHost: string;
  redisPort: number;
}

const decoder = new TextDecoder();
const FRONTEND_ROOT = resolve(import.meta.dir, "../apps/frontend");
const E2E_NEXT_DIST_DIR = ".next-e2e";
const LEGACY_E2E_DIST_PREFIX = ".next-e2e-";

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

function ensureDockerAvailable() {
  const result = runSync(["docker", "info"], {
    stdout: "ignore",
    stderr: "ignore",
  });
  if (result.exitCode !== 0) {
    throw new Error("Docker is not available. Start Docker and retry e2e tests.");
  }
}

async function startContainers(): Promise<ContainerState> {
  const postgres = await new GenericContainer("postgres:17-alpine")
    .withEnvironment({
      POSTGRES_USER: "test",
      POSTGRES_PASSWORD: "test",
      POSTGRES_DB: "test",
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forAll([]))
    .withStartupTimeout(30_000)
    .start();

  let redis: StartedTestContainer | undefined;
  try {
    redis = await new GenericContainer("redis:7-alpine")
      .withExposedPorts(6379)
      .withWaitStrategy(Wait.forAll([]))
      .withStartupTimeout(10_000)
      .start();
  } catch (error) {
    await postgres.stop().catch(() => undefined);
    throw error;
  }

  const pgHost = postgres.getHost();
  const pgPort = postgres.getMappedPort(5432);
  const redisHost = redis.getHost();
  const redisPort = redis.getMappedPort(6379);

  try {
    await waitForServicePort({ host: pgHost, port: pgPort, timeoutMs: 30_000 });
    await waitForServicePort({
      host: redisHost,
      port: redisPort,
      timeoutMs: 10_000,
    });
  } catch (error) {
    await Promise.all([
      postgres.stop().catch(() => undefined),
      redis.stop().catch(() => undefined),
    ]);
    throw error;
  }

  return {
    postgres,
    redis,
    pgHost,
    pgPort,
    redisHost,
    redisPort,
  };
}

async function stopContainers(state: ContainerState | undefined): Promise<void> {
  if (!state) return;

  await Promise.all([
    state.postgres.stop().catch(() => undefined),
    state.redis.stop().catch(() => undefined),
  ]);
}

function normalizeHost(host: string): string {
  if (host.includes(":") && !host.startsWith("[") && !host.endsWith("]")) {
    return `[${host}]`;
  }
  return host;
}

async function runMigrationsWithRetry(
  env: Record<string, string | undefined>,
): Promise<void> {
  const maxAttempts = 20;
  const retryDelayMs = 1_000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = runSync(
      ["bun", "run", "--cwd", "apps/backend", "migrations:up"],
      {
        env,
        stdout: "inherit",
        stderr: "inherit",
      },
    );

    if (result.exitCode === 0) {
      return;
    }

    if (attempt === maxAttempts) {
      throw new Error(
        `Migrations failed after ${maxAttempts} attempts (last exit code ${result.exitCode})`,
      );
    }

    console.log(
      `[e2e] Migration attempt ${attempt}/${maxAttempts} failed, retrying in ${retryDelayMs}ms...`,
    );
    await Bun.sleep(retryDelayMs);
  }
}

async function waitForServicePort({
  host,
  port,
  timeoutMs,
  intervalMs = 200,
}: {
  host: string;
  port: number;
  timeoutMs: number;
  intervalMs?: number;
}): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const socket = await Bun.connect({
        hostname: host,
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

  throw new Error(`Port ${host}:${port} is not ready after ${timeoutMs}ms`);
}

async function main() {
  process.env.TESTCONTAINERS_RYUK_DISABLED ??= "true";

  ensureDockerAvailable();
  cleanupFrontendDistDirs();

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
    containers = await startContainers();

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
      DATABASE_URL: `postgresql://test:test@${normalizeHost(containers.pgHost)}:${containers.pgPort}/test`,
      REDIS_URL: `redis://${normalizeHost(containers.redisHost)}:${containers.redisPort}`,
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ?? "e2e-test-secret-for-testing-only",
      CENTRIFUGO_TOKEN_SECRET:
        process.env.CENTRIFUGO_TOKEN_SECRET ?? "e2e-test-centrifugo-secret",
      CENTRIFUGO_URL: "http://127.0.0.1:0",
    } as Record<string, string | undefined>;

    console.log("[e2e] Running database migrations...");
    await runMigrationsWithRetry(env);

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
    await stopContainers(containers);
    cleanupFrontendDistDirs();
  }

  process.exit(exitCode);
}

main().catch((error) => {
  console.error("[e2e] Failed to run isolated e2e tests");
  console.error(error);
  process.exit(1);
});
