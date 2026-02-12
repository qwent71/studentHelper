import { describe, it, expect } from "bun:test";
import { createTestApp, request } from "../testkit";

function extractCookies(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}

const testUser = {
  name: "Test User",
  email: "test@example.com",
  password: "securePassword123",
};

describe("Registration", () => {
  it("should sign up successfully and return user and cookies", async () => {
    const app = await createTestApp();
    const res = await request(app, {
      method: "POST",
      path: "/api/auth/sign-up/email",
      body: testUser,
    });

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testUser.email);
    expect(data.user.name).toBe(testUser.name);

    const cookies = res.headers.getSetCookie();
    expect(cookies.length).toBeGreaterThan(0);
  });

  it("should reject duplicate email", async () => {
    const app = await createTestApp();

    // First sign-up
    await request(app, {
      method: "POST",
      path: "/api/auth/sign-up/email",
      body: testUser,
    });

    // Duplicate sign-up
    const res = await request(app, {
      method: "POST",
      path: "/api/auth/sign-up/email",
      body: testUser,
    });

    expect(res.status).not.toBe(200);
  });

  it("should reject missing required fields", async () => {
    const app = await createTestApp();

    // Missing email
    const res1 = await request(app, {
      method: "POST",
      path: "/api/auth/sign-up/email",
      body: { name: "User", password: "validPass123" },
    });
    expect(res1.status).not.toBe(200);

    // Missing password
    const res2 = await request(app, {
      method: "POST",
      path: "/api/auth/sign-up/email",
      body: { name: "User", email: "a@b.com" },
    });
    expect(res2.status).not.toBe(200);
  });
});

describe("Login", () => {
  it("should sign in successfully and return cookies", async () => {
    const app = await createTestApp();

    // Register first
    await request(app, {
      method: "POST",
      path: "/api/auth/sign-up/email",
      body: testUser,
    });

    // Sign in
    const res = await request(app, {
      method: "POST",
      path: "/api/auth/sign-in/email",
      body: { email: testUser.email, password: testUser.password },
    });

    expect(res.status).toBe(200);

    const cookies = res.headers.getSetCookie();
    expect(cookies.length).toBeGreaterThan(0);
  });

  it("should access protected endpoint with session cookie", async () => {
    const app = await createTestApp();

    // Register
    const signUpRes = await request(app, {
      method: "POST",
      path: "/api/auth/sign-up/email",
      body: testUser,
    });

    const cookies = extractCookies(signUpRes);

    // Access protected route
    const res = await request(app, {
      path: "/centrifugo/token",
      headers: { Cookie: cookies },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toBeTypeOf("string");
    expect(data.token.length).toBeGreaterThan(0);
  });
});

describe("Negative login scenarios", () => {
  it("should reject wrong password", async () => {
    const app = await createTestApp();

    // Register
    await request(app, {
      method: "POST",
      path: "/api/auth/sign-up/email",
      body: testUser,
    });

    // Wrong password
    const res = await request(app, {
      method: "POST",
      path: "/api/auth/sign-in/email",
      body: { email: testUser.email, password: "wrongPassword" },
    });

    expect(res.status).not.toBe(200);
  });

  it("should reject non-existent email", async () => {
    const app = await createTestApp();

    const res = await request(app, {
      method: "POST",
      path: "/api/auth/sign-in/email",
      body: { email: "nobody@example.com", password: "somePassword123" },
    });

    expect(res.status).not.toBe(200);
  });
});

describe("Session / Logout", () => {
  it("should invalidate session on sign-out", async () => {
    const app = await createTestApp();

    // Register
    const signUpRes = await request(app, {
      method: "POST",
      path: "/api/auth/sign-up/email",
      body: testUser,
    });

    const cookies = extractCookies(signUpRes);

    // Sign out
    await request(app, {
      method: "POST",
      path: "/api/auth/sign-out",
      headers: { Cookie: cookies },
    });

    // Protected route should now reject
    const res = await request(app, {
      path: "/centrifugo/token",
      headers: { Cookie: cookies },
    });

    expect(res.status).toBe(401);
  });
});
