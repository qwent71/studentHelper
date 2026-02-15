import postgres from "postgres";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://studenthelper:studenthelper@localhost:5432/studenthelper";

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

let sql: ReturnType<typeof postgres> | undefined;

function getConnection() {
  if (!sql) {
    sql = postgres(DATABASE_URL);
  }
  return sql;
}

export async function resetTestData(): Promise<void> {
  const conn = getConnection();
  await conn.unsafe(
    `TRUNCATE ${TABLES.map((t) => `"${t}"`).join(", ")} CASCADE`,
  );
}

export async function closeConnection(): Promise<void> {
  if (sql) {
    await sql.end();
    sql = undefined;
  }
}
