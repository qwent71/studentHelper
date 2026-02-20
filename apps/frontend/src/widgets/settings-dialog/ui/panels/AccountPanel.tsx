"use client";

import { User } from "lucide-react";
import { SettingsPanelEmptyState } from "./SettingsPanelEmptyState";

export function AccountPanel() {
  return (
    <div className="space-y-5 md:space-y-4">
      <p className="text-muted-foreground text-base md:text-sm">
        Управление настройками аккаунта и профиля.
      </p>
      <SettingsPanelEmptyState
        icon={User}
        title="Настройки аккаунта временно недоступны"
        description="Откройте помощь, чтобы посмотреть доступные инструкции."
      />
    </div>
  );
}
