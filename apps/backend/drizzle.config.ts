import { resolve } from "path";
import { defineConfig } from "@drepkovsky/drizzle-migrations";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(resolve(process.cwd(), "../../.env"));
  } catch {}
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    schema: "public",
    table: "drizzle_migrations",
  },
  getMigrator: async () => {
    const client = postgres(process.env.DATABASE_URL!, { max: 1 });
    return drizzle(client);
  },
});
