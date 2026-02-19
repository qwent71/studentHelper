"use client";

import { Bell } from "lucide-react";
import { SettingsPanelEmptyState } from "./SettingsPanelEmptyState";

export function NotificationsPanel() {
  return (
    <div className="space-y-5 md:space-y-4">
      <p className="text-muted-foreground text-base md:text-sm">
        Настройте, как и когда вы получаете уведомления.
      </p>
      <SettingsPanelEmptyState
        icon={Bell}
        title="Настройки уведомлений временно недоступны"
        description="Откройте помощь, чтобы узнать о текущих возможностях."
      />
    </div>
  );
}
