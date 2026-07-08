import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient();

  // Find a teacher to notify (any teacher)
  const { data: teachers } = await svc
    .from("profiles")
    .select("id")
    .eq("role", "teacher")
    .limit(1);

  if (!teachers?.length) return NextResponse.json({ error: "No teachers found" }, { status: 500 });

  const studentName = user.user_metadata?.full_name || user.email || "Студент";
  await svc.from("notifications").insert({
    user_id: teachers[0].id,
    actor_id: user.id,
    title: `🔔 Запрос на продление подписки`,
    body: `${studentName} запросил продление подписки`,
    link: `/admin/teachers`,
  });

  const { error: updateError } = await svc.from("profiles").update({ subscription_requested_at: new Date().toISOString() }).eq("id", user.id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
