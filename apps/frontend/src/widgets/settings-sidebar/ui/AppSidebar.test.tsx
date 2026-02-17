import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { routerPushMock, routerRefreshMock, signOutMock, settingsDialogMock } = vi.hoisted(() => ({
  routerPushMock: vi.fn(),
  routerRefreshMock: vi.fn(),
  signOutMock: vi.fn(),
  settingsDialogMock: {
    open: false,
    setOpen: vi.fn(),
    nav: { categoryId: "account", subPageId: null },
    mobileView: "list" as const,
    openToCategory: vi.fn(),
    selectCategory: vi.fn(),
    selectSubPage: vi.fn(),
    goBack: vi.fn(),
  },
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/app",
  useRouter: () => ({
    push: routerPushMock,
    refresh: routerRefreshMock,
  }),
}));

// Mock sidebar primitives — render children only, no browser context needed
vi.mock("@student-helper/ui/web/primitives/sidebar", () => ({
  Sidebar: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <aside data-testid="sidebar" {...props}>{children}</aside>
  ),
  SidebarContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SidebarFooter: ({ children }: React.PropsWithChildren) => <div data-testid="sidebar-footer">{children}</div>,
  SidebarHeader: ({ children }: React.PropsWithChildren) => <div data-testid="sidebar-header">{children}</div>,
  SidebarMenu: ({ children }: React.PropsWithChildren) => <ul>{children}</ul>,
  SidebarMenuButton: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { isActive, asChild, tooltip, ...rest } = props;
    return <button {...rest}>{children}</button>;
  },
  SidebarMenuItem: ({ children }: React.PropsWithChildren) => <li>{children}</li>,
  SidebarRail: () => null,
  SidebarGroup: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  useSidebar: () => ({ isMobile: false, state: "expanded" }),
}));

// Mock avatar primitives
vi.mock("@student-helper/ui/web/primitives/avatar", () => ({
  Avatar: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  // eslint-disable-next-line @next/next/no-img-element
  AvatarImage: ({ alt }: { alt?: string; src?: string }) => alt ? <img alt={alt} /> : null,
  AvatarFallback: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
}));

// Mock dropdown-menu
vi.mock("@student-helper/ui/web/primitives/dropdown-menu", () => ({
  DropdownMenu: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuGroup: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    asChild,
    onSelect,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>>) => {
    if (asChild) return <div>{children}</div>;

    return (
      <button
        type="button"
        onClick={(event) => {
          if (typeof onSelect === "function") {
            onSelect(event);
          }
        }}
        {...props}
      >
        {children}
      </button>
    );
  },
  DropdownMenuLabel: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

vi.mock("@/shared/auth/auth-client", () => ({
  signOut: signOutMock,
}));

vi.mock("@/shared/settings", () => ({
  useSettingsDialog: () => settingsDialogMock,
}));

import { AppSidebar } from "./AppSidebar";

const testUser = {
  id: "1",
  name: "John Doe",
  email: "john@example.com",
  image: null,
};

describe("AppSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signOutMock.mockResolvedValue({ error: null });
  });

  it("signs out and redirects to login", async () => {
    render(<AppSidebar user={testUser} />);

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledTimes(1);
    });
    expect(routerPushMock).toHaveBeenCalledWith("/auth/login");
    expect(routerRefreshMock).toHaveBeenCalledTimes(1);
  });

  it("renders app name in the header", () => {
    render(<AppSidebar user={testUser} />);
    expect(screen.getByText("Student Helper")).toBeInTheDocument();
  });

  it("renders all navigation items", () => {
    render(<AppSidebar user={testUser} />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Chat")).toBeInTheDocument();
    expect(screen.getByText("Textbooks")).toBeInTheDocument();
    expect(screen.getByText("AI Tutor")).toBeInTheDocument();
    expect(screen.getByText("Uploads")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders user info in the footer", () => {
    render(<AppSidebar user={testUser} />);
    expect(screen.getAllByText("John Doe").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("john@example.com").length).toBeGreaterThanOrEqual(1);
  });

  it("renders user initials fallback", () => {
    render(<AppSidebar user={testUser} />);
    expect(screen.getAllByText("JD").length).toBeGreaterThanOrEqual(1);
  });
});
