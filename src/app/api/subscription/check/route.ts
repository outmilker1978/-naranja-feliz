import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ensureSubscriptionReminder } from "@/lib/subscription-reminders";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient();
  const { data: profile } = await svc
    .from("profiles")
    .select("id, email, full_name, role, subscription_until")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role && profile.role !== "student") || !profile.subscription_until) {
    return NextResponse.json({ ok: true, stage: null, created: false });
  }

  const res = await ensureSubscriptionReminder(svc, profile, { emailMode: "only-on-create" });

  return NextResponse.json({
    ok: true,
    stage: res.stage,
    created: res.created,
    emailed: res.emailed,
    emailError: res.emailError ?? null,
  });
}
