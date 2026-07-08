import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
        subscriptionRequestedAt={subscriptionRequestedAt}
      />
    </div>
  );
}
