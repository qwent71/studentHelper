import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { settingsDialogMock } = vi.hoisted(() => ({
  settingsDialogMock: {
    open: false,
    setOpen: vi.fn(),
    categoryId: "account",
    mobileView: "list" as const,
    openToCategory: vi.fn(),
    selectCategory: vi.fn(),
    goBack: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
  }: React.PropsWithChildren<{
    href: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  }>) => (
    <a
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </a>
  ),
}));

vi.mock("@student-helper/ui/web/primitives/sidebar", () => ({
  SidebarGroup: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  SidebarGroupLabel: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  SidebarMenu: ({ children }: React.PropsWithChildren) => (
    <ul>{children}</ul>
  ),
  SidebarMenuButton: ({
    children,
    isActive,
  }: React.PropsWithChildren<{
    isActive?: boolean;
    asChild?: boolean;
    tooltip?: string;
  }>) => (
    <li data-active={isActive}>
      {children}
    </li>
  ),
  SidebarMenuItem: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/shared/settings", () => ({
  useSettingsDialog: () => settingsDialogMock,
}));

let currentPathname = "/app";

import { NavMain } from "./NavMain";
import { mainNavItems } from "../model/navigation";

describe("NavMain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentPathname = "/app";
  });

  it("renders all nav items", () => {
    render(<NavMain items={mainNavItems} />);
    expect(screen.getByText("Главная")).toBeInTheDocument();
    expect(screen.getByText("Чат")).toBeInTheDocument();
    expect(screen.getByText("Учебники")).toBeInTheDocument();
    expect(screen.getByText("ИИ-репетитор")).toBeInTheDocument();
    expect(screen.getByText("Загрузки")).toBeInTheDocument();
    expect(screen.getByText("Настройки")).toBeInTheDocument();
  });

  it("renders correct href on each link", () => {
    render(<NavMain items={mainNavItems} />);
    expect(screen.getByText("Главная").closest("a")).toHaveAttribute(
      "href",
      "/app",
    );
    expect(screen.getByText("Чат").closest("a")).toHaveAttribute(
      "href",
      "/app/chat",
    );
    expect(screen.getByText("Настройки").closest("a")).toHaveAttribute(
      "href",
      "/app/settings",
    );
  });

  it("marks Dashboard active on exact /app match", () => {
    currentPathname = "/app";
    render(<NavMain items={mainNavItems} />);
    const dashboardItem = screen.getByText("Главная").closest("[data-active]");
    expect(dashboardItem).toHaveAttribute("data-active", "true");
  });

  it("marks Chat active on /app/chat, not Dashboard", () => {
    currentPathname = "/app/chat";
    render(<NavMain items={mainNavItems} />);
    const dashboardItem = screen.getByText("Главная").closest("[data-active]");
    expect(dashboardItem).toHaveAttribute("data-active", "false");

    const chatItem = screen.getByText("Чат").closest("[data-active]");
    expect(chatItem).toHaveAttribute("data-active", "true");
  });

  it("marks Chat active on /app/chat/123 (startsWith)", () => {
    currentPathname = "/app/chat/123";
    render(<NavMain items={mainNavItems} />);
    const chatItem = screen.getByText("Чат").closest("[data-active]");
    expect(chatItem).toHaveAttribute("data-active", "true");
  });

  it("Settings click prevents default and calls setOpen(true)", () => {
    render(<NavMain items={mainNavItems} />);
    const settingsLink = screen.getByText("Настройки").closest("a")!;
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      button: 0,
    });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    fireEvent(settingsLink, event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(settingsDialogMock.setOpen).toHaveBeenCalledWith(true);
  });

  it("Settings click does NOT intercept when metaKey pressed", () => {
    render(<NavMain items={mainNavItems} />);
    const settingsLink = screen.getByText("Настройки").closest("a")!;
    fireEvent.click(settingsLink, { metaKey: true });
    expect(settingsDialogMock.setOpen).not.toHaveBeenCalled();
  });

  it("Settings click does NOT intercept when ctrlKey pressed", () => {
    render(<NavMain items={mainNavItems} />);
    const settingsLink = screen.getByText("Настройки").closest("a")!;
    fireEvent.click(settingsLink, { ctrlKey: true });
    expect(settingsDialogMock.setOpen).not.toHaveBeenCalled();
  });

  it("Settings click does NOT intercept when shiftKey pressed", () => {
    render(<NavMain items={mainNavItems} />);
    const settingsLink = screen.getByText("Настройки").closest("a")!;
    fireEvent.click(settingsLink, { shiftKey: true });
    expect(settingsDialogMock.setOpen).not.toHaveBeenCalled();
  });

  it("Settings click does NOT intercept when altKey pressed", () => {
    render(<NavMain items={mainNavItems} />);
    const settingsLink = screen.getByText("Настройки").closest("a")!;
    fireEvent.click(settingsLink, { altKey: true });
    expect(settingsDialogMock.setOpen).not.toHaveBeenCalled();
  });

  it("regular nav link click does NOT call setOpen", () => {
    render(<NavMain items={mainNavItems} />);
    const chatLink = screen.getByText("Чат").closest("a")!;
    fireEvent.click(chatLink);
    expect(settingsDialogMock.setOpen).not.toHaveBeenCalled();
  });
});
