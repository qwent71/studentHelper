import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { settingsDialogMock } = vi.hoisted(() => ({
  settingsDialogMock: {
    open: true,
    setOpen: vi.fn(),
    categoryId: "account",
    mobileView: "list" as const,
    openToCategory: vi.fn(),
    selectCategory: vi.fn(),
    goBack: vi.fn(),
  },
}));

vi.mock("@/shared/settings", () => ({
  useSettingsDialog: () => settingsDialogMock,
}));

vi.mock("@/features/toggle-theme", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

import { SettingsContent } from "./SettingsContent";

describe("SettingsContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingsDialogMock.categoryId = "account";
  });

  it("renders AccountPanel for categoryId=account", () => {
    settingsDialogMock.categoryId = "account";
    render(<SettingsContent />);
    expect(
      screen.getByText(
        "Управление настройками аккаунта и профиля.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Открыть помощь" })).toHaveAttribute(
      "href",
      expect.stringContaining("https://github.com"),
    );
  });

  it("renders AppearancePanel for categoryId=appearance", () => {
    settingsDialogMock.categoryId = "appearance";
    render(<SettingsContent />);
    expect(
      screen.getByText("Настройте внешний вид приложения."),
    ).toBeInTheDocument();
  });

  it("renders NotificationsPanel for categoryId=notifications", () => {
    settingsDialogMock.categoryId = "notifications";
    render(<SettingsContent />);
    expect(
      screen.getByText(
        "Настройте, как и когда вы получаете уведомления.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Открыть помощь" })).toHaveAttribute(
      "href",
      expect.stringContaining("https://github.com"),
    );
  });

  it("renders LanguagePanel for categoryId=language", () => {
    settingsDialogMock.categoryId = "language";
    render(<SettingsContent />);
    expect(
      screen.getByText(
        "Настройте язык и региональные параметры.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Открыть помощь" })).toHaveAttribute(
      "href",
      expect.stringContaining("https://github.com"),
    );
  });

  it("renders PrivacyPanel for categoryId=privacy", () => {
    settingsDialogMock.categoryId = "privacy";
    render(<SettingsContent />);
    expect(
      screen.getByText("Управление настройками конфиденциальности и данных."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Открыть помощь" })).toHaveAttribute(
      "href",
      expect.stringContaining("https://github.com"),
    );
  });

  it("renders nothing for unknown categoryId", () => {
    settingsDialogMock.categoryId = "nonexistent";
    const { container } = render(<SettingsContent />);
    expect(container.innerHTML).toBe("");
  });
});
