import {
  BookOpen,
  Sigma,
  CircuitBoard,
  Cpu,
  Code2,
  Network,
  Database,
  Binary,
  Wrench,
  ClipboardList,
  Calculator,
  type LucideIcon,
} from "lucide-react";

// subjects.icon is a free-slot text column (seeded NULL today, curatable
// later via a plain UPDATE) — this map is intentionally small and falls
// back to a generic icon rather than requiring every subject to have one.
const ICON_MAP: Record<string, LucideIcon> = {
  sigma: Sigma,
  "circuit-board": CircuitBoard,
  cpu: Cpu,
  code: Code2,
  network: Network,
  database: Database,
  binary: Binary,
  wrench: Wrench,
  "clipboard-list": ClipboardList,
  calculator: Calculator,
};

export function SubjectIcon({ icon, className }: { icon: string | null; className?: string }) {
  const Icon = (icon && ICON_MAP[icon]) || BookOpen;
  return <Icon className={className} />;
}
