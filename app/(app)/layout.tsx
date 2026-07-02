import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense in depth: proxy.ts already redirects unauthenticated visitors
  // away from this route group, but a Server Component check is cheap
  // insurance against that ever being bypassed.
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh flex-1">
      <Sidebar />
      <div className="flex flex-1 flex-col lg:pl-28">
        <MobileNav />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
