import { test, expect } from "@playwright/test";

test.describe("Core frontend flows @regression", () => {
  test("UI-CORE-01: home page renders hero and theme menu", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Your AI-powered study companion" }),
    ).toBeVisible();
    await expect(page.getByText("Student Helper")).toBeVisible();

    await page.getByRole("button", { name: "Toggle theme" }).click();
    await expect(page.getByRole("menuitem", { name: "Light" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Dark" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "System" })).toBeVisible();
  });

  test("UI-CORE-02: magic link sent page shows email and resend cooldown", async ({
    page,
  }) => {
    await page.goto("/auth/magic-link-sent?email=test@example.com");

    await expect(
      page.getByRole("heading", { name: "Проверьте почту" }),
    ).toBeVisible();
    await expect(page.getByText("test@example.com")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Отправить повторно/ }),
    ).toBeDisabled();
  });
});
