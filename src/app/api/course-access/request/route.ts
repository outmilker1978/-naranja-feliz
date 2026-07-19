import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { courseId } = await req.json();
  if (!courseId) return NextResponse.json({ error: "Missing courseId" }, { status: 400 });

  const svc = createServiceClient();

  const { data: course } = await svc.from("courses").select("title").eq("id", courseId).single();
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const { data: teachers } = await svc.from("profiles").select("id").in("role", ["teacher", "admin"]);
  const studentName = user.user_metadata?.full_name || user.email || "Студент";

  for (const teacher of teachers ?? []) {
    await svc.from("notifications").insert({
      user_id: teacher.id,
      actor_id: user.id,
      title: `🔔 Запрос доступа к курсу`,
      body: `${studentName} запросил доступ к курсу «${course.title}»`,
      link: `/admin/teachers?studentId=${user.id}&courseId=${courseId}`,
    });
  }

  return NextResponse.json({ ok: true });
}
