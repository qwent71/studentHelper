#!/usr/bin/env bun
import { createServer } from "node:net";
import { resolve } from "node:path";

const decoder = new TextDecoder();

interface PortAllocation {
  POSTGRES_PORT: number;
  REDIS_PORT: number;
  CENTRIFUGO_WS_PORT: number;
  CENTRIFUGO_API_PORT: number;
  BACKEND_PORT: number;
  FRONTEND_PORT: number;
}

interface PortRegistry {
  [worktreeId: string]: PortAllocation;
}

const PORT_REGISTRY_FILE = ".worktree-ports.json";
const DOCKER_COMPOSE_FILE = "docker/docker-compose.dev.yml";

/**
 * Run a command synchronously
 */
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

/**
 * Run a command or throw an error if it fails
 */
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

/**
 * Check if Docker is available
 */
function ensureDockerAvailable() {
  const result = runSync(["docker", "info"], {
    stdout: "ignore",
    stderr: "ignore",
  });
  if (result.exitCode !== 0) {
    throw new Error(
      "Docker is not available. Start Docker and retry worktree:start.",
    );
  }
}

/**
 * Check if a port is available for binding
 */
async function isPortAvailable(port: number): Promise<boolean> {
  try {
    await new Promise<void>((resolve, reject) => {
      const server = createServer();
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
 * Read port registry from .worktree-ports.json
 * Returns empty object if file doesn't exist
 */
async function readPortRegistry(): Promise<PortRegistry> {
  try {
    const file = Bun.file(PORT_REGISTRY_FILE);
    const exists = await file.exists();
    if (!exists) {
      return {};
    }
    const registry = await file.json();
    return registry as PortRegistry;
  } catch {
    return {};
  }
}

/**
 * Write port registry to .worktree-ports.json
 */
async function writePortRegistry(registry: PortRegistry): Promise<void> {
  await Bun.write(PORT_REGISTRY_FILE, JSON.stringify(registry, null, 2));
}

/**
 * Check if all ports in an allocation are still available
 */
async function arePortsStillAvailable(
  allocation: PortAllocation,
): Promise<boolean> {
  const ports = [
    allocation.POSTGRES_PORT,
    allocation.REDIS_PORT,
    allocation.CENTRIFUGO_WS_PORT,
    allocation.CENTRIFUGO_API_PORT,
    allocation.BACKEND_PORT,
    allocation.FRONTEND_PORT,
  ];

  for (const port of ports) {
    if (!(await isPortAvailable(port))) {
      return false;
    }
  }

  return true;
}

/**
 * Allocate ports for a worktree
 * Checks registry for existing ports and reuses if available
 * Default starting ports: PostgreSQL 5432, Redis 6379, Centrifugo WS 8800, Centrifugo API 8801, Backend 3001, Frontend 3000
 */
async function allocatePorts(
  worktreeId: string,
  defaults: Partial<PortAllocation> = {},
): Promise<PortAllocation> {
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

  // Check registry for existing ports
  const registry = await readPortRegistry();
  const savedPorts = registry[worktreeId];

  if (savedPorts) {
    // Validate that saved ports are still available
    if (await arePortsStillAvailable(savedPorts)) {
      return savedPorts;
    }
  }

  // Allocate new ports if no saved ports or they're not available
  const used = new Set<number>();
  const POSTGRES_PORT = await findFreePort(postgresStart, used);
  const REDIS_PORT = await findFreePort(redisStart, used);
  const CENTRIFUGO_WS_PORT = await findFreePort(centrifugoWsStart, used);
  const CENTRIFUGO_API_PORT = await findFreePort(centrifugoApiStart, used);
  const BACKEND_PORT = await findFreePort(backendStart, used);
  const FRONTEND_PORT = await findFreePort(frontendStart, used);

  const allocation: PortAllocation = {
    POSTGRES_PORT,
    REDIS_PORT,
    CENTRIFUGO_WS_PORT,
    CENTRIFUGO_API_PORT,
    BACKEND_PORT,
    FRONTEND_PORT,
  };

  // Save to registry
  registry[worktreeId] = allocation;
  await writePortRegistry(registry);

  return allocation;
}

/**
 * Generate .env.{worktree_id} file with allocated ports
 */
async function generateEnvFile(
  worktreeId: string,
  ports: PortAllocation,
): Promise<void> {
  const envFileName = `.env.${worktreeId}`;

  const envContent = `# Environment
NODE_ENV=development

# Ports
FRONTEND_PORT=${ports.FRONTEND_PORT}
BACKEND_PORT=${ports.BACKEND_PORT}

# Backend URL (used by frontend to reach the API)
BACKEND_URL=http://localhost:${ports.BACKEND_PORT}

# Frontend URL (used by backend for CORS / auth)
FRONTEND_URL=http://localhost:${ports.FRONTEND_PORT}

# Database
DATABASE_URL=postgresql://studenthelper:studenthelper@localhost:${ports.POSTGRES_PORT}/studenthelper

# Auth
BETTER_AUTH_SECRET=ee351d396c28282c5f729512999c552ee8458fe5cd44ed75a20f6d1f6248f48e

# Redis
REDIS_URL=redis://localhost:${ports.REDIS_PORT}

# Centrifugo
CENTRIFUGO_TOKEN_SECRET=centrifugo-dev-secret
CENTRIFUGO_URL=http://localhost:${ports.CENTRIFUGO_WS_PORT}

# Next.js Public Variables
NEXT_PUBLIC_BACKEND_URL=http://localhost:${ports.BACKEND_PORT}
NEXT_PUBLIC_FRONTEND_URL=http://localhost:${ports.FRONTEND_PORT}

# OpenAI (optional)
# OPENAI_API_KEY=sk-...

# Docker compose overrides (optional, used by docker/docker-compose.yml)
# COMPOSE_DATABASE_URL=postgresql://studenthelper:studenthelper@postgres:5432/studenthelper
# COMPOSE_REDIS_URL=redis://redis:6379
# COMPOSE_CENTRIFUGO_URL=http://centrifugo:8000
`;

  await Bun.write(envFileName, envContent);
}

/**
 * Start Docker Compose services with worktree-specific configuration
 */
function startDockerCompose(worktreeId: string, ports: PortAllocation): void {
  const composeFile = resolve(import.meta.dir, "..", DOCKER_COMPOSE_FILE);

  // Prepare environment variables for Docker Compose
  const composeEnv = {
    ...process.env,
    WORKTREE_ID: worktreeId,
    POSTGRES_PORT: ports.POSTGRES_PORT.toString(),
    REDIS_PORT: ports.REDIS_PORT.toString(),
    CENTRIFUGO_WS_PORT: ports.CENTRIFUGO_WS_PORT.toString(),
    CENTRIFUGO_API_PORT: ports.CENTRIFUGO_API_PORT.toString(),
    COMPOSE_PROJECT_NAME: `studenthelper_${worktreeId}`,
  };

  // Start Docker Compose services
  runOrThrow(["docker", "compose", "-f", composeFile, "up", "-d"], {
    env: composeEnv,
    stdout: "inherit",
    stderr: "inherit",
  });
}

/**
 * Stop Docker Compose services for current worktree
 */
function stopDockerCompose(worktreeId: string): void {
  const composeFile = resolve(import.meta.dir, "..", DOCKER_COMPOSE_FILE);

  // Prepare environment variables for Docker Compose
  const composeEnv = {
    ...process.env,
    WORKTREE_ID: worktreeId,
    COMPOSE_PROJECT_NAME: `studenthelper_${worktreeId}`,
  };

  // Stop Docker Compose services (without removing volumes)
  runOrThrow(["docker", "compose", "-f", composeFile, "down"], {
    env: composeEnv,
    stdout: "inherit",
    stderr: "inherit",
  });
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
    case "start": {
      const worktreeId = getWorktreeId();
      console.log(`\n🌿 Starting worktree environment: ${worktreeId}\n`);

      // Check Docker availability
      console.log("Checking Docker...");
      ensureDockerAvailable();
      console.log("✓ Docker is available\n");

      // Allocate ports
      console.log("Allocating ports...");
      const ports = await allocatePorts(worktreeId);

      console.log("\n📋 Allocated ports:");
      console.log(`  PostgreSQL:        ${ports.POSTGRES_PORT}`);
      console.log(`  Redis:             ${ports.REDIS_PORT}`);
      console.log(`  Centrifugo WS:     ${ports.CENTRIFUGO_WS_PORT}`);
      console.log(`  Centrifugo API:    ${ports.CENTRIFUGO_API_PORT}`);
      console.log(`  Backend:           ${ports.BACKEND_PORT}`);
      console.log(`  Frontend:          ${ports.FRONTEND_PORT}`);
      console.log(`\n✓ Port registry saved to ${PORT_REGISTRY_FILE}\n`);

      // Generate environment file
      console.log("Generating environment file...");
      await generateEnvFile(worktreeId, ports);
      console.log(`✓ Environment file created: .env.${worktreeId}\n`);

      // Start Docker Compose services
      console.log("Starting Docker Compose services...");
      startDockerCompose(worktreeId, ports);
      console.log("✓ Docker Compose services started\n");

      console.log("🎉 Worktree environment is ready!");
      console.log("\nNext steps:");
      console.log(`  1. Load environment: export $(cat .env.${worktreeId} | xargs)`);
      console.log("  2. Run migrations:   bun worktree:migrate");
      console.log("  3. Start dev server: bun run dev\n");
      break;
    }
    case "stop": {
      const worktreeId = getWorktreeId();
      console.log(`\n🛑 Stopping worktree environment: ${worktreeId}\n`);

      // Check Docker availability
      console.log("Checking Docker...");
      ensureDockerAvailable();
      console.log("✓ Docker is available\n");

      // Stop Docker Compose services
      console.log("Stopping Docker Compose services...");
      stopDockerCompose(worktreeId);
      console.log("✓ Docker Compose services stopped\n");

      console.log("✅ Worktree environment stopped successfully!");
      console.log("\nNote:");
      console.log("  - Docker volumes preserved (data not deleted)");
      console.log("  - Port allocations saved for next start");
      console.log(`  - To restart: bun worktree:start\n`);
      break;
    }
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
