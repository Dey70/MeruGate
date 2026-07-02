import {
  LayoutDashboard,
  ListChecks,
  Users,
  NotebookPen,
  Target,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/planner", label: "Planner", icon: ListChecks },
  { href: "/squad", label: "Squad", icon: Users },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/chat", label: "Ask AI", icon: MessageCircle },
];
