import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { courseId } = await req.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();

  const { data: course } = await service.from("courses").select("access_mode, created_by").eq("id", courseId).single();
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  if (course.access_mode === "subscription" || course.access_mode === "per_course") {
    const { data: hasAccess } = await service.rpc("check_course_access", { uid: user.id, cid: courseId });
    if (!hasAccess) {
      return NextResponse.json({ error: "Доступ ограничен. Запросите доступ у учителя." }, { status: 403 });
    }
  }

  const { error } = await service.from("enrollments").upsert({
    student_id: user.id,
    course_id: courseId,
    paid: true,
  }, { onConflict: "student_id, course_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}