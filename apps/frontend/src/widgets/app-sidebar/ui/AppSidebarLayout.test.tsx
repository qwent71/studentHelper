import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AppSidebarLayout } from "./AppSidebarLayout";

describe("AppSidebarLayout", () => {
  it("renders sidebar sections", () => {
    render(
      <AppSidebarLayout>
        <div>content</div>
      </AppSidebarLayout>,
    );

    expect(screen.getByText("Platform")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();
    expect(screen.getByText("Feedback")).toBeInTheDocument();
  });

  it("renders inset header with breadcrumb and page content", () => {
    render(
      <AppSidebarLayout>
        <div>Dashboard content</div>
      </AppSidebarLayout>,
    );

    const breadcrumb = screen.getByRole("navigation", { name: "breadcrumb" });
    expect(
      within(breadcrumb).getByRole("link", { name: "Student Helper" }),
    ).toBeInTheDocument();
    expect(within(breadcrumb).getByText("Dashboard")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Toggle Sidebar" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
  });

  it("collapses sidebar when trigger is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AppSidebarLayout>
        <div>content</div>
      </AppSidebarLayout>,
    );

    const sidebar = container.querySelector<HTMLElement>(
      '[data-slot="sidebar"][data-side="left"]',
    );

    expect(sidebar).not.toBeNull();
    expect(sidebar).toHaveAttribute("data-state", "expanded");

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));

    expect(sidebar).toHaveAttribute("data-state", "collapsed");
  });
});
