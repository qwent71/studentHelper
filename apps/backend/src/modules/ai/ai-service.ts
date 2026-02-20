import { env } from "@student-helper/config";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface CompletionResult {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly responseBody?: unknown,
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

export class AIService {
  private baseUrl: string;
  private apiKey: string;
  private defaultModel: string;

  constructor(options?: {
    baseUrl?: string;
    apiKey?: string;
    defaultModel?: string;
  }) {
    this.baseUrl = options?.baseUrl ?? env.OPENROUTER_BASE_URL;
    this.apiKey = options?.apiKey ?? env.OPENROUTER_API_KEY;
    this.defaultModel = options?.defaultModel ?? env.OPENROUTER_DEFAULT_MODEL;
  }

  async complete(
    messages: ChatMessage[],
    options?: CompletionOptions,
  ): Promise<CompletionResult> {
    const model = options?.model ?? this.defaultModel;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => null);
      throw new AIServiceError(
        `OpenRouter API error: ${response.status} ${response.statusText}`,
        response.status,
        body,
      );
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      model: string;
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };

    const choice = data.choices?.[0];
    if (!choice?.message?.content) {
      throw new AIServiceError("Empty response from OpenRouter API");
    }

    return {
      content: choice.message.content,
      model: data.model,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }
}
