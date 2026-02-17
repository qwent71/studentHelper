import type { LucideIcon } from "lucide-react";
import { Bell, Globe, Paintbrush, Shield, User } from "lucide-react";

export interface SettingsCategory {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const settingsCategories: SettingsCategory[] = [
  {
    id: "account",
    label: "Account",
    icon: User,
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: Paintbrush,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
  },
  {
    id: "language",
    label: "Language & Region",
    icon: Globe,
  },
  {
    id: "privacy",
    label: "Privacy",
    icon: Shield,
  },
];
