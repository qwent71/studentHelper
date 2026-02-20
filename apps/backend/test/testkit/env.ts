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
  const frontendPort = process.env.TEST_FRONTEND_PORT ?? "3100";
  const backendPort = process.env.TEST_BACKEND_PORT ?? "3101";

  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = postgresUrl;
  process.env.REDIS_URL = redisUrl;
  process.env.BETTER_AUTH_SECRET = "test-secret-for-testing-only";
  process.env.FRONTEND_URL = `http://127.0.0.1:${frontendPort}`;
  process.env.BACKEND_URL = `http://127.0.0.1:${backendPort}`;
  process.env.FRONTEND_PORT = frontendPort;
  process.env.BACKEND_PORT = backendPort;
  process.env.CENTRIFUGO_TOKEN_SECRET = "test-centrifugo-secret";
  process.env.CENTRIFUGO_URL = "http://127.0.0.1:0";

  // Google OAuth — test credentials for social provider registration
  process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
  process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret";
}
