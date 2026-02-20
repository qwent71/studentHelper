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
  name: "Template Injection User",
  email: "template-inject@example.com",
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
 * Mock OpenRouter and capture the request body to verify system prompt content.
 */
function mockOpenRouterAndCapture(responseContent = "Ответ AI") {
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
          choices: [{ message: { content: responseContent } }],
          model: "test-model",
          usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return originalFetch(input, init);
  };

  return () => capturedBody as { messages: Array<{ role: string; content: string }> } | undefined;
}

describe("Template injection — default template applied automatically", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should use default system prompt when user has no templates", async () => {
    const getCaptured = mockOpenRouterAndCapture();
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

    // Send message (no templates exist)
    await request(app, {
      method: "POST",
      path: `/chat/sessions/${session.id}/messages`,
      headers: { Cookie: cookies },
      body: { content: "Реши x + 1 = 3" },
    });

    const captured = getCaptured();
    expect(captured).toBeDefined();
    const systemMsg = captured!.messages[0]!;
    expect(systemMsg.role).toBe("system");
    // Should contain the default prompt (no template)
    expect(systemMsg.content).toContain("StudentHelper");
    expect(systemMsg.content).toContain("русском языке");
    // Should NOT have mode-specific instructions (no template = old-style prompt)
    expect(systemMsg.content).not.toContain("Режим:");
  });

  it("should inject default template into system prompt automatically", async () => {
    const getCaptured = mockOpenRouterAndCapture();
    const app = await createTestApp();
    const cookies = await signUp(app);

    // Create a template with friendly tone, short responses, isDefault=true
    await request(app, {
      method: "POST",
      path: "/templates",
      headers: { Cookie: cookies },
      body: {
        name: "Дружелюбный краткий",
        tone: "friendly",
        knowledgeLevel: "basic",
        outputFormat: "concise",
        outputLanguage: "ru",
        responseLength: "short",
        isDefault: true,
      },
    });

    // Create chat session
    const sessionRes = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookies },
      body: { mode: "fast" },
    });
    const session = (await sessionRes.json()) as { id: string };

    // Send message — default template should be applied automatically
    await request(app, {
      method: "POST",
      path: `/chat/sessions/${session.id}/messages`,
      headers: { Cookie: cookies },
      body: { content: "Реши x + 1 = 3" },
    });

    const captured = getCaptured();
    expect(captured).toBeDefined();
    const systemMsg = captured!.messages[0]!;
    expect(systemMsg.role).toBe("system");
    // Verify template fields are injected
    expect(systemMsg.content).toContain("дружелюбный");
    expect(systemMsg.content).toContain("простым языком");
    expect(systemMsg.content).toContain("краткие ответы");
    expect(systemMsg.content).toContain("короткими");
    expect(systemMsg.content).toContain("русском языке");
    expect(systemMsg.content).toContain("быстрый ответ");
  });

  it("should use learning mode instruction when session is learning mode", async () => {
    const getCaptured = mockOpenRouterAndCapture();
    const app = await createTestApp();
    const cookies = await signUp(app);

    // Create default template
    await request(app, {
      method: "POST",
      path: "/templates",
      headers: { Cookie: cookies },
      body: {
        name: "Обучающий",
        tone: "encouraging",
        knowledgeLevel: "intermediate",
        outputFormat: "step-by-step",
        outputLanguage: "ru",
        responseLength: "long",
        isDefault: true,
      },
    });

    // Create learning session
    const sessionRes = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookies },
      body: { mode: "learning" },
    });
    const session = (await sessionRes.json()) as { id: string };

    await request(app, {
      method: "POST",
      path: `/chat/sessions/${session.id}/messages`,
      headers: { Cookie: cookies },
      body: { content: "Как решать квадратные уравнения?" },
    });

    const captured = getCaptured();
    expect(captured).toBeDefined();
    const systemMsg = captured!.messages[0]!;
    // Learning mode instruction
    expect(systemMsg.content).toContain("обучение");
    expect(systemMsg.content).toContain("понять, как решать");
    // Template-specific
    expect(systemMsg.content).toContain("мотивирующий");
    expect(systemMsg.content).toContain("умеренную сложность");
    expect(systemMsg.content).toContain("пошаговые решения");
    expect(systemMsg.content).toContain("подробные");
  });

  it("should allow explicit templateId to override default template", async () => {
    const getCaptured = mockOpenRouterAndCapture();
    const app = await createTestApp();
    const cookies = await signUp(app);

    // Create default template (friendly)
    await request(app, {
      method: "POST",
      path: "/templates",
      headers: { Cookie: cookies },
      body: {
        name: "Default Friendly",
        tone: "friendly",
        knowledgeLevel: "basic",
        outputFormat: "full",
        outputLanguage: "ru",
        responseLength: "medium",
        isDefault: true,
      },
    });

    // Create non-default template (formal)
    const formalRes = await request(app, {
      method: "POST",
      path: "/templates",
      headers: { Cookie: cookies },
      body: {
        name: "Formal Override",
        tone: "formal",
        knowledgeLevel: "advanced",
        outputFormat: "concise",
        outputLanguage: "en",
        responseLength: "short",
      },
    });
    const formalTemplate = (await formalRes.json()) as { id: string };

    // Create session
    const sessionRes = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookies },
      body: { mode: "fast" },
    });
    const session = (await sessionRes.json()) as { id: string };

    // Send message with explicit templateId
    await request(app, {
      method: "POST",
      path: `/chat/sessions/${session.id}/messages`,
      headers: { Cookie: cookies },
      body: { content: "Solve x + 1 = 3", templateId: formalTemplate.id },
    });

    const captured = getCaptured();
    expect(captured).toBeDefined();
    const systemMsg = captured!.messages[0]!;
    // Should use the formal template, not the default friendly one
    expect(systemMsg.content).toContain("формальный");
    expect(systemMsg.content).toContain("продвинутую терминологию");
    expect(systemMsg.content).toContain("краткие ответы");
    expect(systemMsg.content).toContain("Отвечай на языке: en.");
    // Should NOT contain friendly tone
    expect(systemMsg.content).not.toContain("дружелюбный");
  });

  it("should ignore templateId that belongs to another user", async () => {
    const getCaptured = mockOpenRouterAndCapture();
    const app = await createTestApp();
    const cookies = await signUp(app);

    // Create second user
    const user2Res = await request(app, {
      method: "POST",
      path: "/api/auth/sign-up/email",
      body: {
        name: "Other User",
        email: "other-template@example.com",
        password: "securePassword123",
      },
    });
    const cookies2 = extractCookies(user2Res);

    // Create template for user2
    const otherTemplateRes = await request(app, {
      method: "POST",
      path: "/templates",
      headers: { Cookie: cookies2 },
      body: {
        name: "Other User Template",
        tone: "formal",
        knowledgeLevel: "advanced",
        outputFormat: "concise",
        outputLanguage: "en",
        responseLength: "short",
      },
    });
    const otherTemplate = (await otherTemplateRes.json()) as { id: string };

    // User1 creates session and tries to use user2's template
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
      body: { content: "Test", templateId: otherTemplate.id },
    });

    const captured = getCaptured();
    expect(captured).toBeDefined();
    const systemMsg = captured!.messages[0]!;
    // Should fall back to default prompt since other user's template is rejected
    expect(systemMsg.content).not.toContain("формальный");
    expect(systemMsg.content).not.toContain("Отвечай на языке: en.");
  });

  it("should use safe fallback when no template and no default exists", async () => {
    const getCaptured = mockOpenRouterAndCapture();
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
      body: { content: "Вопрос" },
    });

    expect(msgRes.status).toBe(200);
    const captured = getCaptured();
    const systemMsg = captured!.messages[0]!;
    // Safe default system prompt
    expect(systemMsg.content).toContain("StudentHelper");
    expect(systemMsg.content).toContain("помощник для школьников");
    expect(systemMsg.content).toContain("Решай задачи пошагово");
  });

  it("should switch to new default template when default is changed between messages", async () => {
    const capturedBodies: Array<{ messages: Array<{ role: string; content: string }> }> = [];
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (url.includes("openrouter.ai") || url.includes("chat/completions")) {
        capturedBodies.push(JSON.parse(init?.body as string));
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: "OK" } }],
            model: "test-model",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return originalFetch(input, init);
    };

    const app = await createTestApp();
    const cookies = await signUp(app);

    // Create template A (friendly) as default
    const tmplARes = await request(app, {
      method: "POST",
      path: "/templates",
      headers: { Cookie: cookies },
      body: {
        name: "A Friendly",
        tone: "friendly",
        knowledgeLevel: "basic",
        outputFormat: "full",
        outputLanguage: "ru",
        responseLength: "medium",
        isDefault: true,
      },
    });
    (await tmplARes.json()) as { id: string };

    // Create template B (formal)
    const tmplBRes = await request(app, {
      method: "POST",
      path: "/templates",
      headers: { Cookie: cookies },
      body: {
        name: "B Formal",
        tone: "formal",
        knowledgeLevel: "advanced",
        outputFormat: "concise",
        outputLanguage: "ru",
        responseLength: "short",
      },
    });
    const tmplB = (await tmplBRes.json()) as { id: string };

    // Create session
    const sessionRes = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookies },
      body: { mode: "fast" },
    });
    const session = (await sessionRes.json()) as { id: string };

    // First message — uses template A (friendly)
    await request(app, {
      method: "POST",
      path: `/chat/sessions/${session.id}/messages`,
      headers: { Cookie: cookies },
      body: { content: "Первый вопрос" },
    });

    // Switch default to template B
    await request(app, {
      method: "POST",
      path: `/templates/${tmplB.id}/default`,
      headers: { Cookie: cookies },
    });

    // Second message — should use template B (formal)
    await request(app, {
      method: "POST",
      path: `/chat/sessions/${session.id}/messages`,
      headers: { Cookie: cookies },
      body: { content: "Второй вопрос" },
    });

    expect(capturedBodies).toHaveLength(2);
    // First call: friendly template
    expect(capturedBodies[0]!.messages[0]!.content).toContain("дружелюбный");
    // Second call: formal template
    expect(capturedBodies[1]!.messages[0]!.content).toContain("формальный");
  });
});
