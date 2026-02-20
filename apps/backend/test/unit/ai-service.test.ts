import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { AIService, AIServiceError } from "../../src/modules/ai/ai-service";

const originalFetch = globalThis.fetch;

function mockFetchResponse(body: unknown, status = 200) {
  return mock(() =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        statusText: status === 200 ? "OK" : "Error",
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
}

describe("AIService", () => {
  let service: AIService;

  beforeEach(() => {
    service = new AIService({
      baseUrl: "https://test-openrouter.example.com/api/v1",
      apiKey: "sk-test-key",
      defaultModel: "test-model",
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should return completion result on success", async () => {
    globalThis.fetch = mockFetchResponse({
      choices: [{ message: { content: "x = 2" } }],
      model: "test-model",
      usage: {
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
      },
    });

    const result = await service.complete([
      { role: "user", content: "Solve x + 1 = 3" },
    ]);

    expect(result.content).toBe("x = 2");
    expect(result.model).toBe("test-model");
    expect(result.usage?.promptTokens).toBe(10);
    expect(result.usage?.completionTokens).toBe(5);
    expect(result.usage?.totalTokens).toBe(15);
  });

  it("should send correct request to OpenRouter API", async () => {
    const fetchMock = mockFetchResponse({
      choices: [{ message: { content: "response" } }],
      model: "test-model",
    });
    globalThis.fetch = fetchMock;

    await service.complete(
      [
        { role: "system", content: "You are a tutor" },
        { role: "user", content: "Help me" },
      ],
      { maxTokens: 2048, temperature: 0.5 },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://test-openrouter.example.com/api/v1/chat/completions",
    );
    expect(init.method).toBe("POST");

    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer sk-test-key");
    expect(headers["Content-Type"]).toBe("application/json");

    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("test-model");
    expect(body.messages).toHaveLength(2);
    expect(body.max_tokens).toBe(2048);
    expect(body.temperature).toBe(0.5);
  });

  it("should use custom model when provided", async () => {
    const fetchMock = mockFetchResponse({
      choices: [{ message: { content: "ok" } }],
      model: "custom-model",
    });
    globalThis.fetch = fetchMock;

    await service.complete(
      [{ role: "user", content: "test" }],
      { model: "custom-model" },
    );

    const body = JSON.parse(
      (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
    );
    expect(body.model).toBe("custom-model");
  });

  it("should throw AIServiceError on non-OK response", async () => {
    globalThis.fetch = mockFetchResponse(
      { error: { message: "Invalid API key" } },
      401,
    );

    try {
      await service.complete([{ role: "user", content: "test" }]);
      expect(true).toBe(false); // should not reach
    } catch (err) {
      expect(err).toBeInstanceOf(AIServiceError);
      const aiErr = err as AIServiceError;
      expect(aiErr.statusCode).toBe(401);
      expect(aiErr.message).toContain("401");
    }
  });

  it("should throw AIServiceError on empty response", async () => {
    globalThis.fetch = mockFetchResponse({
      choices: [],
      model: "test-model",
    });

    try {
      await service.complete([{ role: "user", content: "test" }]);
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(AIServiceError);
      expect((err as AIServiceError).message).toContain("Empty response");
    }
  });

  it("should handle response without usage data", async () => {
    globalThis.fetch = mockFetchResponse({
      choices: [{ message: { content: "no usage" } }],
      model: "test-model",
    });

    const result = await service.complete([
      { role: "user", content: "test" },
    ]);

    expect(result.content).toBe("no usage");
    expect(result.usage).toBeUndefined();
  });

  it("should throw AIServiceError on network error", async () => {
    globalThis.fetch = mock(() =>
      Promise.reject(new Error("Network error")),
    );

    try {
      await service.complete([{ role: "user", content: "test" }]);
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toBe("Network error");
    }
  });
});
