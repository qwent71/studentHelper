"use client";

import { Globe } from "lucide-react";
import { SettingsPanelEmptyState } from "./SettingsPanelEmptyState";

export function LanguagePanel() {
  return (
    <div className="space-y-5 md:space-y-4">
      <p className="text-muted-foreground text-base md:text-sm">
        Настройте язык и региональные параметры.
      </p>
      <SettingsPanelEmptyState
        icon={Globe}
        title="Настройки языка и региона временно недоступны"
        description="Откройте помощь, чтобы проверить доступные параметры."
      />
    </div>
  );
}
