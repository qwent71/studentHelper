import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { routerPushMock, routerRefreshMock, signOutMock, settingsDialogMock } =
  vi.hoisted(() => ({
    routerPushMock: vi.fn(),
    routerRefreshMock: vi.fn(),
    signOutMock: vi.fn(),
    settingsDialogMock: {
      open: true,
      setOpen: vi.fn(),
      categoryId: "account",
      mobileView: "list" as "list" | "content",
      openToCategory: vi.fn(),
      selectCategory: vi.fn(),
      goBack: vi.fn(),
    },
  }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock, refresh: routerRefreshMock }),
}));

vi.mock("@/shared/settings", () => ({
  useSettingsDialog: () => settingsDialogMock,
}));

vi.mock("@/shared/auth/auth-client", () => ({
  signOut: signOutMock,
}));

vi.mock("@student-helper/ui/web/primitives/drawer", () => ({
  Drawer: ({
    children,
    open,
  }: React.PropsWithChildren<{ open: boolean }>) =>
    open ? <div data-testid="drawer">{children}</div> : null,
  DrawerContent: ({ children }: React.PropsWithChildren) => (
    <div data-testid="drawer-content">{children}</div>
  ),
  DrawerHeader: ({
    children,
    className,
  }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="drawer-header" className={className}>
      {children}
    </div>
  ),
  DrawerTitle: ({
    children,
    className,
  }: React.PropsWithChildren<{ className?: string }>) => (
    <h2 className={className}>{children}</h2>
  ),
  DrawerDescription: ({
    children,
    className,
  }: React.PropsWithChildren<{ className?: string }>) => (
    <p className={className}>{children}</p>
  ),
}));

vi.mock("@student-helper/ui/web/primitives/alert-dialog", () => ({
  AlertDialog: ({
    children,
    open,
  }: React.PropsWithChildren<{ open: boolean }>) =>
    open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogAction: ({
    children,
    onClick,
  }: React.PropsWithChildren<{ onClick?: React.MouseEventHandler }>) => (
    <button type="button" data-testid="confirm-logout" onClick={onClick}>
      {children}
    </button>
  ),
  AlertDialogCancel: ({
    children,
    ...props
  }: React.PropsWithChildren<{ disabled?: boolean }>) => (
    <button type="button" data-testid="cancel-logout" {...props}>
      {children}
    </button>
  ),
  AlertDialogContent: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  AlertDialogDescription: ({ children }: React.PropsWithChildren) => (
    <p>{children}</p>
  ),
  AlertDialogFooter: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  AlertDialogHeader: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  AlertDialogTitle: ({ children }: React.PropsWithChildren) => (
    <h2>{children}</h2>
  ),
}));

vi.mock("@student-helper/ui/web/primitives/button", () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: React.PropsWithChildren<{
    onClick?: React.MouseEventHandler;
    variant?: string;
    size?: string;
    className?: string;
  }>) => (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@student-helper/ui/utils/cn", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

vi.mock("@/features/toggle-theme", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

import { SettingsDialogMobile } from "./SettingsDialogMobile";

describe("SettingsDialogMobile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signOutMock.mockResolvedValue({ error: null });
    settingsDialogMock.open = true;
    settingsDialogMock.categoryId = "account";
    settingsDialogMock.mobileView = "list";
  });

  describe("visibility", () => {
    it("does not render when closed", () => {
      settingsDialogMock.open = false;
      render(<SettingsDialogMobile />);
      expect(screen.queryByTestId("drawer")).not.toBeInTheDocument();
    });

    it("renders as Drawer when open", () => {
      render(<SettingsDialogMobile />);
      expect(screen.getByTestId("drawer")).toBeInTheDocument();
    });
  });

  describe("list view (mobileView=list)", () => {
    it("shows 'Settings' title in header", () => {
      render(<SettingsDialogMobile />);
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("renders all 5 category buttons", () => {
      render(<SettingsDialogMobile />);
      expect(screen.getByText("Account")).toBeInTheDocument();
      expect(screen.getByText("Appearance")).toBeInTheDocument();
      expect(screen.getByText("Notifications")).toBeInTheDocument();
      expect(screen.getByText("Language & Region")).toBeInTheDocument();
      expect(screen.getByText("Privacy")).toBeInTheDocument();
    });

    it("clicking category calls selectCategory", () => {
      render(<SettingsDialogMobile />);
      fireEvent.click(screen.getByText("Appearance"));
      expect(settingsDialogMock.selectCategory).toHaveBeenCalledWith(
        "appearance",
      );
    });

    it("shows Help and Log out action items", () => {
      render(<SettingsDialogMobile />);
      expect(screen.getByText("Help")).toBeInTheDocument();
      expect(screen.getByText("Log out")).toBeInTheDocument();
    });

    it("does NOT show Back button", () => {
      render(<SettingsDialogMobile />);
      expect(screen.queryByText("Back")).not.toBeInTheDocument();
    });

    it("Close button calls setOpen(false)", () => {
      render(<SettingsDialogMobile />);
      fireEvent.click(screen.getByText("Close"));
      expect(settingsDialogMock.setOpen).toHaveBeenCalledWith(false);
    });
  });

  describe("content view (mobileView=content)", () => {
    beforeEach(() => {
      settingsDialogMock.mobileView = "content";
      settingsDialogMock.categoryId = "account";
    });

    it("shows category label in header", () => {
      render(<SettingsDialogMobile />);
      // The header should show "Account" when in content view with categoryId=account
      const header = screen.getByTestId("drawer-header");
      expect(header).toHaveTextContent("Account");
    });

    it("shows Back button", () => {
      render(<SettingsDialogMobile />);
      expect(screen.getByText("Back")).toBeInTheDocument();
    });

    it("Back button calls goBack()", () => {
      render(<SettingsDialogMobile />);
      fireEvent.click(screen.getByText("Back"));
      expect(settingsDialogMock.goBack).toHaveBeenCalled();
    });

    it("renders settings panel content", () => {
      render(<SettingsDialogMobile />);
      expect(
        screen.getByText(
          "Manage your account settings and profile information.",
        ),
      ).toBeInTheDocument();
    });

    it("does NOT show category list", () => {
      render(<SettingsDialogMobile />);
      expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
      expect(screen.queryByText("Privacy")).not.toBeInTheDocument();
    });
  });

  describe("sign out flow", () => {
    it("'Log out' shows confirmation dialog", () => {
      render(<SettingsDialogMobile />);
      expect(screen.queryByTestId("alert-dialog")).not.toBeInTheDocument();

      fireEvent.click(screen.getByText("Log out"));
      expect(screen.getByTestId("alert-dialog")).toBeInTheDocument();
      expect(screen.getByText("Log out?")).toBeInTheDocument();
    });

    it("Cancel does not sign out", () => {
      render(<SettingsDialogMobile />);
      fireEvent.click(screen.getByText("Log out"));
      fireEvent.click(screen.getByTestId("cancel-logout"));
      expect(signOutMock).not.toHaveBeenCalled();
    });

    it("Confirm calls signOut, setOpen(false), router.push, router.refresh", async () => {
      render(<SettingsDialogMobile />);
      fireEvent.click(screen.getByText("Log out"));
      fireEvent.click(screen.getByTestId("confirm-logout"));

      await waitFor(() => {
        expect(signOutMock).toHaveBeenCalledTimes(1);
      });
      expect(settingsDialogMock.setOpen).toHaveBeenCalledWith(false);
      expect(routerPushMock).toHaveBeenCalledWith("/auth/login");
      expect(routerRefreshMock).toHaveBeenCalledTimes(1);
    });
  });
});
