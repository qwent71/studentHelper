import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const { settingsDialogMock } = vi.hoisted(() => ({
  settingsDialogMock: {
    open: true,
    setOpen: vi.fn(),
    nav: { categoryId: "account", subPageId: null },
    mobileView: "list" as const,
    openToCategory: vi.fn(),
    selectCategory: vi.fn(),
    selectSubPage: vi.fn(),
    goBack: vi.fn(),
  },
}));

vi.mock("@/shared/settings", () => ({
  useSettingsDialog: () => settingsDialogMock,
}));

// Mock useIsMobile
vi.mock("@student-helper/ui/web/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

// Mock dialog primitives
vi.mock("@student-helper/ui/web/primitives/dialog", () => ({
  Dialog: ({ children, open }: React.PropsWithChildren<{ open: boolean }>) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: React.PropsWithChildren) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogTitle: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <h2 className={className}>{children}</h2>
  ),
  DialogDescription: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <p className={className}>{children}</p>
  ),
}));

// Mock drawer primitives
vi.mock("@student-helper/ui/web/primitives/drawer", () => ({
  Drawer: ({ children, open }: React.PropsWithChildren<{ open: boolean }>) =>
    open ? <div data-testid="drawer">{children}</div> : null,
  DrawerContent: ({ children }: React.PropsWithChildren) => (
    <div data-testid="drawer-content">{children}</div>
  ),
  DrawerHeader: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DrawerTitle: ({ children }: React.PropsWithChildren) => (
    <h2>{children}</h2>
  ),
  DrawerDescription: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <p className={className}>{children}</p>
  ),
}));

// Mock sidebar primitives
vi.mock("@student-helper/ui/web/primitives/sidebar", () => ({
  Sidebar: ({ children }: React.PropsWithChildren) => <aside>{children}</aside>,
  SidebarContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SidebarGroup: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SidebarMenu: ({ children }: React.PropsWithChildren) => <ul>{children}</ul>,
  SidebarMenuButton: ({
    children,
    onClick,
    isActive,
  }: React.PropsWithChildren<{ onClick?: () => void; isActive?: boolean }>) => (
    <button type="button" onClick={onClick} data-active={isActive}>
      {children}
    </button>
  ),
  SidebarMenuItem: ({ children }: React.PropsWithChildren) => <li>{children}</li>,
  SidebarProvider: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

// Mock button
vi.mock("@student-helper/ui/web/primitives/button", () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// Mock ThemeToggle
vi.mock("@/features/toggle-theme", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

import { SettingsDialog } from "./SettingsDialog";

describe("SettingsDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingsDialogMock.open = true;
    settingsDialogMock.nav = { categoryId: "account", subPageId: null };
    settingsDialogMock.mobileView = "list";
  });

  it("renders all categories in desktop sidebar", () => {
    render(<SettingsDialog />);

    expect(screen.getAllByText("Account").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Appearance")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Language & Region")).toBeInTheDocument();
    expect(screen.getByText("Privacy")).toBeInTheDocument();
  });

  it("shows sub-page list when category has sub-pages", () => {
    render(<SettingsDialog />);

    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Password")).toBeInTheDocument();
  });

  it("clicking a category calls selectCategory", () => {
    render(<SettingsDialog />);

    fireEvent.click(screen.getByText("Appearance"));

    expect(settingsDialogMock.selectCategory).toHaveBeenCalledWith("appearance");
  });

  it("does not render when closed", () => {
    settingsDialogMock.open = false;
    render(<SettingsDialog />);

    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });
});
