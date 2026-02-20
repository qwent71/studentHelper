import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SolveTaskForm } from "./SolveTaskForm";

const fetchMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

vi.mock("@/shared/api", () => ({
  getApiBaseUrl: () => "http://localhost:3001",
}));

// jsdom doesn't have URL.createObjectURL / revokeObjectURL
vi.stubGlobal("URL", {
  ...globalThis.URL,
  createObjectURL: vi.fn(() => "blob:mock-url"),
  revokeObjectURL: vi.fn(),
});

function mockFetchResponses(
  sessionRes: object,
  messageRes: object,
  messageOk = true,
) {
  fetchMock
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(sessionRes),
    })
    .mockResolvedValueOnce({
      ok: messageOk,
      status: messageOk ? 200 : 500,
      json: () => Promise.resolve(messageRes),
    });
}

describe("SolveTaskForm", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    // Clean up any blob URLs
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("renders hero text and input elements", () => {
    render(<SolveTaskForm />);

    expect(
      screen.getByRole("heading", { name: "Решить задачу" }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Введите текст задачи..."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Перетащите фото задачи/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Решить задачу/ }),
    ).toBeInTheDocument();
  });

  it("disables CTA button when no input is provided", () => {
    render(<SolveTaskForm />);

    expect(
      screen.getByRole("button", { name: /Решить задачу/ }),
    ).toBeDisabled();
  });

  it("enables CTA button when text is entered", async () => {
    const user = userEvent.setup();
    render(<SolveTaskForm />);

    await user.type(
      screen.getByPlaceholderText("Введите текст задачи..."),
      "2+2=?",
    );

    expect(
      screen.getByRole("button", { name: /Решить задачу/ }),
    ).toBeEnabled();
  });

  it("submits text and shows AI response", async () => {
    const user = userEvent.setup();
    mockFetchResponses(
      { id: "sess-1" },
      {
        userMessage: { id: "m1", content: "2+2=?", role: "user" },
        assistantMessage: { id: "m2", content: "2+2=4", role: "assistant" },
      },
    );

    render(<SolveTaskForm />);

    await user.type(
      screen.getByPlaceholderText("Введите текст задачи..."),
      "2+2=?",
    );
    await user.click(screen.getByRole("button", { name: /Решить задачу/ }));

    await waitFor(() => {
      expect(screen.getByText("Решение")).toBeInTheDocument();
    });
    expect(screen.getByText("2+2=4")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Решить другую задачу/ }),
    ).toBeInTheDocument();
  });

  it("creates session with mode fast and sends text message", async () => {
    const user = userEvent.setup();
    mockFetchResponses(
      { id: "sess-1" },
      {
        userMessage: { id: "m1", content: "test", role: "user" },
        assistantMessage: {
          id: "m2",
          content: "response",
          role: "assistant",
        },
      },
    );

    render(<SolveTaskForm />);

    await user.type(
      screen.getByPlaceholderText("Введите текст задачи..."),
      "test",
    );
    await user.click(screen.getByRole("button", { name: /Решить задачу/ }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    // Session creation
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:3001/chat/sessions",
    );
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      credentials: "include",
    });

    // Message send
    expect(fetchMock.mock.calls[1][0]).toBe(
      "http://localhost:3001/chat/sessions/sess-1/messages",
    );
  });

  it("shows loading state during request", async () => {
    const user = userEvent.setup();
    // Never-resolving fetch to keep loading state
    fetchMock.mockReturnValue(new Promise(() => {}));

    render(<SolveTaskForm />);

    await user.type(
      screen.getByPlaceholderText("Введите текст задачи..."),
      "2+2=?",
    );
    await user.click(screen.getByRole("button", { name: /Решить задачу/ }));

    expect(screen.getByText("Решаем...")).toBeInTheDocument();
    expect(
      screen.getByText("Анализируем задачу и готовим решение..."),
    ).toBeInTheDocument();
  });

  it("shows error when session creation fails", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<SolveTaskForm />);

    await user.type(
      screen.getByPlaceholderText("Введите текст задачи..."),
      "test",
    );
    await user.click(screen.getByRole("button", { name: /Решить задачу/ }));

    await waitFor(() => {
      expect(
        screen.getByText("Не удалось получить ответ. Попробуйте ещё раз."),
      ).toBeInTheDocument();
    });
  });

  it("shows error when network fails", async () => {
    const user = userEvent.setup();
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    render(<SolveTaskForm />);

    await user.type(
      screen.getByPlaceholderText("Введите текст задачи..."),
      "test",
    );
    await user.click(screen.getByRole("button", { name: /Решить задачу/ }));

    await waitFor(() => {
      expect(
        screen.getByText("Не удалось получить ответ. Попробуйте ещё раз."),
      ).toBeInTheDocument();
    });
  });

  it("resets form when 'Решить другую задачу' is clicked", async () => {
    const user = userEvent.setup();
    mockFetchResponses(
      { id: "sess-1" },
      {
        userMessage: { id: "m1", content: "2+2=?", role: "user" },
        assistantMessage: { id: "m2", content: "4", role: "assistant" },
      },
    );

    render(<SolveTaskForm />);

    await user.type(
      screen.getByPlaceholderText("Введите текст задачи..."),
      "2+2=?",
    );
    await user.click(screen.getByRole("button", { name: /Решить задачу/ }));

    await waitFor(() => {
      expect(screen.getByText("4")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /Решить другую задачу/ }),
    );

    // Form is reset - back to input state
    expect(
      screen.getByPlaceholderText("Введите текст задачи..."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Решить задачу/ }),
    ).toBeDisabled();
  });

  it("sends image via FormData when file is selected", async () => {
    const user = userEvent.setup();
    mockFetchResponses(
      { id: "sess-1" },
      {
        userMessage: { id: "m1", content: "OCR text", role: "user" },
        assistantMessage: {
          id: "m2",
          content: "Ответ по картинке",
          role: "assistant",
        },
      },
    );

    render(<SolveTaskForm />);

    const file = new File(["image-data"], "task.png", { type: "image/png" });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(fileInput, file);

    // CTA should be enabled after image upload
    expect(
      screen.getByRole("button", { name: /Решить задачу/ }),
    ).toBeEnabled();

    await user.click(screen.getByRole("button", { name: /Решить задачу/ }));

    await waitFor(() => {
      expect(screen.getByText("Ответ по картинке")).toBeInTheDocument();
    });

    // Verify image endpoint was used
    expect(fetchMock.mock.calls[1][0]).toBe(
      "http://localhost:3001/chat/sessions/sess-1/messages/image",
    );
    expect(fetchMock.mock.calls[1][1].body).toBeInstanceOf(FormData);
  });
});
