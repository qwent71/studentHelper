import type { ConnectionOptions } from "bullmq";
import { Worker } from "bullmq";
import OpenAI from "openai";
import { redis } from "../redis";

// Cast needed: top-level ioredis and bullmq's bundled ioredis types diverge
const connection = redis as unknown as ConnectionOptions;
import { streamChatCompletions } from "../lib/llm";
import { publishToChannel, getChatChannel } from "../lib/centrifugo";
import * as repo from "../modules/chat/repo";
import { MAX_CONTEXT_MESSAGES } from "../modules/chat/services";
import type { StreamEvent } from "@student-helper/contracts/stream";
import type { MessageGenerationJobData } from "./index";

new Worker<MessageGenerationJobData>(
  "message-generation",
  async (job) => {
    const { chatId } = job.data;
    const channel = getChatChannel(chatId);

    try {
      const messages = await repo.getMessagesByChatId(
        chatId,
        MAX_CONTEXT_MESSAGES,
      );

      const formattedMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      }));

      const stream = await streamChatCompletions({
        messages: formattedMessages,
      });

      let fullText = "";
      let usage: { prompt_tokens?: number; completion_tokens?: number } | null =
        null;

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? "";

        if (delta) {
          const tokenEvent: StreamEvent = {
            type: "token",
            v: 1,
            text: delta,
          };
          await publishToChannel(channel, tokenEvent);
          fullText += delta;
        }

        if (chunk.usage) {
          usage = chunk.usage;
        }
      }

      await repo.createMessage(chatId, "assistant", fullText);

      const doneEvent: StreamEvent = {
        type: "done",
        v: 1,
        usage: {
          inputTokens: usage?.prompt_tokens ?? 0,
          outputTokens: usage?.completion_tokens ?? 0,
        },
      };
      await publishToChannel(channel, doneEvent);

      await repo.updateChatTimestamp(chatId);
    } catch (err) {
      let code = "llm_error";
      let message = "An unexpected error occurred";

      if (err instanceof OpenAI.APIError) {
        if (err.status === 429) {
          code = "rate_limit";
        } else if (err.status === 408) {
          code = "timeout";
        }
        message = err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }

      const errorEvent: StreamEvent = {
        type: "error",
        v: 1,
        code,
        message,
      };
      await publishToChannel(channel, errorEvent).catch(() => {});

      throw err;
    }
  },
  {
    connection,
    concurrency: 3,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
);

new Worker(
  "auto-archive",
  async () => {
    // TODO: implement auto-archive logic
  },
  { connection },
);
