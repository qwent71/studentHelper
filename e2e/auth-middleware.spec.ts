import { test, expect } from "@playwright/test";
import { registerUser, testUser } from "./helpers/auth";
import { resetTestData, closeConnection } from "./helpers/db";

test.beforeEach(async () => {
  await resetTestData();
});

test.afterAll(async () => {
  await closeConnection();
});

test.describe("Middleware redirects", () => {
  test("UI-AUTH-01: unauthenticated user visiting /app is redirected to login", async ({
    page,
  }) => {
    await page.goto("/app");
    await expect(page).toHaveURL(/\/auth\/login\?callbackUrl=%2Fapp/);
  });

  test("UI-AUTH-02: unauthenticated user visiting /admin is redirected to login", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/auth\/login\?callbackUrl=%2Fadmin/);
  });

  test("UI-AUTH-03: authenticated user visiting /auth/login is redirected to /app", async ({
    page,
    request,
  }) => {
    const user = testUser();
    const cookies = await registerUser(request, user);

    // Set cookies in browser context
    const cookiePairs = cookies.split("; ").map((c) => {
      const [name, value] = c.split("=");
      return { name, value, url: "http://localhost:3000" };
    });
    await page.context().addCookies(cookiePairs);

    await page.goto("/auth/login");
    await expect(page).toHaveURL(/\/app/);
  });

  test("UI-AUTH-06: login without callbackUrl redirects to /app", async ({
    page,
    request,
  }) => {
    const user = testUser();

    // Register via separate API context (doesn't share cookies with browser)
    await request.post("http://localhost:3001/api/auth/sign-up/email", {
      data: user,
    });

    // Navigate to login page (no callbackUrl)
    await page.goto("/auth/login");

    // Switch to password tab
    await page.getByRole("tab", { name: "Пароль" }).click();

    // Fill and submit
    await page.locator("#email").fill(user.email);
    await page.locator("#password").fill(user.password);
    await page.getByRole("button", { name: "Войти", exact: true }).click();

    await expect(page).toHaveURL(/\/app/, { timeout: 10_000 });
  });
});
