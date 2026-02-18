import { test, expect } from "@playwright/test";
import { registerUser, testUser } from "./helpers/auth";
import { FRONTEND_URL } from "./helpers/env";

test.describe("Settings dialog @regression", () => {
  test.beforeEach(async ({ page, request }) => {
    const user = testUser();
    const cookies = await registerUser(request, user);

    const cookiePairs = cookies.split("; ").map((c) => {
      const [name, value] = c.split("=");
      return { name, value, url: FRONTEND_URL };
    });
    await page.context().addCookies(cookiePairs);
  });

  test.describe("desktop", () => {
    test("Settings link in sidebar opens settings dialog", async ({
      page,
    }) => {
      await page.goto("/app");

      const sidebar = page.locator("[data-slot='sidebar']");
      await expect(sidebar.first()).toBeVisible({ timeout: 10_000 });

      const settingsLink = sidebar.first().locator("a[href='/app/settings']");
      await settingsLink.click();

      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();
    });

    test("Settings dialog shows all 5 categories", async ({ page }) => {
      await page.goto("/app");

      const sidebar = page.locator("[data-slot='sidebar']");
      await expect(sidebar.first()).toBeVisible({ timeout: 10_000 });

      await sidebar.first().locator("a[href='/app/settings']").click();
      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      await expect(dialog.getByRole("button", { name: "Account" })).toBeVisible();
      await expect(dialog.getByRole("button", { name: "Appearance" })).toBeVisible();
      await expect(dialog.getByRole("button", { name: "Notifications" })).toBeVisible();
      await expect(dialog.getByRole("button", { name: "Language & Region" })).toBeVisible();
      await expect(dialog.getByRole("button", { name: "Privacy" })).toBeVisible();
    });

    test("Clicking a category shows its content panel", async ({ page }) => {
      await page.goto("/app");

      const sidebar = page.locator("[data-slot='sidebar']");
      await expect(sidebar.first()).toBeVisible({ timeout: 10_000 });

      await sidebar.first().locator("a[href='/app/settings']").click();
      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      await dialog.getByRole("button", { name: "Appearance" }).click();
      await expect(
        dialog.getByText("Customize how the app looks and feels."),
      ).toBeVisible();
    });

    test("Hash updates to #settings/<category> when navigating", async ({
      page,
    }) => {
      await page.goto("/app");

      const sidebar = page.locator("[data-slot='sidebar']");
      await expect(sidebar.first()).toBeVisible({ timeout: 10_000 });

      await sidebar.first().locator("a[href='/app/settings']").click();
      await expect(page.locator("[role='dialog']")).toBeVisible();

      await expect(page).toHaveURL(/#settings\/account/);

      await page
        .locator("[role='dialog']")
        .getByRole("button", { name: "Privacy" })
        .click();
      await expect(page).toHaveURL(/#settings\/privacy/);
    });

    test("Close button (X) closes the dialog", async ({ page }) => {
      await page.goto("/app");

      const sidebar = page.locator("[data-slot='sidebar']");
      await expect(sidebar.first()).toBeVisible({ timeout: 10_000 });

      await sidebar.first().locator("a[href='/app/settings']").click();
      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();

      await dialog.getByRole("button", { name: "Close" }).click();
      await expect(dialog).not.toBeVisible();
    });

    test("User menu → Personalization opens settings to Appearance", async ({
      page,
    }) => {
      await page.goto("/app");

      const sidebar = page.locator("[data-slot='sidebar']");
      await expect(sidebar.first()).toBeVisible({ timeout: 10_000 });

      // Open the user menu dropdown — the trigger is a button in the sidebar footer
      const footer = sidebar.first().locator("[data-slot='sidebar-footer']");
      await footer.locator("button").first().click();

      // Click Personalization
      await page.getByText("Personalization").click();

      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByText("Customize how the app looks and feels."),
      ).toBeVisible();
    });

    test("User menu → Settings opens settings to Account", async ({
      page,
    }) => {
      await page.goto("/app");

      const sidebar = page.locator("[data-slot='sidebar']");
      await expect(sidebar.first()).toBeVisible({ timeout: 10_000 });

      const footer = sidebar.first().locator("[data-slot='sidebar-footer']");
      await footer.locator("button").first().click();

      // The dropdown has a "Settings" item — click it
      await page.getByRole("menuitem", { name: "Settings" }).click();

      const dialog = page.locator("[role='dialog']");
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByText(
          "Manage your account settings and profile information.",
        ),
      ).toBeVisible();
    });

    test("User menu → Log out shows confirmation, cancel keeps user signed in", async ({
      page,
    }) => {
      await page.goto("/app");

      const sidebar = page.locator("[data-slot='sidebar']");
      await expect(sidebar.first()).toBeVisible({ timeout: 10_000 });

      const footer = sidebar.first().locator("[data-slot='sidebar-footer']");
      await footer.locator("button").first().click();

      await page.getByRole("menuitem", { name: "Log out" }).click();

      // AlertDialog should be visible
      await expect(page.getByText("Log out?")).toBeVisible();
      await expect(
        page.getByText("Are you sure you want to log out of your account?"),
      ).toBeVisible();

      // Cancel
      await page.getByRole("button", { name: "Cancel" }).click();

      // Should still be on /app (not redirected to login)
      await expect(page).toHaveURL(/\/app/);
    });
  });

  test.describe("mobile @mobile", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("Sidebar opens as sheet via hamburger trigger", async ({ page }) => {
      await page.goto("/app");

      // On mobile, sidebar is hidden. The trigger button should be visible.
      const trigger = page.locator("[data-sidebar='trigger']");
      await expect(trigger).toBeVisible({ timeout: 10_000 });

      await trigger.click();

      // The sidebar should appear (as a sheet overlay)
      const sidebar = page.locator("[data-slot='sidebar']");
      await expect(sidebar).toBeVisible();
    });

    test("User avatar button in sidebar opens settings drawer", async ({
      page,
    }) => {
      await page.goto("/app");

      const trigger = page.locator("[data-sidebar='trigger']");
      await expect(trigger).toBeVisible({ timeout: 10_000 });
      await trigger.click();

      const sidebar = page.locator("[data-slot='sidebar']");
      await expect(sidebar).toBeVisible();

      // Click the user button in the footer (on mobile it directly opens settings)
      const footer = sidebar.locator("[data-slot='sidebar-footer']");
      await footer.locator("button").first().click();

      // A drawer dialog should appear with "Settings" title
      const drawer = page.locator("[role='dialog']").last();
      await expect(drawer).toBeVisible();
      await expect(
        drawer.getByRole("heading", { name: "Settings" }),
      ).toBeVisible();
    });

    test("Settings drawer shows all 5 categories in list view", async ({
      page,
    }) => {
      await page.goto("/app");

      const trigger = page.locator("[data-sidebar='trigger']");
      await expect(trigger).toBeVisible({ timeout: 10_000 });
      await trigger.click();

      const sidebar = page.locator("[data-slot='sidebar']");
      await expect(sidebar).toBeVisible();

      const footer = sidebar.locator("[data-slot='sidebar-footer']");
      await footer.locator("button").first().click();

      const drawer = page.locator("[role='dialog']").last();
      await expect(drawer).toBeVisible();

      await expect(drawer.getByText("Account")).toBeVisible();
      await expect(drawer.getByText("Appearance")).toBeVisible();
      await expect(drawer.getByText("Notifications")).toBeVisible();
      await expect(drawer.getByText("Language & Region")).toBeVisible();
      await expect(drawer.getByText("Privacy")).toBeVisible();
    });

    test("Tapping a category switches to content view", async ({ page }) => {
      await page.goto("/app");

      const trigger = page.locator("[data-sidebar='trigger']");
      await expect(trigger).toBeVisible({ timeout: 10_000 });
      await trigger.click();

      const sidebar = page.locator("[data-slot='sidebar']");
      await expect(sidebar).toBeVisible();

      const footer = sidebar.locator("[data-slot='sidebar-footer']");
      await footer.locator("button").first().click();

      const drawer = page.locator("[role='dialog']").last();
      await expect(drawer).toBeVisible();

      await drawer.getByText("Appearance").click();

      // Content view should show category title and panel content
      await expect(
        drawer.getByText("Customize how the app looks and feels."),
      ).toBeVisible();
    });

    test("Back button returns to category list", async ({ page }) => {
      await page.goto("/app");

      const trigger = page.locator("[data-sidebar='trigger']");
      await expect(trigger).toBeVisible({ timeout: 10_000 });
      await trigger.click();

      const sidebar = page.locator("[data-slot='sidebar']");
      await expect(sidebar).toBeVisible();

      const footer = sidebar.locator("[data-slot='sidebar-footer']");
      await footer.locator("button").first().click();

      const drawer = page.locator("[role='dialog']").last();
      await expect(drawer).toBeVisible();

      // Navigate to content view
      await drawer.getByText("Appearance").click();
      await expect(
        drawer.getByText("Customize how the app looks and feels."),
      ).toBeVisible();

      // Click back
      await drawer.getByRole("button", { name: "Back" }).click();

      // Should see category list again
      await expect(drawer.getByText("Account")).toBeVisible();
      await expect(drawer.getByText("Privacy")).toBeVisible();
    });

    test("Close button (X) closes the drawer", async ({ page }) => {
      await page.goto("/app");

      const trigger = page.locator("[data-sidebar='trigger']");
      await expect(trigger).toBeVisible({ timeout: 10_000 });
      await trigger.click();

      const sidebar = page.locator("[data-slot='sidebar']");
      await expect(sidebar).toBeVisible();

      const footer = sidebar.locator("[data-slot='sidebar-footer']");
      await footer.locator("button").first().click();

      const drawer = page.locator("[data-slot='drawer-content']");
      await expect(drawer).toBeVisible();

      await drawer.getByRole("button", { name: "Close" }).click();

      // Drawer transitions to closed state
      await expect(drawer).toHaveAttribute("data-state", "closed");
    });

    test("Help and Log out action items visible in list view", async ({
      page,
    }) => {
      await page.goto("/app");

      const trigger = page.locator("[data-sidebar='trigger']");
      await expect(trigger).toBeVisible({ timeout: 10_000 });
      await trigger.click();

      const sidebar = page.locator("[data-slot='sidebar']");
      await expect(sidebar).toBeVisible();

      const footer = sidebar.locator("[data-slot='sidebar-footer']");
      await footer.locator("button").first().click();

      const drawer = page.locator("[role='dialog']").last();
      await expect(drawer).toBeVisible();

      await expect(drawer.getByText("Help")).toBeVisible();
      await expect(drawer.getByText("Log out")).toBeVisible();
    });
  });
});
