import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const metaRole = user.user_metadata?.role;
  if (!(profile?.role === "teacher" || profile?.role === "admin" || metaRole === "teacher" || metaRole === "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("course_access")
    .select("course_id, granted_at, expires_at, reason, courses!inner(title)")
    .eq("student_id", studentId)
    .order("granted_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
