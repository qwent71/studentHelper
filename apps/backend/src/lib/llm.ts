import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { env } from "@student-helper/config";

export const openrouter = new OpenAI({
  apiKey: env.OPENROUTER_API_KEY,
  baseURL: env.OPENROUTER_BASE_URL,
});

export interface StreamChatOptions {
  messages: ChatCompletionMessageParam[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  abortSignal?: AbortSignal;
}

export function streamChatCompletions({
  messages,
  model,
  temperature = 0.7,
  maxTokens = 4096,
  abortSignal,
}: StreamChatOptions) {
  return openrouter.chat.completions.create(
    {
      model: model ?? env.OPENROUTER_DEFAULT_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
      stream_options: { include_usage: true },
    },
    { signal: abortSignal },
  );
}
