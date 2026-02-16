import {
  GenericContainer,
  type StartedTestContainer,
  Wait,
} from "testcontainers";

/**
 * Integration tests run under Bun. We disable Ryuk by default because Bun still
 * has open compatibility issues with the reaper log stream handling.
 * Containers are always stopped explicitly in stopContainers().
 */
const POSTGRES_IMAGE = "postgres:17-alpine";
const REDIS_IMAGE = "redis:7-alpine";

interface ContainerState {
  postgres: StartedTestContainer;
  redis: StartedTestContainer;
}

let state: ContainerState | undefined;
let postgresUrl = "";
let redisUrl = "";

export async function startContainers(): Promise<{
  postgresUrl: string;
  redisUrl: string;
}> {
  if (state) {
    return { postgresUrl, redisUrl };
  }

  process.env.TESTCONTAINERS_RYUK_DISABLED ??= "true";

  const postgres = await new GenericContainer(POSTGRES_IMAGE)
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
    redis = await new GenericContainer(REDIS_IMAGE)
      .withExposedPorts(6379)
      .withWaitStrategy(Wait.forAll([]))
      .withStartupTimeout(10_000)
      .start();
  } catch (error) {
    await postgres.stop().catch(() => undefined);
    throw error;
  }

  const pgHostRaw = postgres.getHost();
  const pgPort = postgres.getMappedPort(5432);
  const redisHostRaw = redis.getHost();
  const redisPort = redis.getMappedPort(6379);

  try {
    await waitForPort({ host: pgHostRaw, port: pgPort, timeoutMs: 30_000 });
    await waitForPort({
      host: redisHostRaw,
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

  const pgHost = normalizeHost(pgHostRaw);
  const redisHost = normalizeHost(redisHostRaw);

  postgresUrl = `postgresql://test:test@${pgHost}:${pgPort}/test`;
  redisUrl = `redis://${redisHost}:${redisPort}`;
  state = { postgres, redis };

  return { postgresUrl, redisUrl };
}

export async function stopContainers(): Promise<void> {
  if (!state) return;

  const { postgres, redis } = state;
  state = undefined;
  postgresUrl = "";
  redisUrl = "";

  await Promise.all([
    postgres.stop().catch(() => undefined),
    redis.stop().catch(() => undefined),
  ]);
}

function normalizeHost(host: string): string {
  if (host.includes(":") && !host.startsWith("[") && !host.endsWith("]")) {
    return `[${host}]`;
  }
  return host;
}

async function waitForPort({
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

  throw new Error(`Port ${host}:${port} not ready after ${timeoutMs}ms`);
}
