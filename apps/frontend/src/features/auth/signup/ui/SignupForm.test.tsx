import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignupForm } from "./SignupForm";

const { pushMock, signUpEmailMock } = vi.hoisted(() => {
  return {
    pushMock: vi.fn(),
    signUpEmailMock: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/shared/auth/auth-client", () => ({
  signUp: {
    email: (data: unknown) => signUpEmailMock(data),
  },
}));

describe("SignupForm", () => {
  beforeEach(() => {
    pushMock.mockReset();
    signUpEmailMock.mockReset();
    signUpEmailMock.mockResolvedValue({ error: null });
  });

  it("submits form and redirects to /app on successful sign up", async () => {
    const user = userEvent.setup();

    render(<SignupForm />);

    await user.type(screen.getByLabelText("Имя"), "Alice");
    await user.type(screen.getByLabelText("Эл. почта"), "alice@example.com");
    await user.type(screen.getByLabelText("Пароль"), "securePassword123");
    await user.click(screen.getByRole("button", { name: "Зарегистрироваться" }));

    expect(signUpEmailMock).toHaveBeenCalledWith({
      name: "Alice",
      email: "alice@example.com",
      password: "securePassword123",
    });
    expect(pushMock).toHaveBeenCalledWith("/app");
  });

  it("shows API error and does not redirect when sign up fails", async () => {
    const user = userEvent.setup();
    signUpEmailMock.mockResolvedValue({
      error: { message: "Email already exists" },
    });

    render(<SignupForm />);

    await user.type(screen.getByLabelText("Имя"), "Alice");
    await user.type(screen.getByLabelText("Эл. почта"), "alice@example.com");
    await user.type(screen.getByLabelText("Пароль"), "securePassword123");
    await user.click(screen.getByRole("button", { name: "Зарегистрироваться" }));

    expect(await screen.findByText("Email already exists")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
