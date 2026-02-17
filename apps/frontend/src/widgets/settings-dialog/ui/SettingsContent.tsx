"use client";

import { useSettingsDialog } from "@/shared/settings";
import { AccountPanel } from "./panels/AccountPanel";
import { AppearancePanel } from "./panels/AppearancePanel";
import { NotificationsPanel } from "./panels/NotificationsPanel";
import { LanguagePanel } from "./panels/LanguagePanel";
import { PrivacyPanel } from "./panels/PrivacyPanel";

const panelMap: Record<string, React.ComponentType> = {
  account: AccountPanel,
  appearance: AppearancePanel,
  notifications: NotificationsPanel,
  language: LanguagePanel,
  privacy: PrivacyPanel,
};

export function SettingsContent() {
  const { categoryId } = useSettingsDialog();

  const Panel = panelMap[categoryId];
  if (!Panel) return null;

  return <Panel />;
}
