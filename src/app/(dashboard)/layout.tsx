import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";

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

  const svc = createServiceClient();

  // Subscription expiry notifications
  const { data: profile } = await svc.from("profiles")
    .select("role, subscription_until")
    .eq("id", user.id)
    .maybeSingle();

  const dbRole = profile?.role;
  const metaRole = user.user_metadata?.role ?? "student";
  const isElevated = dbRole === "teacher" || dbRole === "admin" || metaRole === "teacher" || metaRole === "admin";
  const realRole = isElevated ? (dbRole === "admin" || metaRole === "admin" ? "admin" : "teacher") : "student";

  const subUntil = profile?.subscription_until;
  if (subUntil && realRole !== "teacher" && realRole !== "admin") {
    const daysLeft = Math.ceil((new Date(subUntil).getTime() - Date.now()) / 86400000);
    const isActive = daysLeft > 0;
    const { data: existingNotifs } = await svc
      .from("notifications")
      .select("id, title")
      .eq("user_id", user.id)
      .or(`title.eq.Подписка скоро закончится,title.eq.Подписка закончилась`)
      .limit(1);

    if (isActive && daysLeft <= 3 && !existingNotifs?.some(n => n.title === "Подписка скоро закончится")) {
      await svc.from("notifications").insert({
        user_id: user.id,
        title: "Подписка скоро закончится",
        body: `Осталось ${daysLeft} ${daysLeft === 1 ? "день" : daysLeft < 5 ? "дня" : "дней"}. Продли доступ в настройках.`,
        link: "/settings",
      });
    } else if (!isActive && !existingNotifs?.some(n => n.title === "Подписка закончилась")) {
      await svc.from("notifications").insert({
        user_id: user.id,
        title: "Подписка закончилась",
        body: "Доступ к урокам закрыт. Продли подписку в настройках.",
        link: "/settings",
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-10">
        {children}
      </main>
    </div>
  );
}
