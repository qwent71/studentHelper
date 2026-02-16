import {
  BookOpen,
  Bot,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
} from "lucide-react";
import type { SidebarNavigationData } from "./types";

export const sidebarNavigation: SidebarNavigationData = {
  user: {
    name: "Student Helper",
    email: "student@example.com",
    avatar: "/globe.svg",
    initials: "SH",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/app",
      icon: SquareTerminal,
      isActive: true,
      items: [
        { title: "Overview", url: "/app" },
        { title: "Progress", url: "/app/progress" },
        { title: "Calendar", url: "/app/calendar" },
      ],
    },
    {
      title: "Chat",
      url: "/app/chat",
      icon: Bot,
      items: [
        { title: "History", url: "/app/chat/history" },
        { title: "Saved", url: "/app/chat/starred" },
        { title: "New chat", url: "/app/chat/new" },
      ],
    },
    {
      title: "Materials",
      url: "/app/textbook",
      icon: BookOpen,
      items: [
        { title: "Textbooks", url: "/app/textbook" },
        { title: "Notes", url: "/app/notes" },
        { title: "Tutorials", url: "/app/tutorials" },
      ],
    },
    {
      title: "Settings",
      url: "/app/settings",
      icon: Settings2,
      items: [
        { title: "General", url: "/app/settings" },
        { title: "Team", url: "/app/settings/team" },
        { title: "Billing", url: "/app/settings/billing" },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "/app/support",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "/app/feedback",
      icon: Send,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "/app/projects/design-engineering",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "/app/projects/sales-marketing",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "/app/projects/travel",
      icon: Map,
    },
  ],
};
