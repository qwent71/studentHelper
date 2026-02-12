/**
 * Starts Postgres and Redis containers using `docker run` directly.
 *
 * We avoid testcontainers because its port-wait strategy uses Docker log
 * streams that are incompatible with Bun's HTTP handling
 * (see https://github.com/testcontainers/testcontainers-node/issues/974).
 */

const PG_CONTAINER = "sh-test-pg";
const REDIS_CONTAINER = "sh-test-redis";

let started = false;
let _postgresUrl = "";
let _redisUrl = "";

export async function startContainers(): Promise<{
  postgresUrl: string;
  redisUrl: string;
}> {
  if (started) {
    return { postgresUrl: _postgresUrl, redisUrl: _redisUrl };
  }

  // Remove stale test containers (ignore errors if they don't exist)
  await Promise.all([
    run(["docker", "rm", "-f", PG_CONTAINER]),
    run(["docker", "rm", "-f", REDIS_CONTAINER]),
  ]);

  // Start containers in parallel
  const [pgPort, redisPort] = await Promise.all([
    startPostgres(),
    startRedis(),
  ]);

  _postgresUrl = `postgresql://test:test@localhost:${pgPort}/test`;
  _redisUrl = `redis://localhost:${redisPort}`;
  started = true;

  return { postgresUrl: _postgresUrl, redisUrl: _redisUrl };
}

export async function stopContainers(): Promise<void> {
  await Promise.all([
    run(["docker", "rm", "-f", PG_CONTAINER]),
    run(["docker", "rm", "-f", REDIS_CONTAINER]),
  ]);
  started = false;
}

// ── Internal ────────────────────────────────────────────────────────

async function startPostgres(): Promise<number> {
  await runOrThrow([
    "docker",
    "run",
    "-d",
    "--name",
    PG_CONTAINER,
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

  const port = await getMappedPort(PG_CONTAINER, 5432);

  // Wait until Postgres actually accepts connections
  await waitForPort(port, 30_000);
  await waitForPgReady(port, 30_000);

  return port;
}

async function startRedis(): Promise<number> {
  await runOrThrow([
    "docker",
    "run",
    "-d",
    "--name",
    REDIS_CONTAINER,
    "-p",
    "0:6379",
    "redis:7-alpine",
  ]);

  const port = await getMappedPort(REDIS_CONTAINER, 6379);

  await waitForPort(port, 10_000);

  return port;
}

/** Return the host port that Docker mapped for a given container port. */
async function getMappedPort(
  containerName: string,
  containerPort: number,
): Promise<number> {
  const proc = Bun.spawn(
    ["docker", "port", containerName, `${containerPort}/tcp`],
    {
      stdout: "pipe",
      stderr: "pipe",
    },
  );
  const exitCode = await proc.exited;
  const stdout = (await new Response(proc.stdout).text()).trim();

  if (exitCode !== 0 || !stdout) {
    const stderr = (await new Response(proc.stderr).text()).trim();
    throw new Error(
      `Failed to resolve mapped port for ${containerName}:${containerPort}\n${stderr}`,
    );
  }

  // docker port output examples:
  // 0.0.0.0:49153
  // :::49153
  const match = stdout.match(/:(\d+)\s*$/);
  if (!match) {
    throw new Error(`Unexpected docker port output: "${stdout}"`);
  }

  return Number(match[1]);
}

/** Wait until a TCP port is accepting connections. */
async function waitForPort(
  port: number,
  timeoutMs: number,
  intervalMs = 200,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const socket = await Bun.connect({
        hostname: "localhost",
        port,
        socket: {
          data() {},
          open(socket) {
            socket.end();
          },
          error() {},
          close() {},
        },
      });
      return;
    } catch {
      await Bun.sleep(intervalMs);
    }
  }
  throw new Error(`Port ${port} not ready after ${timeoutMs}ms`);
}

/** Wait until Postgres accepts SQL connections (initdb may still be running). */
async function waitForPgReady(port: number, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = Bun.spawnSync([
      "docker",
      "exec",
      PG_CONTAINER,
      "pg_isready",
      "-U",
      "test",
      "-d",
      "test",
    ]);
    if (result.exitCode === 0) return;
    await Bun.sleep(500);
  }
  throw new Error(`Postgres not ready after ${timeoutMs}ms`);
}

async function run(cmd: string[]): Promise<{ exitCode: number }> {
  const proc = Bun.spawn(cmd, { stdout: "ignore", stderr: "ignore" });
  const exitCode = await proc.exited;
  return { exitCode };
}

async function runOrThrow(cmd: string[]): Promise<void> {
  const proc = Bun.spawn(cmd, { stdout: "pipe", stderr: "pipe" });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`Command failed (${exitCode}): ${cmd.join(" ")}\n${stderr}`);
  }
}
