import { describe, it, expect, afterEach } from "bun:test";
import { createTestApp, request, getDb } from "../testkit";
import { safetyEvent } from "../../src/db/schema";
import { eq } from "drizzle-orm";

const originalFetch = globalThis.fetch;

function extractCookies(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}

const userA = {
  name: "User A",
  email: "user-a-isolation@example.com",
  password: "securePassword123",
};

const userB = {
  name: "User B",
  email: "user-b-isolation@example.com",
  password: "securePassword123",
};

async function signUpBoth(app: { handle: (req: Request) => Response | Promise<Response> }) {
  const resA = await request(app, {
    method: "POST",
    path: "/api/auth/sign-up/email",
    body: userA,
  });
  const cookiesA = extractCookies(resA);

  const resB = await request(app, {
    method: "POST",
    path: "/api/auth/sign-up/email",
    body: userB,
  });
  const cookiesB = extractCookies(resB);

  return { cookiesA, cookiesB };
}

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
          usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return originalFetch(input, init);
  };
}

// ── Test Step 1: Create data for two different users ──

describe("Data isolation — chat sessions", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("user B cannot get user A's chat session (returns 404)", async () => {
    const app = await createTestApp();
    const { cookiesA, cookiesB } = await signUpBoth(app);

    // User A creates a session
    const sessionRes = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookiesA },
      body: { mode: "fast" },
    });
    const session = (await sessionRes.json()) as { id: string };

    // User B tries to access user A's session
    const res = await request(app, {
      path: `/chat/sessions/${session.id}`,
      headers: { Cookie: cookiesB },
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: "Session not found" });
  });

  it("user B cannot update user A's chat session", async () => {
    const app = await createTestApp();
    const { cookiesA, cookiesB } = await signUpBoth(app);

    const sessionRes = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookiesA },
      body: { mode: "fast" },
    });
    const session = (await sessionRes.json()) as { id: string };

    // User B tries to update user A's session
    const res = await request(app, {
      method: "PATCH",
      path: `/chat/sessions/${session.id}`,
      headers: { Cookie: cookiesB },
      body: { title: "Hacked title" },
    });

    expect(res.status).toBe(404);

    // Verify original title is unchanged
    const getRes = await request(app, {
      path: `/chat/sessions/${session.id}`,
      headers: { Cookie: cookiesA },
    });
    const original = (await getRes.json()) as { title: string };
    expect(original.title).toBe("Новый чат");
  });

  it("user B cannot send messages to user A's chat session", async () => {
    mockOpenRouterFetch();
    const app = await createTestApp();
    const { cookiesA, cookiesB } = await signUpBoth(app);

    const sessionRes = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookiesA },
      body: { mode: "fast" },
    });
    const session = (await sessionRes.json()) as { id: string };

    // User B tries to send a message to user A's session
    const res = await request(app, {
      method: "POST",
      path: `/chat/sessions/${session.id}/messages`,
      headers: { Cookie: cookiesB },
      body: { content: "Injected message" },
    });

    expect(res.status).toBe(404);
  });

  it("user B cannot read user A's message history", async () => {
    mockOpenRouterFetch();
    const app = await createTestApp();
    const { cookiesA, cookiesB } = await signUpBoth(app);

    const sessionRes = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookiesA },
      body: { mode: "fast" },
    });
    const session = (await sessionRes.json()) as { id: string };

    // User A sends a message
    await request(app, {
      method: "POST",
      path: `/chat/sessions/${session.id}/messages`,
      headers: { Cookie: cookiesA },
      body: { content: "Secret question" },
    });

    // User B tries to read user A's messages
    const res = await request(app, {
      path: `/chat/sessions/${session.id}/messages`,
      headers: { Cookie: cookiesB },
    });

    expect(res.status).toBe(404);
  });

  it("user B's session list does not contain user A's sessions", async () => {
    const app = await createTestApp();
    const { cookiesA, cookiesB } = await signUpBoth(app);

    // User A creates sessions
    await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookiesA },
      body: { mode: "fast" },
    });
    await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookiesA },
      body: { mode: "learning" },
    });

    // User B creates one session
    await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookiesB },
      body: { mode: "fast" },
    });

    // User B's list should only contain their own session
    const listRes = await request(app, {
      path: "/chat/sessions",
      headers: { Cookie: cookiesB },
    });
    const sessions = (await listRes.json()) as Array<{ id: string }>;
    expect(sessions).toHaveLength(1);
  });
});

// ── Test Step 2: Template isolation ──

describe("Data isolation — templates", () => {
  it("user B cannot get user A's template (returns 404)", async () => {
    const app = await createTestApp();
    const { cookiesA, cookiesB } = await signUpBoth(app);

    // User A creates a template
    const tplRes = await request(app, {
      method: "POST",
      path: "/templates",
      headers: { Cookie: cookiesA },
      body: { name: "User A's template" },
    });
    const template = (await tplRes.json()) as { id: string };

    // User B tries to get user A's template
    const res = await request(app, {
      path: `/templates/${template.id}`,
      headers: { Cookie: cookiesB },
    });

    expect(res.status).toBe(404);
  });

  it("user B cannot update user A's template", async () => {
    const app = await createTestApp();
    const { cookiesA, cookiesB } = await signUpBoth(app);

    const tplRes = await request(app, {
      method: "POST",
      path: "/templates",
      headers: { Cookie: cookiesA },
      body: { name: "Original name" },
    });
    const template = (await tplRes.json()) as { id: string };

    // User B tries to update
    const res = await request(app, {
      method: "PATCH",
      path: `/templates/${template.id}`,
      headers: { Cookie: cookiesB },
      body: { name: "Hacked name" },
    });

    expect(res.status).toBe(404);

    // Verify original name is unchanged
    const getRes = await request(app, {
      path: `/templates/${template.id}`,
      headers: { Cookie: cookiesA },
    });
    const original = (await getRes.json()) as { name: string };
    expect(original.name).toBe("Original name");
  });

  it("user B cannot delete user A's template", async () => {
    const app = await createTestApp();
    const { cookiesA, cookiesB } = await signUpBoth(app);

    const tplRes = await request(app, {
      method: "POST",
      path: "/templates",
      headers: { Cookie: cookiesA },
      body: { name: "Protected template" },
    });
    const template = (await tplRes.json()) as { id: string };

    // User B tries to delete
    const res = await request(app, {
      method: "DELETE",
      path: `/templates/${template.id}`,
      headers: { Cookie: cookiesB },
    });

    expect(res.status).toBe(404);

    // Verify template still exists
    const getRes = await request(app, {
      path: `/templates/${template.id}`,
      headers: { Cookie: cookiesA },
    });
    expect(getRes.status).toBe(200);
  });

  it("user B cannot set user A's template as default", async () => {
    const app = await createTestApp();
    const { cookiesA, cookiesB } = await signUpBoth(app);

    const tplRes = await request(app, {
      method: "POST",
      path: "/templates",
      headers: { Cookie: cookiesA },
      body: { name: "User A default" },
    });
    const template = (await tplRes.json()) as { id: string };

    // User B tries to set as default
    const res = await request(app, {
      method: "POST",
      path: `/templates/${template.id}/default`,
      headers: { Cookie: cookiesB },
    });

    expect(res.status).toBe(404);
  });

  it("user B's template list does not contain user A's templates", async () => {
    const app = await createTestApp();
    const { cookiesA, cookiesB } = await signUpBoth(app);

    // User A creates templates
    await request(app, {
      method: "POST",
      path: "/templates",
      headers: { Cookie: cookiesA },
      body: { name: "Template A1" },
    });
    await request(app, {
      method: "POST",
      path: "/templates",
      headers: { Cookie: cookiesA },
      body: { name: "Template A2" },
    });

    // User B's list should be empty
    const listRes = await request(app, {
      path: "/templates",
      headers: { Cookie: cookiesB },
    });
    const templates = (await listRes.json()) as Array<{ id: string }>;
    expect(templates).toHaveLength(0);
  });
});

// ── Test Step 3: Access violations are logged as security events ──

describe("Data isolation — security event logging", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("logs access_violation when user B tries to access user A's chat session", async () => {
    const app = await createTestApp();
    const { cookiesA, cookiesB } = await signUpBoth(app);

    // User A creates a session
    const sessionRes = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookiesA },
      body: { mode: "fast" },
    });
    const session = (await sessionRes.json()) as { id: string };

    // User B tries to access it
    await request(app, {
      path: `/chat/sessions/${session.id}`,
      headers: { Cookie: cookiesB },
    });

    // Check safety_event table for access_violation
    const db = getDb();
    const events = await db
      .select()
      .from(safetyEvent)
      .where(eq(safetyEvent.eventType, "access_violation"));

    expect(events.length).toBeGreaterThanOrEqual(1);
    const event = events[0]!;
    expect(event.severity).toBe("medium");
    expect(event.details).toBeDefined();
    const details = JSON.parse(event.details!);
    expect(details.resourceType).toBe("chat_session");
    expect(details.resourceId).toBe(session.id);
  });

  it("logs access_violation when user B tries to access user A's template", async () => {
    const app = await createTestApp();
    const { cookiesA, cookiesB } = await signUpBoth(app);

    // User A creates a template
    const tplRes = await request(app, {
      method: "POST",
      path: "/templates",
      headers: { Cookie: cookiesA },
      body: { name: "Protected template" },
    });
    const template = (await tplRes.json()) as { id: string };

    // User B tries to access it
    await request(app, {
      path: `/templates/${template.id}`,
      headers: { Cookie: cookiesB },
    });

    // Check safety_event table
    const db = getDb();
    const events = await db
      .select()
      .from(safetyEvent)
      .where(eq(safetyEvent.eventType, "access_violation"));

    expect(events.length).toBeGreaterThanOrEqual(1);
    const event = events.find((e) => {
      const d = JSON.parse(e.details!);
      return d.resourceType === "template_preset";
    });
    expect(event).toBeDefined();
    expect(event!.severity).toBe("medium");
    const details = JSON.parse(event!.details!);
    expect(details.resourceId).toBe(template.id);
  });

  it("does not log access_violation for non-existent resources", async () => {
    const app = await createTestApp();
    const { cookiesB } = await signUpBoth(app);

    // User B tries to access a non-existent session
    await request(app, {
      path: "/chat/sessions/00000000-0000-0000-0000-000000000000",
      headers: { Cookie: cookiesB },
    });

    // No access_violation should be logged for genuinely missing resources
    const db = getDb();
    const events = await db
      .select()
      .from(safetyEvent)
      .where(eq(safetyEvent.eventType, "access_violation"));

    expect(events).toHaveLength(0);
  });

  it("logs multiple access_violation events for repeated attempts", async () => {
    const app = await createTestApp();
    const { cookiesA, cookiesB } = await signUpBoth(app);

    const sessionRes = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      headers: { Cookie: cookiesA },
      body: { mode: "fast" },
    });
    const session = (await sessionRes.json()) as { id: string };

    // User B makes multiple unauthorized access attempts
    await request(app, {
      path: `/chat/sessions/${session.id}`,
      headers: { Cookie: cookiesB },
    });
    await request(app, {
      path: `/chat/sessions/${session.id}/messages`,
      headers: { Cookie: cookiesB },
    });
    await request(app, {
      method: "PATCH",
      path: `/chat/sessions/${session.id}`,
      headers: { Cookie: cookiesB },
      body: { title: "Hacked" },
    });

    // Should have 3 access_violation events
    const db = getDb();
    const events = await db
      .select()
      .from(safetyEvent)
      .where(eq(safetyEvent.eventType, "access_violation"));

    expect(events).toHaveLength(3);
  });
});
