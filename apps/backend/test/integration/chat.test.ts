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
  email: "chatuser@example.com",
  password: "securePassword123",
};

const testUser2 = {
  name: "Other User",
  email: "other@example.com",
  password: "securePassword123",
};

async function signUpAndGetCookies(
  app: { handle: (req: Request) => Response | Promise<Response> },
  user = testUser,
) {
  const res = await request(app, {
    method: "POST",
    path: "/api/auth/sign-up/email",
    body: user,
  });
  return extractCookies(res);
}

describe("Chat CRUD", () => {
  it("should create a chat with default title", async () => {
    const app = await createTestApp();
    const cookies = await signUpAndGetCookies(app);

    const res = await request(app, {
      method: "POST",
      path: "/chat",
      headers: { Cookie: cookies },
      body: {},
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBeTypeOf("string");
    expect(data.title).toBe("New Chat");
    expect(data.userId).toBeTypeOf("string");
  });

  it("should create a chat with custom title", async () => {
    const app = await createTestApp();
    const cookies = await signUpAndGetCookies(app);

    const res = await request(app, {
      method: "POST",
      path: "/chat",
      headers: { Cookie: cookies },
      body: { title: "My Study Session" },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.title).toBe("My Study Session");
  });

  it("should list user chats", async () => {
    const app = await createTestApp();
    const cookies = await signUpAndGetCookies(app);

    // Create two chats
    await request(app, {
      method: "POST",
      path: "/chat",
      headers: { Cookie: cookies },
      body: { title: "Chat 1" },
    });
    await request(app, {
      method: "POST",
      path: "/chat",
      headers: { Cookie: cookies },
      body: { title: "Chat 2" },
    });

    const res = await request(app, {
      path: "/chat",
      headers: { Cookie: cookies },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.chats).toBeArray();
    expect(data.chats.length).toBe(2);
  });

  it("should not list chats from other users", async () => {
    const app = await createTestApp();
    const cookies1 = await signUpAndGetCookies(app, testUser);
    const cookies2 = await signUpAndGetCookies(app, testUser2);

    // User 1 creates a chat
    await request(app, {
      method: "POST",
      path: "/chat",
      headers: { Cookie: cookies1 },
      body: { title: "Private Chat" },
    });

    // User 2 should see no chats
    const res = await request(app, {
      path: "/chat",
      headers: { Cookie: cookies2 },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.chats.length).toBe(0);
  });
});

describe("Chat Messages", () => {
  it("should get empty messages for new chat", async () => {
    const app = await createTestApp();
    const cookies = await signUpAndGetCookies(app);

    const chatRes = await request(app, {
      method: "POST",
      path: "/chat",
      headers: { Cookie: cookies },
      body: {},
    });
    const chat = await chatRes.json();

    const res = await request(app, {
      path: `/chat/${chat.id}/messages`,
      headers: { Cookie: cookies },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.messages).toBeArray();
    expect(data.messages.length).toBe(0);
  });

  it("should send a message and return it", async () => {
    const app = await createTestApp();
    const cookies = await signUpAndGetCookies(app);

    const chatRes = await request(app, {
      method: "POST",
      path: "/chat",
      headers: { Cookie: cookies },
      body: {},
    });
    const chat = await chatRes.json();

    const res = await request(app, {
      method: "POST",
      path: `/chat/${chat.id}/messages`,
      headers: { Cookie: cookies },
      body: { content: "Hello, AI!" },
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.message.content).toBe("Hello, AI!");
    expect(data.message.role).toBe("user");
    expect(data.message.chatId).toBe(chat.id);
  });

  it("should retrieve sent messages", async () => {
    const app = await createTestApp();
    const cookies = await signUpAndGetCookies(app);

    const chatRes = await request(app, {
      method: "POST",
      path: "/chat",
      headers: { Cookie: cookies },
      body: {},
    });
    const chat = await chatRes.json();

    await request(app, {
      method: "POST",
      path: `/chat/${chat.id}/messages`,
      headers: { Cookie: cookies },
      body: { content: "First message" },
    });
    await request(app, {
      method: "POST",
      path: `/chat/${chat.id}/messages`,
      headers: { Cookie: cookies },
      body: { content: "Second message" },
    });

    const res = await request(app, {
      path: `/chat/${chat.id}/messages`,
      headers: { Cookie: cookies },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.messages.length).toBe(2);
    expect(data.messages[0].content).toBe("First message");
    expect(data.messages[1].content).toBe("Second message");
  });

  it("should return 404 for messages of non-existent chat", async () => {
    const app = await createTestApp();
    const cookies = await signUpAndGetCookies(app);

    const res = await request(app, {
      path: "/chat/00000000-0000-0000-0000-000000000000/messages",
      headers: { Cookie: cookies },
    });

    expect(res.status).toBe(404);
  });

  it("should return 404 when accessing another user's chat messages", async () => {
    const app = await createTestApp();
    const cookies1 = await signUpAndGetCookies(app, testUser);
    const cookies2 = await signUpAndGetCookies(app, testUser2);

    const chatRes = await request(app, {
      method: "POST",
      path: "/chat",
      headers: { Cookie: cookies1 },
      body: {},
    });
    const chat = await chatRes.json();

    const res = await request(app, {
      path: `/chat/${chat.id}/messages`,
      headers: { Cookie: cookies2 },
    });

    expect(res.status).toBe(404);
  });

  it("should return 404 when sending message to another user's chat", async () => {
    const app = await createTestApp();
    const cookies1 = await signUpAndGetCookies(app, testUser);
    const cookies2 = await signUpAndGetCookies(app, testUser2);

    const chatRes = await request(app, {
      method: "POST",
      path: "/chat",
      headers: { Cookie: cookies1 },
      body: {},
    });
    const chat = await chatRes.json();

    const res = await request(app, {
      method: "POST",
      path: `/chat/${chat.id}/messages`,
      headers: { Cookie: cookies2 },
      body: { content: "Sneaky message" },
    });

    expect(res.status).toBe(404);
  });
});

describe("Chat auth protection", () => {
  it("should reject unauthenticated create chat", async () => {
    const app = await createTestApp();

    const res = await request(app, {
      method: "POST",
      path: "/chat",
      body: {},
    });

    expect(res.status).toBe(401);
  });

  it("should reject unauthenticated list chats", async () => {
    const app = await createTestApp();

    const res = await request(app, {
      path: "/chat",
    });

    expect(res.status).toBe(401);
  });

  it("should reject unauthenticated send message", async () => {
    const app = await createTestApp();

    const res = await request(app, {
      method: "POST",
      path: "/chat/some-id/messages",
      body: { content: "test" },
    });

    expect(res.status).toBe(401);
  });
});

describe("Chat message validation", () => {
  it("should reject empty message content", async () => {
    const app = await createTestApp();
    const cookies = await signUpAndGetCookies(app);

    const chatRes = await request(app, {
      method: "POST",
      path: "/chat",
      headers: { Cookie: cookies },
      body: {},
    });
    const chat = await chatRes.json();

    const res = await request(app, {
      method: "POST",
      path: `/chat/${chat.id}/messages`,
      headers: { Cookie: cookies },
      body: { content: "" },
    });

    expect(res.status).not.toBe(201);
  });
});
