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
    label: "Аккаунт",
    icon: User,
  },
  {
    id: "appearance",
    label: "Внешний вид",
    icon: Paintbrush,
  },
  {
    id: "notifications",
    label: "Уведомления",
    icon: Bell,
  },
  {
    id: "language",
    label: "Язык и регион",
    icon: Globe,
  },
  {
    id: "privacy",
    label: "Конфиденциальность",
    icon: Shield,
  },
];
