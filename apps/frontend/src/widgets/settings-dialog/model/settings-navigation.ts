import type { LucideIcon } from "lucide-react";
import { Bell, Globe, Paintbrush, Shield, User } from "lucide-react";

export interface SettingsSubPage {
  id: string;
  label: string;
}

export interface SettingsCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  subPages?: SettingsSubPage[];
}

export const settingsCategories: SettingsCategory[] = [
  {
    id: "account",
    label: "Account",
    icon: User,
    subPages: [
      { id: "profile", label: "Profile" },
      { id: "password", label: "Password" },
    ],
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: Paintbrush,
    subPages: [{ id: "theme", label: "Theme" }],
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    subPages: [
      { id: "email", label: "Email" },
      { id: "push", label: "Push" },
      { id: "quiet-hours", label: "Quiet Hours" },
    ],
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
