import { describe, it, expect } from "bun:test";

describe("Unit test environment", () => {
  it("should run a basic assertion", () => {
    expect(1 + 1).toBe(2);
  });
});
