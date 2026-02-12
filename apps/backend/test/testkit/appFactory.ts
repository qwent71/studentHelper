// Dynamic import to avoid loading env-dependent modules at import time.
// The app module (and its transitive deps like db, redis) access env vars
// at module load, so we defer import until createTestApp() is called
// — after the preload has started containers and set process.env.
export async function createTestApp() {
  const { createApp } = await import("../../src/app");
  return createApp();
}
