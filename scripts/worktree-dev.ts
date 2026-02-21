#!/usr/bin/env bun
import { createServer } from "node:net";

const decoder = new TextDecoder();

interface PortAllocation {
  POSTGRES_PORT: number;
  REDIS_PORT: number;
  CENTRIFUGO_WS_PORT: number;
  CENTRIFUGO_API_PORT: number;
  BACKEND_PORT: number;
  FRONTEND_PORT: number;
}

/**
 * Check if a port is available for binding
 */
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

/**
 * Find a free port starting from the given port number
 * Attempts up to 1000 sequential ports
 */
async function findFreePort(start: number, used: Set<number>): Promise<number> {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const candidate = start + attempt;
    if (used.has(candidate)) continue;
    if (await isPortAvailable(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }
  throw new Error(`No free ports found starting from ${start}`);
}

/**
 * Get worktree ID from git branch name
 * Sanitizes branch name by replacing '/' with '_' and converting to lowercase
 */
function getWorktreeId(): string {
  const result = Bun.spawnSync(["git", "rev-parse", "--abbrev-ref", "HEAD"], {
    stdout: "pipe",
    stderr: "pipe",
  });

  if (result.exitCode !== 0) {
    const stderr = decoder.decode(result.stderr).trim();
    throw new Error(`Failed to get git branch: ${stderr}`);
  }

  const branch = decoder.decode(result.stdout).trim();

  // Sanitize branch name: replace '/' with '_', convert to lowercase
  const worktreeId = branch.replace(/\//g, "_").toLowerCase();

  return worktreeId;
}

/**
 * Allocate ports for a worktree
 * Default starting ports: PostgreSQL 5432, Redis 6379, Centrifugo WS 8800, Centrifugo API 8801, Backend 3001, Frontend 3000
 */
async function allocatePorts(
  worktreeId: string,
  defaults: Partial<PortAllocation> = {},
): Promise<PortAllocation> {
  const used = new Set<number>();

  // Default starting ports
  const postgresStart = defaults.POSTGRES_PORT ?? 5432;
  const redisStart = defaults.REDIS_PORT ?? 6379;
  const centrifugoWsStart = defaults.CENTRIFUGO_WS_PORT ?? 8800;
  const centrifugoApiStart = defaults.CENTRIFUGO_API_PORT ?? 8801;
  const backendStart = defaults.BACKEND_PORT ?? 3001;
  const frontendStart = defaults.FRONTEND_PORT ?? 3000;

  // For main branch, use default ports
  if (worktreeId === "main" || worktreeId === "master") {
    return {
      POSTGRES_PORT: postgresStart,
      REDIS_PORT: redisStart,
      CENTRIFUGO_WS_PORT: centrifugoWsStart,
      CENTRIFUGO_API_PORT: centrifugoApiStart,
      BACKEND_PORT: backendStart,
      FRONTEND_PORT: frontendStart,
    };
  }

  // Allocate ports sequentially
  const POSTGRES_PORT = await findFreePort(postgresStart, used);
  const REDIS_PORT = await findFreePort(redisStart, used);
  const CENTRIFUGO_WS_PORT = await findFreePort(centrifugoWsStart, used);
  const CENTRIFUGO_API_PORT = await findFreePort(centrifugoApiStart, used);
  const BACKEND_PORT = await findFreePort(backendStart, used);
  const FRONTEND_PORT = await findFreePort(frontendStart, used);

  return {
    POSTGRES_PORT,
    REDIS_PORT,
    CENTRIFUGO_WS_PORT,
    CENTRIFUGO_API_PORT,
    BACKEND_PORT,
    FRONTEND_PORT,
  };
}

/**
 * Show usage instructions
 */
function showUsage() {
  console.log(`
Usage: bun scripts/worktree-dev.ts [command]

Commands:
  start     Start worktree development environment (allocate ports, generate env, start Docker)
  stop      Stop worktree development environment
  --help    Show this help message

Examples:
  bun scripts/worktree-dev.ts start
  bun scripts/worktree-dev.ts stop
  bun scripts/worktree-dev.ts --help
`);
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    showUsage();
    process.exit(0);
  }

  switch (command) {
    case "start":
      console.log("Start command not yet implemented");
      process.exit(1);
      break;
    case "stop":
      console.log("Stop command not yet implemented");
      process.exit(1);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      showUsage();
      process.exit(1);
  }
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
