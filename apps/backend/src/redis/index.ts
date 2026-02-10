import Redis from "ioredis";
import { env } from "@student-helper/config";

export const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
