import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "Missing courseId" }, { status: 400 });

  const svc = createServiceClient();

  // Course owners always have access
  const { data: course } = await svc.from("courses").select("created_by").eq("id", courseId).single();
  if (course?.created_by === user.id) {
    return NextResponse.json({ hasAccess: true });
  }

  // Check via RPC
  const { data: hasAccess } = await svc.rpc("check_course_access", { uid: user.id, cid: courseId });

  return NextResponse.json({ hasAccess: !!hasAccess });
}
