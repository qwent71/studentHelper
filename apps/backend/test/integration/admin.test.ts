import { describe, it, expect } from "bun:test";
import { eq } from "drizzle-orm";
import { createTestApp, request, getDb } from "../testkit";
import { user } from "../../src/db/schema";

function extractCookies(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}

const adminUser = {
  name: "Admin User",
  email: "admin@example.com",
  password: "securePassword123",
};

const regularUser = {
  name: "Regular User",
  email: "regular@example.com",
  password: "securePassword123",
};

describe("Admin endpoint protection", () => {
  it("should reject unauthenticated request with 401", async () => {
    const app = await createTestApp();

    const res = await request(app, {
      path: "/admin",
    });

    expect(res.status).toBe(401);
  });

  it("should reject regular user with 403", async () => {
    const app = await createTestApp();

    // Register regular user
    const signUpRes = await request(app, {
      method: "POST",
      path: "/api/auth/sign-up/email",
      body: regularUser,
    });

    const cookies = extractCookies(signUpRes);

    // Try to access admin endpoint
    const res = await request(app, {
      path: "/admin",
      headers: { Cookie: cookies },
    });

    expect(res.status).toBe(403);
  });

  it("should allow admin user with 200", async () => {
    const app = await createTestApp();
    const db = getDb();

    // Register user
    const signUpRes = await request(app, {
      method: "POST",
      path: "/api/auth/sign-up/email",
      body: adminUser,
    });

    const signUpData = await signUpRes.json();
    const userId = signUpData.user.id;

    // Promote to admin directly in DB
    await db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.id, userId));

    // Login again to get fresh session with updated role
    const loginRes = await request(app, {
      method: "POST",
      path: "/api/auth/sign-in/email",
      body: { email: adminUser.email, password: adminUser.password },
    });

    const cookies = extractCookies(loginRes);

    // Access admin endpoint
    const res = await request(app, {
      path: "/admin",
      headers: { Cookie: cookies },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.module).toBe("admin");
    expect(data.userId).toBe(userId);
  });
});
