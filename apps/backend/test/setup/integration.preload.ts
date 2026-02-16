import { resolve } from "path";
import { beforeAll, beforeEach, afterAll } from "bun:test";
import { startContainers, stopContainers } from "../testkit/containers";
import { applyTestEnv } from "../testkit/env";
import { resetAll } from "../testkit/reset";
import { closeDb } from "../testkit/db";
import { closeRedis } from "../testkit/redis";

if (process.env.RUN_INTEGRATION === "0") {
  console.log("Skipping integration tests (RUN_INTEGRATION=0)");
  process.exit(0);
}

const backendRoot = resolve(import.meta.dir, "../..");

beforeAll(async () => {
  console.log("[preload] Starting containers...");
  const { postgresUrl, redisUrl } = await startContainers();
  console.log("[preload] Containers ready");

  applyTestEnv({ postgresUrl, redisUrl });

  // Run Drizzle migrations against the test database
  console.log("[preload] Running migrations...");
  await runMigrationsWithRetry();
  console.log("[preload] Migrations complete");
});

beforeEach(async () => {
  await resetAll();
});

afterAll(async () => {
  await closeDb();
  await closeRedis();
  await stopContainers();
});

async function runMigrationsWithRetry(): Promise<void> {
  const maxAttempts = 20;
  const retryDelayMs = 1_000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = Bun.spawnSync(
      ["bunx", "drizzle-migrations", "up"],
      {
        cwd: backendRoot,
        env: process.env as Record<string, string>,
        stdout: "inherit",
        stderr: "inherit",
      },
    );

    if (result.exitCode === 0) {
      return;
    }

    if (attempt === maxAttempts) {
      throw new Error(
        `Drizzle migrations failed after ${maxAttempts} attempts (last exit code ${result.exitCode})`,
      );
    }

    console.log(
      `[preload] Migrations attempt ${attempt}/${maxAttempts} failed, retrying in ${retryDelayMs}ms...`,
    );
    await Bun.sleep(retryDelayMs);
  }
}
