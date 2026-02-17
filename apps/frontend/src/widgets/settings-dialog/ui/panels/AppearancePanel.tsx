"use client";

import { ThemeToggle } from "@/features/toggle-theme";
import { SettingsRow } from "../SettingsRow";

export function AppearancePanel() {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Customize how the app looks and feels.
      </p>
      <SettingsRow
        title="Theme"
        description="Choose between light, dark, or system theme."
      >
        <ThemeToggle />
      </SettingsRow>
    </div>
  );
}
