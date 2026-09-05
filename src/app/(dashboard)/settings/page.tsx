import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-cache";
import { createServiceClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const svc = createServiceClient();
  const { data: raw } = await svc.rpc("get_my_profile", { uid: user.id });
  const profile = (raw as any) ?? {};

  const role = profile?.role || user.user_metadata?.role || "student";
  const userName = profile?.full_name || user.user_metadata?.full_name || user.email!;
  const userAvatar = profile?.avatar_url || user.user_metadata?.avatar_url || null;
  const languageLevel = profile?.language_level ?? null;
  const languageLevelConfirmedBy = profile?.language_level_confirmed_by ?? null;
  const subscriptionUntil = profile?.subscription_until ?? null;
  const subscriptionRequestedAt = profile?.subscription_requested_at ?? null;
  const creditDays = profile?.credit_days ?? 0;

  // Подаренные доступы к конкретным курсам (навсегда или до даты) — отдельно от подписки.
  let courseAccess: { courseTitle: string; expiresAt: string | null }[] = [];
  if (role === "student") {
    const now = new Date().toISOString();
    const { data } = await svc.from("course_access")
      .select("expires_at, courses(title)")
      .eq("student_id", user.id)
      .or(`expires_at.gte.${now},expires_at.is.null`);
    for (const row of (data ?? []) as any[]) {
      courseAccess.push({ courseTitle: row?.courses?.title ?? "Курс", expiresAt: row.expires_at as string | null });
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-accent mb-6">Настройки профиля</h1>

      <SettingsForm
        userId={user.id}
        email={user.email!}
        fullName={userName}
        avatarUrl={userAvatar}
        role={role}
        languageLevel={languageLevel}
        languageLevelConfirmedBy={languageLevelConfirmedBy}
        subscriptionUntil={subscriptionUntil}
        courseAccess={courseAccess}
        subscriptionRequestedAt={subscriptionRequestedAt}
        creditDays={creditDays}
      />
    </div>
  );
}
