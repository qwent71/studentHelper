import type { APIRequestContext } from "@playwright/test";

const BACKEND_URL = "http://localhost:3001";

interface UserCredentials {
  name: string;
  email: string;
  password: string;
}

export function uniqueEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@e2e.test`;
}

export function testUser(overrides?: Partial<UserCredentials>): UserCredentials {
  return {
    name: "E2E Test User",
    email: uniqueEmail(),
    password: "securePassword123",
    ...overrides,
  };
}

export async function registerUser(
  request: APIRequestContext,
  user: UserCredentials,
): Promise<string> {
  const res = await request.post(`${BACKEND_URL}/api/auth/sign-up/email`, {
    data: user,
  });

  if (!res.ok()) {
    throw new Error(`Registration failed: ${res.status()} ${await res.text()}`);
  }

  const cookies = res
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie")
    .map((h) => h.value.split(";")[0])
    .join("; ");

  return cookies;
}

export async function loginUser(
  request: APIRequestContext,
  { email, password }: Pick<UserCredentials, "email" | "password">,
): Promise<string> {
  const res = await request.post(`${BACKEND_URL}/api/auth/sign-in/email`, {
    data: { email, password },
  });

  if (!res.ok()) {
    throw new Error(`Login failed: ${res.status()} ${await res.text()}`);
  }

  const cookies = res
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie")
    .map((h) => h.value.split(";")[0])
    .join("; ");

  return cookies;
}
