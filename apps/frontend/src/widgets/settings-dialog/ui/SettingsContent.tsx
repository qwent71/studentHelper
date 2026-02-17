"use client";

import { ChevronRight } from "lucide-react";
import { useSettingsDialog } from "@/shared/settings";
import {
  settingsCategories,
  type SettingsCategory,
} from "../model/settings-navigation";
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

function SubPageList({ category }: { category: SettingsCategory }) {
  const { selectSubPage } = useSettingsDialog();

  if (!category.subPages) return null;

  return (
    <div className="space-y-1">
      {category.subPages.map((subPage) => (
        <button
          key={subPage.id}
          type="button"
          onClick={() => selectSubPage(subPage.id)}
          className="hover:bg-accent flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors"
        >
          {subPage.label}
          <ChevronRight className="text-muted-foreground size-4" />
        </button>
      ))}
    </div>
  );
}

export function SettingsContent() {
  const { nav } = useSettingsDialog();

  const category = settingsCategories.find((c) => c.id === nav.categoryId);
  if (!category) return null;

  // If category has subPages and none selected, show the sub-page list
  if (category.subPages && !nav.subPageId) {
    return <SubPageList category={category} />;
  }

  const Panel = panelMap[category.id];
  if (!Panel) return null;

  return <Panel />;
}
