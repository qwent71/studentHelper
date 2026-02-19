import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ThemeToggle,
  getThemeSelectValue,
} from "./ThemeToggle";

const { setThemeMock, themeState } = vi.hoisted(() => ({
  setThemeMock: vi.fn(),
  themeState: {
    theme: "light" as string | undefined,
    resolvedTheme: "light" as string | undefined,
  },
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: themeState.theme,
    resolvedTheme: themeState.resolvedTheme,
    setTheme: setThemeMock,
  }),
}));

vi.mock("@student-helper/ui/web/primitives/skeleton", () => ({
  Skeleton: () => <div data-testid="theme-skeleton">loading</div>,
}));

vi.mock("@student-helper/ui/web/primitives/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: React.PropsWithChildren<{
    value: string;
    onValueChange: (value: string) => void;
  }>) => (
    <select
      aria-label="Тема"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: React.PropsWithChildren) => (
    <>{children}</>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <option value="" disabled>
      {placeholder}
    </option>
  ),
  SelectContent: ({ children }: React.PropsWithChildren) => (
    <>{children}</>
  ),
  SelectItem: ({
    value,
  }: React.PropsWithChildren<{ value: string }>) => {
    const labelMap: Record<string, string> = {
      light: "Светлая",
      dark: "Тёмная",
      system: "Системная",
    };

    return <option value={value}>{labelMap[value] ?? value}</option>;
  },
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    themeState.theme = "light";
    themeState.resolvedTheme = "light";
  });

  it("renders Светлая when theme=light", async () => {
    render(<ThemeToggle />);
    const select = await screen.findByRole("combobox", { name: "Тема" });

    expect(select).toHaveDisplayValue("Светлая");
  });

  it("renders Тёмная when theme=dark", async () => {
    themeState.theme = "dark";
    themeState.resolvedTheme = "dark";

    render(<ThemeToggle />);
    const select = await screen.findByRole("combobox", { name: "Тема" });

    expect(select).toHaveDisplayValue("Тёмная");
  });

  it("renders Системная when theme=system", async () => {
    themeState.theme = "system";
    themeState.resolvedTheme = "dark";

    render(<ThemeToggle />);
    const select = await screen.findByRole("combobox", { name: "Тема" });

    expect(select).toHaveDisplayValue("Системная");
  });

  it("falls back to resolvedTheme when theme is undefined", async () => {
    themeState.theme = undefined;
    themeState.resolvedTheme = "dark";

    render(<ThemeToggle />);
    const select = await screen.findByRole("combobox", { name: "Тема" });

    expect(select).toHaveDisplayValue("Тёмная");
    expect(select).not.toHaveDisplayValue("Светлая");
  });

  it("calls setTheme on select change", async () => {
    const user = userEvent.setup();

    render(<ThemeToggle />);
    const select = await screen.findByRole("combobox", { name: "Тема" });

    await user.selectOptions(select, "dark");

    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });
});

describe("getThemeSelectValue", () => {
  it("returns current theme when it is valid", () => {
    expect(getThemeSelectValue("dark", "light")).toBe("dark");
  });

  it("returns resolvedTheme when theme is invalid", () => {
    expect(getThemeSelectValue(undefined, "light")).toBe("light");
  });

  it("falls back to system when both values are invalid", () => {
    expect(getThemeSelectValue(undefined, undefined)).toBe("system");
  });
});
