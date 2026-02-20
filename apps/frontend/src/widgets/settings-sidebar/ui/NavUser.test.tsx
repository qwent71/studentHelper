import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { routerPushMock, routerRefreshMock, signOutMock, settingsDialogMock, sidebarMock } =
  vi.hoisted(() => ({
    routerPushMock: vi.fn(),
    routerRefreshMock: vi.fn(),
    signOutMock: vi.fn(),
    settingsDialogMock: {
      open: false,
      setOpen: vi.fn(),
      categoryId: "account",
      mobileView: "list" as const,
      openToCategory: vi.fn(),
      selectCategory: vi.fn(),
      goBack: vi.fn(),
    },
    sidebarMock: { isMobile: false, state: "expanded" as const },
  }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock, refresh: routerRefreshMock }),
}));

vi.mock("@student-helper/ui/web/primitives/sidebar", () => ({
  SidebarMenu: ({ children }: React.PropsWithChildren) => <ul>{children}</ul>,
  SidebarMenuButton: ({
    children,
    onClick,
    ...props
  }: React.PropsWithChildren<{ onClick?: () => void; size?: string }>) => (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
  SidebarMenuItem: ({ children }: React.PropsWithChildren) => (
    <li>{children}</li>
  ),
  useSidebar: () => sidebarMock,
}));

vi.mock("@student-helper/ui/web/primitives/avatar", () => ({
  Avatar: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AvatarImage: ({ alt, src }: { alt?: string; src?: string }) =>
    // eslint-disable-next-line @next/next/no-img-element
    src ? <img alt={alt} src={src} /> : null,
  AvatarFallback: ({ children }: React.PropsWithChildren) => (
    <span>{children}</span>
  ),
}));

vi.mock("@student-helper/ui/web/primitives/dropdown-menu", () => ({
  DropdownMenu: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DropdownMenuContent: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DropdownMenuGroup: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onSelect,
    ...props
  }: React.PropsWithChildren<{ onSelect?: (e: Event) => void }>) => (
    <button
      type="button"
      onClick={(event) => {
        if (typeof onSelect === "function") {
          onSelect(event as unknown as Event);
        }
      }}
      {...props}
    >
      {children}
    </button>
  ),
  DropdownMenuLabel: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
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

vi.mock("@/shared/auth/auth-client", () => ({
  signOut: signOutMock,
}));

vi.mock("@/shared/settings", () => ({
  useSettingsDialog: () => settingsDialogMock,
}));

import { NavUser } from "./NavUser";

const testUser = {
  id: "1",
  name: "John Doe",
  email: "john@example.com",
  image: null,
};

describe("NavUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signOutMock.mockResolvedValue({ error: null });
    sidebarMock.isMobile = false;
  });

  describe("mobile (isMobile=true)", () => {
    beforeEach(() => {
      sidebarMock.isMobile = true;
    });

    it("renders user name and email", () => {
      render(<NavUser user={testUser} />);
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });

    it("renders initials fallback", () => {
      render(<NavUser user={testUser} />);
      expect(screen.getByText("JD")).toBeInTheDocument();
    });

    it("clicking button calls setOpen(true)", () => {
      render(<NavUser user={testUser} />);
      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(settingsDialogMock.setOpen).toHaveBeenCalledWith(true);
    });

    it("does NOT render dropdown menu items", () => {
      render(<NavUser user={testUser} />);
      expect(screen.queryByText("Персонализация")).not.toBeInTheDocument();
      expect(screen.queryByText("Помощь")).not.toBeInTheDocument();
    });
  });

  describe("desktop (isMobile=false)", () => {
    it("renders user name and email", () => {
      render(<NavUser user={testUser} />);
      expect(screen.getAllByText("John Doe").length).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByText("john@example.com").length,
      ).toBeGreaterThanOrEqual(1);
    });

    it("renders initials fallback", () => {
      render(<NavUser user={testUser} />);
      expect(screen.getAllByText("JD").length).toBeGreaterThanOrEqual(1);
    });

    it("Personalization calls openToCategory('appearance')", () => {
      render(<NavUser user={testUser} />);
      fireEvent.click(screen.getByText("Персонализация"));
      expect(settingsDialogMock.openToCategory).toHaveBeenCalledWith(
        "appearance",
      );
    });

    it("Settings calls setOpen(true)", () => {
      render(<NavUser user={testUser} />);
      const settingsButtons = screen.getAllByRole("button");
      const settingsBtn = settingsButtons.find(
        (btn) => btn.textContent?.trim() === "Настройки",
      )!;
      fireEvent.click(settingsBtn);
      expect(settingsDialogMock.setOpen).toHaveBeenCalledWith(true);
    });

    it("Help calls window.open", () => {
      const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
      render(<NavUser user={testUser} />);
      fireEvent.click(screen.getByText("Помощь"));
      expect(openSpy).toHaveBeenCalledWith("https://github.com", "_blank");
      openSpy.mockRestore();
    });

    it("Log out shows AlertDialog confirmation", () => {
      render(<NavUser user={testUser} />);
      expect(screen.queryByTestId("alert-dialog")).not.toBeInTheDocument();

      fireEvent.click(screen.getByText("Выйти"));
      expect(screen.getByTestId("alert-dialog")).toBeInTheDocument();
      expect(screen.getByText("Выйти?")).toBeInTheDocument();
    });

    it("Log out menu item uses neutral style variant", () => {
      render(<NavUser user={testUser} />);
      const logoutButton = screen.getByRole("button", { name: "Выйти" });
      expect(logoutButton).not.toHaveAttribute("variant", "destructive");
    });

    it("Cancel in AlertDialog does not call signOut", () => {
      render(<NavUser user={testUser} />);
      fireEvent.click(screen.getByText("Выйти"));
      fireEvent.click(screen.getByTestId("cancel-logout"));
      expect(signOutMock).not.toHaveBeenCalled();
    });

    it("Confirm sign out calls signOut, pushes /auth/login, calls refresh", async () => {
      render(<NavUser user={testUser} />);
      fireEvent.click(screen.getByText("Выйти"));
      fireEvent.click(screen.getByTestId("confirm-logout"));

      await waitFor(() => {
        expect(signOutMock).toHaveBeenCalledTimes(1);
      });
      expect(routerPushMock).toHaveBeenCalledWith("/auth/login");
      expect(routerRefreshMock).toHaveBeenCalledTimes(1);
    });

    it("renders avatar image when user.image is provided", () => {
      render(
        <NavUser user={{ ...testUser, image: "/avatar.png" }} />,
      );
      const avatars = screen.getAllByRole("img", { name: "John Doe" });
      expect(avatars.length).toBeGreaterThanOrEqual(1);
      expect(avatars[0]).toHaveAttribute("src", "/avatar.png");
    });
  });
});
