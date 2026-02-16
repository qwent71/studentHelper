import { test, expect } from "@playwright/test";
import { testUser } from "./helpers/auth";
import { BACKEND_URL } from "./helpers/env";

test.describe("Signup flow @smoke", () => {
  test("should register via UI and redirect to /app", async ({ page }) => {
    const user = testUser();

    await page.goto("/auth/signup");

    await page.locator("#name").fill(user.name);
    await page.locator("#email").fill(user.email);
    await page.locator("#password").fill(user.password);
    await page.getByRole("button", { name: "Зарегистрироваться" }).click();

    await expect(page).toHaveURL(/\/app/, { timeout: 10_000 });
  });

  test("should show error for duplicate email", async ({ page, request }) => {
    const user = testUser();

    // Register first user via separate API context (doesn't share cookies with browser)
    await request.post(`${BACKEND_URL}/api/auth/sign-up/email`, {
      data: user,
    });

    // Try to register same email via UI
    await page.goto("/auth/signup");

    await page.locator("#name").fill("Another User");
    await page.locator("#email").fill(user.email);
    await page.locator("#password").fill("anotherPassword123");
    await page.getByRole("button", { name: "Зарегистрироваться" }).click();

    // Should show error, not redirect
    await expect(
      page.locator("[data-slot='field-error']"),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/auth\/signup/);
  });
});
