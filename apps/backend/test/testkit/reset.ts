import { resetDb } from "./db";
import { resetRedis } from "./redis";

export async function resetAll(): Promise<void> {
  await Promise.all([resetDb(), resetRedis()]);
}
