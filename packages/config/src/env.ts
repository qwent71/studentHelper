import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  FRONTEND_PORT: z.coerce.number().default(3000),
  BACKEND_PORT: z.coerce.number().default(3001),
  BACKEND_URL: z.string().default("http://localhost:3001"),
  DATABASE_URL: z.string().optional(),
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
