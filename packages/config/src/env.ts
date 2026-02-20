import { z } from "zod";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

function parseDotEnv(content: string): Record<string, string> {
  const parsed: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equalsIndex = line.indexOf("=");
    if (equalsIndex <= 0) continue;

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else {
      const commentIndex = value.indexOf(" #");
      if (commentIndex >= 0) value = value.slice(0, commentIndex).trim();
    }

    parsed[key] = value;
  }

  return parsed;
}

function preloadEnvFiles(): void {
  let currentDir = process.cwd();
  const seen = new Set<string>();
  const filesToLoad: string[] = [];

  while (true) {
    const localEnv = join(currentDir, ".env.local");
    const baseEnv = join(currentDir, ".env");

    if (!seen.has(localEnv)) {
      filesToLoad.push(localEnv);
      seen.add(localEnv);
    }

    if (!seen.has(baseEnv)) {
      filesToLoad.push(baseEnv);
      seen.add(baseEnv);
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  for (const filePath of filesToLoad) {
    if (!existsSync(filePath)) continue;
    const parsed = parseDotEnv(readFileSync(filePath, "utf8"));
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

preloadEnvFiles();

const envSchema = z.object({
  // ── Core ──────────────────────────────────────────────
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  FRONTEND_PORT: z.coerce.number().default(3000),
  BACKEND_PORT: z.coerce.number().default(3001),
  BACKEND_URL: z.string().default("http://localhost:3001"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),

  // ── Database ──────────────────────────────────────────
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // ── Auth ──────────────────────────────────────────────
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // ── Redis ─────────────────────────────────────────────
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // ── Centrifugo ────────────────────────────────────────
  CENTRIFUGO_TOKEN_SECRET: z.string().default("centrifugo-dev-secret"),
  CENTRIFUGO_URL: z.string().default("http://localhost:8800"),

  // ── AI — OpenRouter (primary model gateway) ───────────
  OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
  OPENROUTER_BASE_URL: z
    .string()
    .url()
    .default("https://openrouter.ai/api/v1"),
  OPENROUTER_DEFAULT_MODEL: z
    .string()
    .default("google/gemini-2.0-flash-001"),

  // ── AI — OpenAI (optional, fallback) ──────────────────
  OPENAI_API_KEY: z.string().optional(),

  // ── OCR ───────────────────────────────────────────────
  OCR_PROVIDER: z
    .enum(["google-vision", "tesseract", "none"])
    .default("google-vision"),
  OCR_FALLBACK_PROVIDER: z
    .enum(["google-vision", "tesseract", "none"])
    .default("none"),
  OCR_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.7),
  GOOGLE_VISION_API_KEY: z.string().optional(),

  // ── Sentry (observability) ────────────────────────────
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(overrides?: Record<string, unknown>): Env {
  const result = envSchema.safeParse({ ...process.env, ...overrides });

  if (!result.success) {
    const missing: string[] = [];
    const invalid: string[] = [];

    for (const issue of result.error.issues) {
      const key = issue.path.join(".");
      if (
        issue.code === "invalid_type" &&
        (issue.received === "undefined" || issue.received === "null")
      ) {
        missing.push(key);
      } else {
        invalid.push(`  ${key}: ${issue.message}`);
      }
    }

    const lines = ["\n[env] Environment validation failed:\n"];
    if (missing.length > 0) {
      lines.push(`  Missing required variables:\n    ${missing.join("\n    ")}`);
    }
    if (invalid.length > 0) {
      lines.push(`  Invalid variables:\n${invalid.join("\n")}`);
    }
    lines.push("\n  Check your .env file or see .env.example for reference.\n");

    throw new Error(lines.join("\n"));
  }

  return result.data;
}

let _env: Env | undefined;

export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string) {
    if (!_env) _env = parseEnv();
    return _env[prop as keyof Env];
  },
});
