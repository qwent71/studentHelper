import { Queue } from "bullmq";
import { redis } from "../redis";

export const messageGenerationQueue = new Queue("message-generation", {
  connection: redis,
});

export const autoArchiveQueue = new Queue("auto-archive", {
  connection: redis,
});
