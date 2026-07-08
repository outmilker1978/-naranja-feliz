import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId } = await req.json();
  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 });

  // Only teachers can extend
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  const metaRole = user.user_metadata?.role;
  if (!(profile?.role === "teacher" || metaRole === "teacher")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const svc = createServiceClient();

  // Get current subscription date
  const { data: student } = await svc.from("profiles").select("subscription_until").eq("id", studentId).single();
  const current = student?.subscription_until ? new Date(student.subscription_until) : new Date();
  if (current < new Date()) {
    // If expired, start from now
    current.setTime(Date.now());
  }
  const newUntil = new Date(current.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

  const { error } = await svc.from("profiles").update({ subscription_until: newUntil.toISOString(), subscription_requested_at: null }).eq("id", studentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify student
  const teacherName = profile?.full_name || user.user_metadata?.full_name || "Учитель";
  await svc.from("notifications").insert({
    user_id: studentId,
    actor_id: user.id,
    title: `✓ Подписка продлена`,
    body: `${teacherName} продлил твою подписку до ${newUntil.toLocaleDateString("ru-RU")}`,
    link: `/settings`,
  });

  return NextResponse.json({ ok: true, subscription_until: newUntil.toISOString() });
}
