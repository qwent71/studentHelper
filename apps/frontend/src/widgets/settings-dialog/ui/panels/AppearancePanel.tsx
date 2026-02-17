"use client";

import { ThemeToggle } from "@/features/toggle-theme";

export function AppearancePanel() {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Customize how the app looks and feels.
      </p>
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="text-sm font-medium">Theme</p>
          <p className="text-muted-foreground text-xs">
            Choose between light, dark, or system theme.
          </p>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}
