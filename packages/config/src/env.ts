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
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  FRONTEND_PORT: z.coerce.number().default(3000),
  BACKEND_PORT: z.coerce.number().default(3001),
  BACKEND_URL: z.string().default("http://localhost:3001"),
  DATABASE_URL: z.string(),
  BETTER_AUTH_SECRET: z.string(),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  CENTRIFUGO_TOKEN_SECRET: z.string().default("centrifugo-dev-secret"),
  CENTRIFUGO_URL: z.string().default("http://localhost:8800"),
  OPENAI_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(overrides?: Record<string, unknown>): Env {
  return envSchema.parse({ ...process.env, ...overrides });
}

let _env: Env | undefined;

export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string) {
    if (!_env) _env = parseEnv();
    return _env[prop as keyof Env];
  },
});
