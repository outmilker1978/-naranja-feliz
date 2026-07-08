import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, level } = await req.json();
  if (!userId || !level) return NextResponse.json({ error: "Missing userId or level" }, { status: 400 });

  // Check teacher role
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  const metaRole = user.user_metadata?.role;
  if (!(profile?.role === "teacher" || metaRole === "teacher")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const svc = createServiceClient();
  const { error } = await svc
    .from("profiles")
    .update({ language_level: level, language_level_confirmed_by: user.id })
    .eq("id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify student
  const teacherName = profile?.full_name || user.user_metadata?.full_name || "Учитель";
  await svc.from("notifications").insert({
    user_id: userId,
    actor_id: user.id,
    title: `✓ Уровень подтверждён — ${level}`,
    body: `${teacherName} подтвердил твой уровень испанского: ${level}`,
    link: `/settings`,
  });

  return NextResponse.json({ ok: true });
}
