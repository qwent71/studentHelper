import { ThemeToggle } from "@/features/toggle-theme";

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      <span className="text-lg font-semibold tracking-tight">
        Student Helper
      </span>
      <ThemeToggle />
    </header>
  );
}
