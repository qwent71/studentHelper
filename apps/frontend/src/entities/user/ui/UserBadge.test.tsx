import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserBadge } from "./UserBadge";

describe("UserBadge", () => {
  it("renders initials when user image is missing", () => {
    render(<UserBadge user={{ name: "Alice Brown", image: null }} />);

    expect(screen.getByText("AB")).toBeInTheDocument();
    expect(screen.getByText("Alice Brown")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Alice Brown" })).not.toBeInTheDocument();
  });

  it("renders avatar image when image is provided", () => {
    render(<UserBadge user={{ name: "Alice Brown", image: "/avatar.png" }} />);

    const avatar = screen.getByRole("img", { name: "Alice Brown" });
    expect(avatar).toHaveAttribute("src", "/avatar.png");
    expect(screen.queryByText("AB")).not.toBeInTheDocument();
  });
});
