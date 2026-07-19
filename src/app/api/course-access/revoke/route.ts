import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId, courseIds } = await req.json();
  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const metaRole = user.user_metadata?.role;
  if (!(profile?.role === "teacher" || profile?.role === "admin" || metaRole === "teacher" || metaRole === "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const svc = createServiceClient();

  if (courseIds?.length) {
    for (const courseId of courseIds) {
      await svc.from("course_access").delete().eq("student_id", studentId).eq("course_id", courseId);
      await svc.from("enrollments").delete().eq("student_id", studentId).eq("course_id", courseId);
    }
  } else {
    await svc.from("course_access").delete().eq("student_id", studentId);
    await svc.from("enrollments").delete().eq("student_id", studentId);
  }

  return NextResponse.json({ ok: true });
}
