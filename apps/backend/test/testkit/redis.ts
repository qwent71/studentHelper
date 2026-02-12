import Redis from "ioredis";

let redis: Redis | undefined;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
  }
  return redis;
}

export async function resetRedis(): Promise<void> {
  await getRedis().flushall();
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    redis.disconnect();
    redis = undefined;
  }
}
