import { Worker } from "bullmq";
import { redis } from "../redis";

new Worker(
  "message-generation",
  async (job) => {
    console.log(`Processing message-generation job ${job.id}`);
  },
  { connection: redis },
);

new Worker(
  "auto-archive",
  async (job) => {
    console.log(`Processing auto-archive job ${job.id}`);
  },
  { connection: redis },
);
