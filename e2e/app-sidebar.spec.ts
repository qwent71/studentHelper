import { test, expect } from "@playwright/test";
import { registerUser, testUser } from "./helpers/auth";
import { FRONTEND_URL } from "./helpers/env";

test.describe("App sidebar @regression", () => {
  test.beforeEach(async ({ page, request }) => {
    const user = testUser();
    const cookies = await registerUser(request, user);

    const cookiePairs = cookies.split("; ").map((c) => {
      const [name, value] = c.split("=");
      return { name, value, url: FRONTEND_URL };
    });
    await page.context().addCookies(cookiePairs);
  });

  test("sidebar renders with navigation items", async ({ page }) => {
    await page.goto("/app");
    await expect(page).toHaveURL(/\/app/);

    // Wait for sidebar to render
    const sidebar = page.locator("[data-slot='sidebar']");
    await expect(sidebar.first()).toBeVisible({ timeout: 10_000 });

    // Check nav items
    const desktopSidebar = sidebar.first();
    await expect(
      desktopSidebar.locator("a[href='/app']", { hasText: "Dashboard" }),
    ).toBeVisible();
    await expect(desktopSidebar.locator("a[href='/app/chat']")).toBeVisible();
    await expect(
      desktopSidebar.locator("a[href='/app/settings']", { hasText: "Settings" }),
    ).toBeVisible();
  });

  test("sidebar toggle collapses and expands", async ({ page }) => {
    await page.goto("/app");

    const sidebar = page.locator("[data-slot='sidebar']");
    await expect(sidebar.first()).toBeVisible({ timeout: 10_000 });

    // Click the trigger button to collapse
    const trigger = page.locator("[data-sidebar='trigger']");
    await trigger.click();

    // Sidebar should be in collapsed state
    const sidebarWrapper = page.locator("[data-state='collapsed']");
    await expect(sidebarWrapper).toBeVisible();

    // Click again to expand
    await trigger.click();
    const expandedWrapper = page.locator("[data-state='expanded']");
    await expect(expandedWrapper).toBeVisible();
  });

  test("keyboard shortcut cmd+b toggles sidebar", async ({ page }) => {
    await page.goto("/app");

    const sidebar = page.locator("[data-slot='sidebar']");
    await expect(sidebar.first()).toBeVisible({ timeout: 10_000 });

    // Press cmd+b to collapse
    await page.keyboard.press("Meta+b");
    const collapsed = page.locator("[data-state='collapsed']");
    await expect(collapsed).toBeVisible();

    // Press cmd+b to expand
    await page.keyboard.press("Meta+b");
    const expanded = page.locator("[data-state='expanded']");
    await expect(expanded).toBeVisible();
  });
});
