import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-cache";
import { SubscriptionCheckOnLogin } from "@/components/subscription-check-on-login";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

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
