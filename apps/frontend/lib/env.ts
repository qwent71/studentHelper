const DEFAULT_BACKEND_URL = "http://localhost:3001";
const DEFAULT_FRONTEND_URL = "http://localhost:3000";
const DEFAULT_FRONTEND_PORT = 3000;

function parsePort(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// Keep frontend naming aligned with packages/config while supporting NEXT_PUBLIC values in browser bundles.
export function getBackendUrl(): string {
  if (typeof window === "undefined") {
    return (
      process.env.BACKEND_URL ??
      process.env.NEXT_PUBLIC_BACKEND_URL ??
      DEFAULT_BACKEND_URL
    );
  }

  return process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_BACKEND_URL;
}

export function getFrontendUrl(): string {
  if (typeof window === "undefined") {
    return (
      process.env.FRONTEND_URL ??
      process.env.NEXT_PUBLIC_FRONTEND_URL ??
      DEFAULT_FRONTEND_URL
    );
  }

  return process.env.NEXT_PUBLIC_FRONTEND_URL ?? DEFAULT_FRONTEND_URL;
}

export function getFrontendPort(): number {
  if (typeof window === "undefined") {
    return parsePort(
      process.env.FRONTEND_PORT ?? process.env.NEXT_PUBLIC_FRONTEND_PORT,
      DEFAULT_FRONTEND_PORT,
    );
  }

  return parsePort(process.env.NEXT_PUBLIC_FRONTEND_PORT, DEFAULT_FRONTEND_PORT);
}
