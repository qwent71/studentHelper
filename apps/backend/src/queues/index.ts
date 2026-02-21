import type { ConnectionOptions } from "bullmq";
import { Queue } from "bullmq";
import { redis } from "../redis";

// Cast needed: top-level ioredis and bullmq's bundled ioredis types diverge
const connection = redis as unknown as ConnectionOptions;

export interface MessageGenerationJobData {
  chatId: string;
  messageId: string;
  userId: string;
}

export const messageGenerationQueue = new Queue("message-generation", {
  connection,
});

export const autoArchiveQueue = new Queue("auto-archive", {
  connection,
});
