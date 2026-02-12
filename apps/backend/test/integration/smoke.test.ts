import { describe, it, expect } from "bun:test";
import { createTestApp, request } from "../testkit";

describe("Integration test environment", () => {
  it("should handle a request through the app", async () => {
    const app = await createTestApp();
    const res = await request(app, { path: "/health" });

    expect(res.status).toBe(200);
  });
});
