import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  BrainCircuit,
  Upload,
  Settings,
} from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  action?: "open-settings";
}

export const mainNavItems: NavItem[] = [
  { title: "Главная", url: "/app", icon: LayoutDashboard },
  { title: "Чат", url: "/app/chat", icon: MessageSquare },
  { title: "Учебники", url: "/app/textbooks", icon: BookOpen },
  { title: "ИИ-репетитор", url: "/app/tutor", icon: BrainCircuit },
  { title: "Загрузки", url: "/app/uploads", icon: Upload },
  { title: "Настройки", url: "/app/settings", icon: Settings, action: "open-settings" },
];
