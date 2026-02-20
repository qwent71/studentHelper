import { describe, it, expect } from "bun:test";
import { createTestApp, request, getDb } from "../testkit";
import { verification } from "../../src/db/schema";

function extractCookies(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}

const testUser = {
  name: "Auth Flow User",
  email: "authflow@example.com",
  password: "securePassword123",
};

async function registerAndGetCookies(
  app: { handle: (req: Request) => Response | Promise<Response> },
) {
  const res = await request(app, {
    method: "POST",
    path: "/api/auth/sign-up/email",
    body: testUser,
  });
  return extractCookies(res);
}

describe("Google OAuth", () => {
  it("should return redirect URL for Google sign-in", async () => {
    const app = await createTestApp();

    const res = await request(app, {
      method: "POST",
      path: "/api/auth/sign-in/social",
      body: {
        provider: "google",
        callbackURL: "/app",
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    // Better Auth returns a redirect URL to Google's OAuth authorization page
    expect(data.url).toBeDefined();
    expect(data.url).toContain("accounts.google.com");
    expect(data.url).toContain("client_id=test-google-client-id");
  });

  it("should include redirect_uri pointing to backend callback", async () => {
    const app = await createTestApp();

    const res = await request(app, {
      method: "POST",
      path: "/api/auth/sign-in/social",
      body: {
        provider: "google",
        callbackURL: "/app",
      },
    });

    const data = await res.json();
    const url = new URL(data.url);
    const redirectUri = url.searchParams.get("redirect_uri");
    expect(redirectUri).toContain("/api/auth/callback/google");
  });

  it("should reject unsupported provider", async () => {
    const app = await createTestApp();

    const res = await request(app, {
      method: "POST",
      path: "/api/auth/sign-in/social",
      body: {
        provider: "facebook",
        callbackURL: "/app",
      },
    });

    // Better Auth returns an error for unsupported providers
    expect(res.status).not.toBe(200);
  });
});

describe("Magic Link", () => {
  it("should send magic link and create verification record", async () => {
    const app = await createTestApp();

    // First register the user
    await request(app, {
      method: "POST",
      path: "/api/auth/sign-up/email",
      body: testUser,
    });

    // Request magic link
    const res = await request(app, {
      method: "POST",
      path: "/api/auth/sign-in/magic-link",
      body: {
        email: testUser.email,
        callbackURL: "/app",
      },
    });

    expect(res.status).toBe(200);

    // Verify that a verification record was created in the database
    const db = getDb();
    const verifications = await db.select().from(verification);
    expect(verifications.length).toBeGreaterThan(0);
  });

  it("should work for unregistered email (creates new user)", async () => {
    const app = await createTestApp();

    // Request magic link for an unregistered email
    const res = await request(app, {
      method: "POST",
      path: "/api/auth/sign-in/magic-link",
      body: {
        email: "newuser@example.com",
        callbackURL: "/app",
      },
    });

    expect(res.status).toBe(200);
  });
});

describe("Protected endpoints without session", () => {
  it("should return 401 for chat sessions without cookie", async () => {
    const app = await createTestApp();

    const res = await request(app, {
      method: "POST",
      path: "/chat/sessions",
      body: { mode: "fast" },
    });

    expect(res.status).toBe(401);
  });

  it("should return 401 for template list without cookie", async () => {
    const app = await createTestApp();

    const res = await request(app, {
      path: "/templates",
    });

    expect(res.status).toBe(401);
  });

  it("should return 401 for centrifugo token without cookie", async () => {
    const app = await createTestApp();

    const res = await request(app, {
      path: "/centrifugo/token",
    });

    expect(res.status).toBe(401);
  });

  it("should allow access to protected endpoint with valid session", async () => {
    const app = await createTestApp();
    const cookies = await registerAndGetCookies(app);

    const res = await request(app, {
      path: "/centrifugo/token",
      headers: { Cookie: cookies },
    });

    expect(res.status).toBe(200);
  });

  it("should reject expired/invalid cookie", async () => {
    const app = await createTestApp();

    const res = await request(app, {
      path: "/centrifugo/token",
      headers: { Cookie: "sh.session_token=invalid-token-value" },
    });

    expect(res.status).toBe(401);
  });
});

describe("Session lifecycle", () => {
  it("should invalidate session after sign-out", async () => {
    const app = await createTestApp();
    const cookies = await registerAndGetCookies(app);

    // Verify session is valid
    const before = await request(app, {
      path: "/centrifugo/token",
      headers: { Cookie: cookies },
    });
    expect(before.status).toBe(200);

    // Sign out
    await request(app, {
      method: "POST",
      path: "/api/auth/sign-out",
      headers: { Cookie: cookies },
    });

    // Verify session is no longer valid
    const after = await request(app, {
      path: "/centrifugo/token",
      headers: { Cookie: cookies },
    });
    expect(after.status).toBe(401);
  });

  it("should return user data in get-session with valid cookie", async () => {
    const app = await createTestApp();
    const cookies = await registerAndGetCookies(app);

    const res = await request(app, {
      path: "/api/auth/get-session",
      headers: { Cookie: cookies },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testUser.email);
    expect(data.session).toBeDefined();
  });

  it("should return null session without cookie", async () => {
    const app = await createTestApp();

    const res = await request(app, {
      path: "/api/auth/get-session",
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data === null || data?.user == null).toBe(true);
  });
});
