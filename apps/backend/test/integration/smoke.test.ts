import { describe, it, expect } from "bun:test";
import { createTestApp, request } from "../testkit";

describe("Health endpoint", () => {
  it("should return status ok", async () => {
    const app = await createTestApp();
    const res = await request(app, { path: "/health" });

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.timestamp).toBeTypeOf("string");
  });
});

const modules = [
  "account",
  "chat",
  "textbook",
  "uploads",
  "family",
  "rag",
] as const;

describe("Module routes", () => {
  for (const mod of modules) {
    it(`GET /${mod} should return module name`, async () => {
      const app = await createTestApp();
      const res = await request(app, { path: `/${mod}` });

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.module).toBe(mod);
    });
  }
});
