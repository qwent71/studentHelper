import { test, expect } from "@playwright/test";
import { registerUser, testUser } from "./helpers/auth";
import { FRONTEND_URL } from "./helpers/env";

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

  test("UI-CORE-03: authenticated user sees sidebar layout and can collapse it", async ({
    page,
    request,
  }) => {
    const user = testUser();
    const cookies = await registerUser(request, user);

    const cookiePairs = cookies.split("; ").map((cookie) => {
      const [name, value] = cookie.split("=");
      return { name, value, url: FRONTEND_URL };
    });
    await page.context().addCookies(cookiePairs);

    await page.goto("/app");

    await expect(page).toHaveURL(/\/app/);
    await expect(page.getByText("Platform")).toBeVisible();
    await expect(page.getByText("Projects")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "breadcrumb" })).toBeVisible();

    const sidebar = page.locator("[data-slot='sidebar'][data-side='left']");
    await expect(sidebar).toHaveAttribute("data-state", "expanded");

    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    await expect(sidebar).toHaveAttribute("data-state", "collapsed");
  });
});
