export function applyTestEnv({
  postgresUrl,
  redisUrl,
}: {
  postgresUrl: string;
  redisUrl: string;
}) {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = postgresUrl;
  process.env.REDIS_URL = redisUrl;
  process.env.BETTER_AUTH_SECRET = "test-secret-for-testing-only";
  process.env.FRONTEND_URL = "http://localhost:3000";
  process.env.BACKEND_URL = "http://localhost:3001";
}
