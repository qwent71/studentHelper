import { describe, it, expect } from "bun:test";
import { createTestApp, request } from "../testkit";

function extractCookies(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}

const testUser = {
  name: "Chat Test User",
  email: "chat-test@example.com",
  password: "securePassword123",
};

async function signUp(app: { handle: (req: Request) => Response | Promise<Response> }) {
  const res = await request(app, {
    method: "POST",
    path: "/api/auth/sign-up/email",
    body: testUser,
  });
  return extractCookies(res);
}

// ── Test Step 1: Create a chat session via API ──

describe("Chat Sessions", () => {
  it("should create a session with mode fast", async () => {
    const app = await createTestApp();
    const cookies = await signUp(app);

    const res = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookies },
      body: { mode: "fast" },
    });

    expect(res.status).toBe(200);
    const session = await res.json();
    expect(session.id).toBeTypeOf("string");
    expect(session.mode).toBe("fast");
    expect(session.status).toBe("active");
    expect(session.title).toBe("Новый чат");
  });

  it("should create a session with mode learning and custom title", async () => {
    const app = await createTestApp();
    const cookies = await signUp(app);

    const res = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookies },
      body: { mode: "learning", title: "Алгебра 8 класс" },
    });

    expect(res.status).toBe(200);
    const session = await res.json();
    expect(session.mode).toBe("learning");
    expect(session.title).toBe("Алгебра 8 класс");
  });

  it("should list user sessions", async () => {
    const app = await createTestApp();
    const cookies = await signUp(app);

    // Create two sessions
    await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookies },
      body: { mode: "fast" },
    });
    await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookies },
      body: { mode: "learning", title: "Second" },
    });

    const res = await request(app, {
      path: "/chat/sessions",
      headers: { Cookie: cookies },
    });

    expect(res.status).toBe(200);
    const sessions = await res.json();
    expect(sessions).toBeArrayOfSize(2);
  });

  it("should get a single session by id", async () => {
    const app = await createTestApp();
    const cookies = await signUp(app);

    const createRes = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookies },
      body: { mode: "fast" },
    });
    const created = await createRes.json();

    const res = await request(app, {
      path: `/chat/sessions/${created.id}`,
      headers: { Cookie: cookies },
    });

    expect(res.status).toBe(200);
    const session = await res.json();
    expect(session.id).toBe(created.id);
  });

  it("should reject unauthenticated requests", async () => {
    const app = await createTestApp();

    const res = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      body: { mode: "fast" },
    });

    expect(res.status).toBe(401);
  });
});

// ── Test Step 2: Send message and get response ──

describe("Chat Messages", () => {
  it("should send a user message and receive an assistant response", async () => {
    const app = await createTestApp();
    const cookies = await signUp(app);

    // Create session
    const sessionRes = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookies },
      body: { mode: "fast" },
    });
    const session = await sessionRes.json();

    // Send message
    const msgRes = await request(app, {
      method: "POST",
      path: `/chat/sessions/${session.id}/messages`,
      headers: { Cookie: cookies },
      body: { content: "Реши уравнение x² - 4 = 0" },
    });

    expect(msgRes.status).toBe(200);
    const result = await msgRes.json();

    // User message saved
    expect(result.userMessage).toBeDefined();
    expect(result.userMessage.role).toBe("user");
    expect(result.userMessage.content).toBe("Реши уравнение x² - 4 = 0");
    expect(result.userMessage.sourceType).toBe("text");

    // Assistant response saved
    expect(result.assistantMessage).toBeDefined();
    expect(result.assistantMessage.role).toBe("assistant");
    expect(result.assistantMessage.content).toBeTypeOf("string");
    expect(result.assistantMessage.content.length).toBeGreaterThan(0);
  });

  it("should support image source type", async () => {
    const app = await createTestApp();
    const cookies = await signUp(app);

    const sessionRes = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookies },
      body: { mode: "fast" },
    });
    const session = await sessionRes.json();

    const msgRes = await request(app, {
      method: "POST",
      path: `/chat/sessions/${session.id}/messages`,
      headers: { Cookie: cookies },
      body: { content: "OCR text from image", sourceType: "image" },
    });

    expect(msgRes.status).toBe(200);
    const result = await msgRes.json();
    expect(result.userMessage.sourceType).toBe("image");
  });

  it("should reject messages to non-existent session", async () => {
    const app = await createTestApp();
    const cookies = await signUp(app);

    const res = await request(app, {
      method: "POST",
      path: "/chat/sessions/00000000-0000-0000-0000-000000000000/messages",
      headers: { Cookie: cookies },
      body: { content: "Hello" },
    });

    expect(res.status).toBe(404);
  });
});

// ── Test Step 3: Message history with correct role/order ──

describe("Message History", () => {
  it("should return messages in chronological order with correct roles", async () => {
    const app = await createTestApp();
    const cookies = await signUp(app);

    // Create session
    const sessionRes = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookies },
      body: { mode: "learning" },
    });
    const session = await sessionRes.json();

    // Send first message
    await request(app, {
      method: "POST",
      path: `/chat/sessions/${session.id}/messages`,
      headers: { Cookie: cookies },
      body: { content: "Первый вопрос" },
    });

    // Send second message
    await request(app, {
      method: "POST",
      path: `/chat/sessions/${session.id}/messages`,
      headers: { Cookie: cookies },
      body: { content: "Второй вопрос" },
    });

    // Fetch history
    const historyRes = await request(app, {
      path: `/chat/sessions/${session.id}/messages`,
      headers: { Cookie: cookies },
    });

    expect(historyRes.status).toBe(200);
    const messages = await historyRes.json();

    // 2 user messages + 2 assistant responses = 4 total
    expect(messages).toBeArrayOfSize(4);

    // Check order: user, assistant, user, assistant
    expect(messages[0].role).toBe("user");
    expect(messages[0].content).toBe("Первый вопрос");
    expect(messages[1].role).toBe("assistant");
    expect(messages[2].role).toBe("user");
    expect(messages[2].content).toBe("Второй вопрос");
    expect(messages[3].role).toBe("assistant");

    // Chronological order
    for (let i = 1; i < messages.length; i++) {
      expect(new Date(messages[i].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(messages[i - 1].createdAt).getTime(),
      );
    }
  });

  it("should not return messages from another user's session", async () => {
    const app = await createTestApp();

    // User 1
    const signUp1 = await request(app, {
      method: "POST",
      path: "/api/auth/sign-up/email",
      body: { name: "User1", email: "user1@example.com", password: "securePassword123" },
    });
    const cookies1 = extractCookies(signUp1);

    // User 2
    const signUp2 = await request(app, {
      method: "POST",
      path: "/api/auth/sign-up/email",
      body: { name: "User2", email: "user2@example.com", password: "securePassword123" },
    });
    const cookies2 = extractCookies(signUp2);

    // User 1 creates session
    const sessionRes = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookies1 },
      body: { mode: "fast" },
    });
    const session = await sessionRes.json();

    // User 2 tries to get User 1's session
    const res = await request(app, {
      path: `/chat/sessions/${session.id}`,
      headers: { Cookie: cookies2 },
    });

    expect(res.status).toBe(404);
  });
});
