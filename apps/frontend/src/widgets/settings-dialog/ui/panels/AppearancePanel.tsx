"use client";

import { ThemeToggle } from "@/features/toggle-theme";
import { SettingsRow } from "../SettingsRow";

export function AppearancePanel() {
  return (
    <div className="space-y-5 md:space-y-4">
      <p className="text-muted-foreground text-base md:text-sm">
        Настройте внешний вид приложения.
      </p>
      <SettingsRow
        title="Тема"
        description="Выберите светлую, тёмную или системную тему."
      >
        <ThemeToggle />
      </SettingsRow>
    </div>
  );
}
