function parsePort(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const frontendPort = parsePort(process.env.FRONTEND_PORT, 3100);
const backendPort = parsePort(process.env.BACKEND_PORT, 3101);

export const FRONTEND_URL =
  process.env.FRONTEND_URL ?? `http://127.0.0.1:${frontendPort}`;
export const BACKEND_URL =
  process.env.BACKEND_URL ?? `http://127.0.0.1:${backendPort}`;

export function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required for e2e tests. Run tests via `bun run e2e`.",
    );
  }
  return databaseUrl;
}
