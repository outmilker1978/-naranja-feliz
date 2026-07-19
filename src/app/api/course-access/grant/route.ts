import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const DURATIONS: Record<string, number | null> = {
  "14": 14, "30": 30, "90": 90, "180": 180, "365": 365, "forever": null,
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId, courseIds, duration } = await req.json();
  if (!studentId || !courseIds?.length) {
    return NextResponse.json({ error: "Missing studentId or courseIds" }, { status: 400 });
  }

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  const metaRole = user.user_metadata?.role;
  if (!(profile?.role === "teacher" || profile?.role === "admin" || metaRole === "teacher" || metaRole === "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const days = DURATIONS[duration] ?? 30;
  const svc = createServiceClient();
  const teacherName = profile?.full_name || user.user_metadata?.full_name || "Учитель";
  const errors: string[] = [];

  for (const courseId of courseIds) {
    const expiresAt = days ? new Date(Date.now() + days * 86400000).toISOString() : null;

    const { error: caErr } = await svc.from("course_access").upsert({
      student_id: studentId,
      course_id: courseId,
      granted_by: user.id,
      granted_at: new Date().toISOString(),
      expires_at: expiresAt,
      reason: "manual",
    }, { onConflict: "student_id, course_id" });
    if (caErr) errors.push(`course_access ${courseId}: ${caErr.message}`);

    const { error: enErr } = await svc.from("enrollments").upsert({
      student_id: studentId,
      course_id: courseId,
      paid: true,
    }, { onConflict: "student_id, course_id" });
    if (enErr) errors.push(`enrollment ${courseId}: ${enErr.message}`);
  }

  const courseNames = courseIds.length;
  const { error: notifErr } = await svc.from("notifications").insert({
    user_id: studentId,
    actor_id: user.id,
    title: "✓ Доступ открыт",
    body: `${teacherName} открыл доступ к ${courseNames} ${courseNames === 1 ? "курсу" : "курсам"}. Курсы доступны в списке.`,
    link: "/courses?granted=1",
  });
  if (notifErr) errors.push(`notification: ${notifErr.message}`);

  if (errors.length > 0) {
    return NextResponse.json({ ok: true, warnings: errors });
  }

  return NextResponse.json({ ok: true });
}
