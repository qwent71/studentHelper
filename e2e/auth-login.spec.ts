import { test, expect } from "@playwright/test";
import { testUser } from "./helpers/auth";
import { BACKEND_URL } from "./helpers/env";

test.describe("Login flow @smoke", () => {
  test("UI-AUTH-04: login with callbackUrl redirects to that URL", async ({
    page,
    request,
  }) => {
    const user = testUser();

    // Register via separate API context (doesn't share cookies with browser)
    await request.post(`${BACKEND_URL}/api/auth/sign-up/email`, {
      data: user,
    });

    // Navigate to login with callbackUrl
    await page.goto("/auth/login?callbackUrl=/app/chat");

    // Switch to password tab
    await page.getByRole("tab", { name: "Пароль" }).click();

    // Fill and submit
    await page.locator("#email").fill(user.email);
    await page.locator("#password").fill(user.password);
    await page.getByRole("button", { name: "Войти", exact: true }).click();

    // Should redirect to the callbackUrl
    await expect(page).toHaveURL(/\/app\/chat/, { timeout: 10_000 });
  });

  test("UI-AUTH-05: malicious callbackUrl with // falls back to /app", async ({
    page,
    request,
  }) => {
    const user = testUser();

    // Register via separate API context
    await request.post(`${BACKEND_URL}/api/auth/sign-up/email`, {
      data: user,
    });

    // Navigate to login with malicious callbackUrl
    await page.goto("/auth/login?callbackUrl=//evil.com");

    // Switch to password tab
    await page.getByRole("tab", { name: "Пароль" }).click();

    // Fill and submit
    await page.locator("#email").fill(user.email);
    await page.locator("#password").fill(user.password);
    await page.getByRole("button", { name: "Войти", exact: true }).click();

    // Should redirect to /app, not //evil.com
    await expect(page).toHaveURL(/\/app/, { timeout: 10_000 });
    expect(page.url()).not.toContain("evil.com");
  });

  test("UI-AUTH-07: switching tabs clears errors", async ({ page }) => {
    await page.goto("/auth/login");

    // Switch to password tab
    await page.getByRole("tab", { name: "Пароль" }).click();

    // Submit with invalid credentials to trigger error
    await page.locator("#email").fill("nobody@example.com");
    await page.locator("#password").fill("wrongPassword123");
    await page.getByRole("button", { name: "Войти", exact: true }).click();

    // Wait for error to appear
    await expect(
      page.locator("[data-slot='field-error']"),
    ).toBeVisible({ timeout: 10_000 });

    // Switch to magic-link tab — error should clear
    await page.getByRole("tab", { name: "Без пароля" }).click();
    await expect(
      page.locator("[data-slot='field-error']"),
    ).not.toBeVisible();

    // Switch back to password tab — error should still be cleared
    await page.getByRole("tab", { name: "Пароль" }).click();
    await expect(
      page.locator("[data-slot='field-error']"),
    ).not.toBeVisible();
  });
});
