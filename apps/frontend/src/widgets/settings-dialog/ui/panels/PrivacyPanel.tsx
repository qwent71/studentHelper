"use client";

import { Shield } from "lucide-react";
import { SettingsPanelEmptyState } from "./SettingsPanelEmptyState";

export function PrivacyPanel() {
  return (
    <div className="space-y-5 md:space-y-4">
      <p className="text-muted-foreground text-base md:text-sm">
        Управление настройками конфиденциальности и данных.
      </p>
      <SettingsPanelEmptyState
        icon={Shield}
        title="Настройки конфиденциальности временно недоступны"
        description="Откройте помощь, чтобы узнать, как управлять данными."
      />
    </div>
  );
}
