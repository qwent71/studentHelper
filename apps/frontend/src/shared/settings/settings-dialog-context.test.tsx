import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsDialogProvider, useSettingsDialog } from "./settings-dialog-context";

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

function TestConsumer() {
  const ctx = useSettingsDialog();
  return (
    <div>
      <span data-testid="open">{String(ctx.open)}</span>
      <span data-testid="categoryId">{ctx.categoryId}</span>
      <span data-testid="mobileView">{ctx.mobileView}</span>
      <button type="button" onClick={() => ctx.setOpen(true)}>
        open
      </button>
      <button type="button" onClick={() => ctx.setOpen(false)}>
        close
      </button>
      <button type="button" onClick={() => ctx.openToCategory("appearance")}>
        openToAppearance
      </button>
      <button type="button" onClick={() => ctx.selectCategory("privacy")}>
        selectPrivacy
      </button>
      <button type="button" onClick={() => ctx.goBack()}>
        goBack
      </button>
    </div>
  );
}

function renderWithProvider() {
  const user = userEvent.setup();
  const result = render(
    <SettingsDialogProvider>
      <TestConsumer />
    </SettingsDialogProvider>,
  );
  return { ...result, user };
}

describe("SettingsDialogProvider + useSettingsDialog", () => {
  it("throws when used outside provider", () => {
    // Suppress React error boundary console output
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      "useSettingsDialog must be used within a SettingsDialogProvider",
    );
    spy.mockRestore();
  });

  it("starts closed with default category and list view", () => {
    renderWithProvider();
    expect(screen.getByTestId("open")).toHaveTextContent("false");
    expect(screen.getByTestId("categoryId")).toHaveTextContent("account");
    expect(screen.getByTestId("mobileView")).toHaveTextContent("list");
  });

  it("setOpen(true) opens dialog", async () => {
    const { user } = renderWithProvider();
    await user.click(screen.getByText("open"));
    expect(screen.getByTestId("open")).toHaveTextContent("true");
  });

  it("setOpen(false) closes and resets categoryId to account and mobileView to list", async () => {
    const { user } = renderWithProvider();
    await user.click(screen.getByText("openToAppearance"));
    expect(screen.getByTestId("open")).toHaveTextContent("true");
    expect(screen.getByTestId("categoryId")).toHaveTextContent("appearance");
    expect(screen.getByTestId("mobileView")).toHaveTextContent("content");

    await user.click(screen.getByText("close"));
    expect(screen.getByTestId("open")).toHaveTextContent("false");
    expect(screen.getByTestId("categoryId")).toHaveTextContent("account");
    expect(screen.getByTestId("mobileView")).toHaveTextContent("list");
  });

  it("openToCategory opens with correct category and mobileView=content", async () => {
    const { user } = renderWithProvider();
    await user.click(screen.getByText("openToAppearance"));
    expect(screen.getByTestId("open")).toHaveTextContent("true");
    expect(screen.getByTestId("categoryId")).toHaveTextContent("appearance");
    expect(screen.getByTestId("mobileView")).toHaveTextContent("content");
  });

  it("selectCategory changes category and sets mobileView=content", async () => {
    const { user } = renderWithProvider();
    await user.click(screen.getByText("open"));
    await user.click(screen.getByText("selectPrivacy"));
    expect(screen.getByTestId("categoryId")).toHaveTextContent("privacy");
    expect(screen.getByTestId("mobileView")).toHaveTextContent("content");
  });

  it("goBack sets mobileView to list", async () => {
    const { user } = renderWithProvider();
    await user.click(screen.getByText("openToAppearance"));
    expect(screen.getByTestId("mobileView")).toHaveTextContent("content");

    await user.click(screen.getByText("goBack"));
    expect(screen.getByTestId("mobileView")).toHaveTextContent("list");
  });

  it("opening sets hash to #settings/account", async () => {
    const { user } = renderWithProvider();
    await user.click(screen.getByText("open"));
    expect(window.location.hash).toBe("#settings/account");
  });

  it("changing category updates hash", async () => {
    const { user } = renderWithProvider();
    await user.click(screen.getByText("open"));
    expect(window.location.hash).toBe("#settings/account");

    await user.click(screen.getByText("selectPrivacy"));
    expect(window.location.hash).toBe("#settings/privacy");
  });

  it("closing removes hash", async () => {
    const { user } = renderWithProvider();
    await user.click(screen.getByText("open"));
    expect(window.location.hash).toBe("#settings/account");

    await user.click(screen.getByText("close"));
    expect(window.location.hash).toBe("");
  });

  it("restores state from #settings/appearance on mount", async () => {
    window.history.replaceState(null, "", "#settings/appearance");

    await act(async () => {
      renderWithProvider();
    });

    expect(screen.getByTestId("open")).toHaveTextContent("true");
    expect(screen.getByTestId("categoryId")).toHaveTextContent("appearance");
    expect(screen.getByTestId("mobileView")).toHaveTextContent("content");
  });

  it("stays closed when no hash on mount", () => {
    renderWithProvider();
    expect(screen.getByTestId("open")).toHaveTextContent("false");
  });
});
