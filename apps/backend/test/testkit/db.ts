import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../src/db/schema";

let sql: ReturnType<typeof postgres> | undefined;
let _db: PostgresJsDatabase<typeof schema> | undefined;

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!_db) {
    sql = postgres(process.env.DATABASE_URL!);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

const TABLES = [
  "message",
  "chat",
  "invitation",
  "member",
  "organization",
  "session",
  "account",
  "verification",
  "user",
] as const;

export async function resetDb(): Promise<void> {
  if (!sql) {
    sql = postgres(process.env.DATABASE_URL!);
  }
  await sql.unsafe(
    `TRUNCATE ${TABLES.map((t) => `"${t}"`).join(", ")} CASCADE`,
  );
}

export async function closeDb(): Promise<void> {
  if (sql) {
    await sql.end();
    sql = undefined;
    _db = undefined;
  }
}
