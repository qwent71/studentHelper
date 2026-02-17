"use client";

import { useIsMobile } from "@student-helper/ui/web/hooks/use-mobile";
import { SettingsDialogDesktop } from "./SettingsDialogDesktop";
import { SettingsDialogMobile } from "./SettingsDialogMobile";

export function SettingsDialog() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <SettingsDialogMobile />;
  }

  return <SettingsDialogDesktop />;
}
