import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getDirectorId } from "@/lib/director";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { courseId } = await req.json();
  if (!courseId) return NextResponse.json({ error: "Missing courseId" }, { status: 400 });

  const svc = createServiceClient();

  const { data: course } = await svc.from("courses").select("title").eq("id", courseId).single();
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const { data: profile } = await svc.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role === "admin") {
    await svc.from("course_access").upsert({
      student_id: user.id,
      course_id: courseId,
      granted_by: user.id,
      granted_at: new Date().toISOString(),
      expires_at: null,
      reason: "admin_auto",
    }, { onConflict: "student_id, course_id" });
    await svc.from("enrollments").upsert({
      student_id: user.id,
      course_id: courseId,
      paid: true,
    }, { onConflict: "student_id, course_id" });
    return NextResponse.json({ ok: true, autoGranted: true });
  }

  const directorId = await getDirectorId();
  const studentName = user.user_metadata?.full_name || user.email || "Студент";

  const notifyUserIds = directorId ? [directorId] : [];

  if (!notifyUserIds.length) {
    const { data: teachers } = await svc.from("profiles").select("id").in("role", ["teacher", "admin"]);
    notifyUserIds.push(...(teachers ?? []).map(t => t.id));
  }

  for (const teacherId of notifyUserIds) {
    await svc.from("notifications").insert({
      user_id: teacherId,
      actor_id: user.id,
      title: `🔔 Запрос доступа к курсу`,
      body: `${studentName} запросил доступ к курсу «${course.title}»`,
      link: `/admin/teachers?studentId=${user.id}&courseId=${courseId}`,
    });
  }

  return NextResponse.json({ ok: true });
}
