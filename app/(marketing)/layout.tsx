import { PageTransition } from "@/components/layout/page-transition";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <PageTransition>{children}</PageTransition>
    </div>
  );
}
