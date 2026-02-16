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
}

export const mainNavItems: NavItem[] = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "Chat", url: "/app/chat", icon: MessageSquare },
  { title: "Textbooks", url: "/app/textbooks", icon: BookOpen },
  { title: "AI Tutor", url: "/app/tutor", icon: BrainCircuit },
  { title: "Uploads", url: "/app/uploads", icon: Upload },
  { title: "Settings", url: "/app/settings", icon: Settings },
];
