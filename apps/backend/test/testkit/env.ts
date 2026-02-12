/**
 * Override process.env with test-specific values.
 *
 * Called after ephemeral containers are started, so we know the actual
 * random ports. The `.env.test` file provides safe placeholders (port 0)
 * that prevent accidental connections to dev infrastructure before this
 * function runs.
 */
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
  process.env.FRONTEND_PORT = "3000";
  process.env.BACKEND_PORT = "3001";
  process.env.CENTRIFUGO_TOKEN_SECRET = "test-centrifugo-secret";
  process.env.CENTRIFUGO_URL = "http://localhost:0";
}
