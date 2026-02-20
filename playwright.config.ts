import { defineConfig, devices } from "@playwright/test";

function parsePort(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const frontendPort = parsePort(process.env.FRONTEND_PORT, 3100);
const backendPort = parsePort(process.env.BACKEND_PORT, 3101);
const frontendUrl =
  process.env.FRONTEND_URL ?? `http://127.0.0.1:${frontendPort}`;
const backendUrl = process.env.BACKEND_URL ?? `http://127.0.0.1:${backendPort}`;

if (!process.env.DATABASE_URL || !process.env.REDIS_URL) {
  throw new Error(
    "DATABASE_URL and REDIS_URL are required for isolated e2e. Use `bun run e2e`.",
  );
}

const e2eEnv = {
  ...process.env,
  NODE_ENV: "test",
  BACKEND_PORT: String(backendPort),
  FRONTEND_PORT: String(frontendPort),
  BACKEND_URL: backendUrl,
  FRONTEND_URL: frontendUrl,
  NEXT_PUBLIC_BACKEND_URL: backendUrl,
  NEXT_PUBLIC_FRONTEND_URL: frontendUrl,
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  BETTER_AUTH_SECRET:
    process.env.BETTER_AUTH_SECRET ?? "e2e-test-secret-for-testing-only",
  CENTRIFUGO_TOKEN_SECRET:
    process.env.CENTRIFUGO_TOKEN_SECRET ?? "e2e-test-centrifugo-secret",
  CENTRIFUGO_URL: process.env.CENTRIFUGO_URL ?? "http://127.0.0.1:0",
  NEXT_DIST_DIR: process.env.NEXT_DIST_DIR ?? ".next-e2e",
} as const;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: frontendUrl,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      grepInvert: /@mobile/i,
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
      grep: /@mobile/i,
    },
  ],
  webServer: [
    {
      command: "bun run --cwd apps/backend dev",
      url: `${backendUrl}/health`,
      reuseExistingServer: false,
      timeout: 30_000,
      env: e2eEnv,
    },
    {
      command: "bun run --cwd apps/frontend dev",
      url: frontendUrl,
      reuseExistingServer: false,
      timeout: 60_000,
      env: e2eEnv,
    },
  ],
});
