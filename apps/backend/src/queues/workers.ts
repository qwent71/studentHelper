import { Worker } from "bullmq";
import OpenAI from "openai";
import { env } from "@student-helper/config";
import type { DoneEvent, ErrorEvent, TokenEvent } from "@student-helper/contracts/stream";
import { redis } from "../redis";
import { publishToChannel } from "../modules/centrifugo/publish";
import * as chatRepo from "../modules/chat/repo";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

new Worker(
  "message-generation",
  async (job) => {
    const { chatId } = job.data as {
      chatId: string;
      messageId: string;
    };

    const channel = `chat:${chatId}`;

    try {
      const messages = await chatRepo.getChatMessages(chatId);

      const openaiMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      }));

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: openaiMessages,
        stream: true,
      });

      let fullContent = "";

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          fullContent += delta;
          const tokenEvent: TokenEvent = {
            type: "token",
            v: 1,
            text: delta,
          };
          await publishToChannel(channel, tokenEvent);
        }
      }

      await chatRepo.createMessage(chatId, "assistant", fullContent);

      const doneEvent: DoneEvent = {
        type: "done",
        v: 1,
      };
      await publishToChannel(channel, doneEvent);
    } catch (err) {
      const errorEvent: ErrorEvent = {
        type: "error",
        v: 1,
        code: "GENERATION_FAILED",
        message: err instanceof Error ? err.message : "Unknown error",
      };
      await publishToChannel(channel, errorEvent);
      throw err;
    }
  },
  { connection: redis },
);

new Worker(
  "auto-archive",
  async () => {
    // TODO: implement auto-archive logic
  },
  { connection: redis },
);
