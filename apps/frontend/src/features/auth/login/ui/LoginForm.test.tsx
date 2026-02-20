import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./LoginForm";

const { pushMock, signInEmailMock, signInMagicLinkMock, signInSocialMock } =
  vi.hoisted(() => {
    return {
      pushMock: vi.fn(),
      signInEmailMock: vi.fn(),
      signInMagicLinkMock: vi.fn(),
      signInSocialMock: vi.fn(),
    };
  });

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => ({
    get: (key: string) => (key === "callbackUrl" ? null : null),
  }),
}));

vi.mock("@/shared/auth/auth-client", () => ({
  signIn: {
    email: (data: unknown) => signInEmailMock(data),
    magicLink: (data: unknown) => signInMagicLinkMock(data),
    social: (data: unknown) => signInSocialMock(data),
  },
}));

describe("LoginForm", () => {
  beforeEach(() => {
    pushMock.mockReset();
    signInEmailMock.mockReset();
    signInMagicLinkMock.mockReset();
    signInSocialMock.mockReset();
    signInEmailMock.mockResolvedValue({ error: null });
    signInMagicLinkMock.mockResolvedValue({ error: null });
    signInSocialMock.mockResolvedValue({ error: null });
  });

  it("submits password login and redirects to /app on success", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    // Switch to password tab
    await user.click(screen.getByRole("tab", { name: "Пароль" }));

    // Use selector: "input" to disambiguate from tab panel's aria-labelledby
    await user.type(screen.getByLabelText("Эл. почта", { selector: "input" }), "test@example.com");
    await user.type(screen.getByLabelText("Пароль", { selector: "input" }), "securePassword123");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    expect(signInEmailMock).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "securePassword123",
    });
    expect(pushMock).toHaveBeenCalledWith("/app");
  });

  it("submits magic link and redirects to confirmation page", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    // Magic link tab is default
    const emailInput = screen.getByLabelText("Эл. почта");
    await user.type(emailInput, "test@example.com");
    await user.click(
      screen.getByRole("button", { name: "Отправить ссылку для входа" }),
    );

    expect(signInMagicLinkMock).toHaveBeenCalledWith({
      email: "test@example.com",
      callbackURL: "/app",
    });
    expect(pushMock).toHaveBeenCalledWith(
      "/auth/magic-link-sent?email=test%40example.com",
    );
  });

  it("calls signIn.social with Google provider on Google button click", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(
      screen.getByRole("button", { name: /Войти через Google/i }),
    );

    expect(signInSocialMock).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/app",
      errorCallbackURL: "/auth/login",
    });
  });

  it("shows error message when password login fails", async () => {
    const user = userEvent.setup();
    signInEmailMock.mockResolvedValue({
      error: { message: "Неверный пароль" },
    });

    render(<LoginForm />);

    await user.click(screen.getByRole("tab", { name: "Пароль" }));
    await user.type(screen.getByLabelText("Эл. почта", { selector: "input" }), "test@example.com");
    await user.type(screen.getByLabelText("Пароль", { selector: "input" }), "wrong");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    expect(await screen.findByText("Неверный пароль")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows error message when magic link fails", async () => {
    const user = userEvent.setup();
    signInMagicLinkMock.mockResolvedValue({
      error: { message: "Не удалось отправить" },
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText("Эл. почта");
    await user.type(emailInput, "test@example.com");
    await user.click(
      screen.getByRole("button", { name: "Отправить ссылку для входа" }),
    );

    expect(await screen.findByText("Не удалось отправить")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("disables Google button while loading", async () => {
    const user = userEvent.setup();
    // Make signIn.social hang
    signInSocialMock.mockReturnValue(new Promise(() => {}));

    render(<LoginForm />);

    const googleButton = screen.getByRole("button", {
      name: /Войти через Google/i,
    });
    await user.click(googleButton);

    expect(
      screen.getByRole("button", { name: /Перенаправление/i }),
    ).toBeDisabled();
  });
});
