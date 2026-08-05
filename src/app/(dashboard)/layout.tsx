import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionCheckOnLogin } from "@/components/subscription-check-on-login";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <SubscriptionCheckOnLogin />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-10">
        {children}
      </main>
    </div>
  );
}
