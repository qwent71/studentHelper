import type { LucideIcon } from "lucide-react";

export interface SidebarUser {
  name: string;
  email: string;
  avatar: string;
  initials: string;
}

export interface SidebarNavSubItem {
  title: string;
  url: string;
}

export interface SidebarNavMainItem {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
  items?: SidebarNavSubItem[];
}

export interface SidebarNavSecondaryItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface SidebarProjectItem {
  name: string;
  url: string;
  icon: LucideIcon;
}

export interface SidebarNavigationData {
  user: SidebarUser;
  navMain: SidebarNavMainItem[];
  navSecondary: SidebarNavSecondaryItem[];
  projects: SidebarProjectItem[];
}
