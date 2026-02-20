import { describe, it, expect, afterEach } from "bun:test";
import { createTestApp, request } from "../testkit";

const originalFetch = globalThis.fetch;

function extractCookies(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}

const testUser = {
  name: "Pipeline Test User",
  email: "pipeline-test@example.com",
  password: "securePassword123",
};

async function signUp(app: ReturnType<typeof createTestApp> extends Promise<infer T> ? T : never) {
  const res = await request(app, {
    method: "POST",
    path: "/api/auth/sign-up/email",
    body: testUser,
  });
  return extractCookies(res);
}

/**
 * Install a fetch interceptor that returns a mock AI response for OpenRouter
 * calls while passing all other requests through to the original fetch.
 */
function mockOpenRouterFetch(responseContent = "Ответ: x = 2") {
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    if (url.includes("openrouter.ai") || url.includes("chat/completions")) {
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: responseContent } }],
          model: "test-model",
          usage: {
            prompt_tokens: 20,
            completion_tokens: 10,
            total_tokens: 30,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return originalFetch(input, init);
  };
}

/** Create a minimal 2x2 PNG image buffer for testing. */
function createTestPngImage(): Buffer {
  // Minimal valid PNG: 2x2 white pixels
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAADklEQVQI12P4z8BQDwAEgAF/QualIQAAAABJRU5ErkJggg==",
    "base64",
  );
  return png;
}

describe("Chat Pipeline — text message with AI generation", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should generate AI response for a text message", async () => {
    mockOpenRouterFetch("Решение: x = 2, так как 2 + 1 = 3.");
    const app = await createTestApp();
    const cookies = await signUp(app);

    // Create session
    const sessionRes = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookies },
      body: { mode: "fast" },
    });
    const session = (await sessionRes.json()) as { id: string };

    // Send message
    const msgRes = await request(app, {
      method: "POST",
      path: `/chat/sessions/${session.id}/messages`,
      headers: { Cookie: cookies },
      body: { content: "Реши: x + 1 = 3" },
    });

    expect(msgRes.status).toBe(200);
    const result = (await msgRes.json()) as {
      userMessage: { role: string; content: string; sourceType: string };
      assistantMessage: { role: string; content: string };
    };

    expect(result.userMessage.role).toBe("user");
    expect(result.userMessage.content).toBe("Реши: x + 1 = 3");
    expect(result.assistantMessage.role).toBe("assistant");
    expect(result.assistantMessage.content).toBe(
      "Решение: x = 2, так как 2 + 1 = 3.",
    );
  });

  it("should use chat history as context for AI generation", async () => {
    let capturedBody: unknown;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (url.includes("openrouter.ai") || url.includes("chat/completions")) {
        capturedBody = JSON.parse(init?.body as string);
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: "Второй ответ" } }],
            model: "test-model",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return originalFetch(input, init);
    };

    const app = await createTestApp();
    const cookies = await signUp(app);

    const sessionRes = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookies },
      body: { mode: "fast" },
    });
    const session = (await sessionRes.json()) as { id: string };

    // First message
    await request(app, {
      method: "POST",
      path: `/chat/sessions/${session.id}/messages`,
      headers: { Cookie: cookies },
      body: { content: "Первый вопрос" },
    });

    // Second message — should include history
    await request(app, {
      method: "POST",
      path: `/chat/sessions/${session.id}/messages`,
      headers: { Cookie: cookies },
      body: { content: "Второй вопрос" },
    });

    const body = capturedBody as {
      messages: Array<{ role: string; content: string }>;
    };
    // Should have system + first user + first assistant + second user
    expect(body.messages.length).toBeGreaterThanOrEqual(4);
    expect(body.messages[0]!.role).toBe("system");
    expect(body.messages[1]!.role).toBe("user");
    expect(body.messages[1]!.content).toBe("Первый вопрос");
    expect(body.messages[2]!.role).toBe("assistant");
    expect(body.messages[3]!.role).toBe("user");
    expect(body.messages[3]!.content).toBe("Второй вопрос");
  });

  it("should save AI response in message history", async () => {
    mockOpenRouterFetch("Ответ сохранен в истории");
    const app = await createTestApp();
    const cookies = await signUp(app);

    const sessionRes = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookies },
      body: { mode: "fast" },
    });
    const session = (await sessionRes.json()) as { id: string };

    await request(app, {
      method: "POST",
      path: `/chat/sessions/${session.id}/messages`,
      headers: { Cookie: cookies },
      body: { content: "Вопрос" },
    });

    // Fetch history
    const historyRes = await request(app, {
      path: `/chat/sessions/${session.id}/messages`,
      headers: { Cookie: cookies },
    });

    expect(historyRes.status).toBe(200);
    const messages = (await historyRes.json()) as Array<{
      role: string;
      content: string;
    }>;
    expect(messages).toHaveLength(2);
    expect(messages[0]!.role).toBe("user");
    expect(messages[0]!.content).toBe("Вопрос");
    expect(messages[1]!.role).toBe("assistant");
    expect(messages[1]!.content).toBe("Ответ сохранен в истории");
  });

  it("should handle AI generation failure gracefully", async () => {
    // Mock fetch to simulate OpenRouter error
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (url.includes("openrouter.ai") || url.includes("chat/completions")) {
        return new Response("Internal Server Error", { status: 500 });
      }

      return originalFetch(input, init);
    };

    const app = await createTestApp();
    const cookies = await signUp(app);

    const sessionRes = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookies },
      body: { mode: "fast" },
    });
    const session = (await sessionRes.json()) as { id: string };

    const msgRes = await request(app, {
      method: "POST",
      path: `/chat/sessions/${session.id}/messages`,
      headers: { Cookie: cookies },
      body: { content: "Вопрос при ошибке AI" },
    });

    expect(msgRes.status).toBe(200);
    const result = (await msgRes.json()) as {
      assistantMessage: { content: string };
    };
    // Should get an error fallback message, not crash
    expect(result.assistantMessage.content).toContain("ошибка");
  });
});

describe("Chat Pipeline — image upload with OCR", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should accept image upload and return AI response", async () => {
    mockOpenRouterFetch("Ответ на задачу из изображения: x = 5");
    const app = await createTestApp();
    const cookies = await signUp(app);

    // Create session
    const sessionRes = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookies },
      body: { mode: "fast" },
    });
    const session = (await sessionRes.json()) as { id: string };

    // Upload image with text
    const imageBuffer = createTestPngImage();
    const formData = new FormData();
    formData.append(
      "image",
      new File([imageBuffer], "task.png", { type: "image/png" }),
    );
    formData.append("content", "Реши эту задачу");

    const imgRes = await app.handle(
      new Request(
        `http://localhost/chat/sessions/${session.id}/messages/image`,
        {
          method: "POST",
          headers: { Cookie: cookies },
          body: formData,
        },
      ),
    );

    expect(imgRes.status).toBe(200);
    const result = (await imgRes.json()) as {
      userMessage: { role: string; sourceType: string; content: string };
      assistantMessage: { role: string; content: string };
    };

    expect(result.userMessage.role).toBe("user");
    expect(result.userMessage.sourceType).toBe("image");
    expect(result.assistantMessage.role).toBe("assistant");
    expect(result.assistantMessage.content).toBe(
      "Ответ на задачу из изображения: x = 5",
    );
  });

  it("should save image message in history with sourceType image", async () => {
    mockOpenRouterFetch("Ответ по изображению");
    const app = await createTestApp();
    const cookies = await signUp(app);

    const sessionRes = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookies },
      body: { mode: "fast" },
    });
    const session = (await sessionRes.json()) as { id: string };

    const imageBuffer = createTestPngImage();
    const formData = new FormData();
    formData.append(
      "image",
      new File([imageBuffer], "task.png", { type: "image/png" }),
    );
    formData.append("content", "Что на картинке?");

    await app.handle(
      new Request(
        `http://localhost/chat/sessions/${session.id}/messages/image`,
        {
          method: "POST",
          headers: { Cookie: cookies },
          body: formData,
        },
      ),
    );

    // Verify history
    const historyRes = await request(app, {
      path: `/chat/sessions/${session.id}/messages`,
      headers: { Cookie: cookies },
    });

    const messages = (await historyRes.json()) as Array<{
      role: string;
      sourceType: string;
    }>;
    expect(messages).toHaveLength(2);
    expect(messages[0]!.role).toBe("user");
    expect(messages[0]!.sourceType).toBe("image");
    expect(messages[1]!.role).toBe("assistant");
    expect(messages[1]!.sourceType).toBe("text");
  });

  it("should reject upload without image file", async () => {
    const app = await createTestApp();
    const cookies = await signUp(app);

    const sessionRes = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookies },
      body: { mode: "fast" },
    });
    const session = (await sessionRes.json()) as { id: string };

    // Send form data without image
    const formData = new FormData();
    formData.append("content", "No image here");

    const res = await app.handle(
      new Request(
        `http://localhost/chat/sessions/${session.id}/messages/image`,
        {
          method: "POST",
          headers: { Cookie: cookies },
          body: formData,
        },
      ),
    );

    // Should fail validation (image is required)
    expect(res.status).toBe(422);
  });

  it("should reject unauthenticated image upload", async () => {
    const app = await createTestApp();

    const formData = new FormData();
    formData.append(
      "image",
      new File([createTestPngImage()], "task.png", { type: "image/png" }),
    );

    const res = await app.handle(
      new Request(
        "http://localhost/chat/sessions/fake-id/messages/image",
        {
          method: "POST",
          body: formData,
        },
      ),
    );

    expect(res.status).toBe(401);
  });
});
