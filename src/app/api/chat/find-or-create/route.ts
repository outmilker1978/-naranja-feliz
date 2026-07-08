import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { otherUserId } = await req.json();
  if (!otherUserId) return NextResponse.json({ error: "Missing otherUserId" }, { status: 400 });
  if (otherUserId === user.id) return NextResponse.json({ error: "Cannot chat with yourself" }, { status: 400 });

  const svc = createServiceClient();

  // Determine who is student and who is teacher
  const metaRole = user.user_metadata?.role;
  const { data: profile } = await svc.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const myRole = profile?.role || metaRole || "student";
  const { data: other } = await svc.from("profiles").select("role").eq("id", otherUserId).maybeSingle();

  let studentId: string, teacherId: string;
  if (myRole === "teacher") {
    studentId = otherUserId;
    teacherId = user.id;
  } else {
    studentId = user.id;
    teacherId = otherUserId;
  }

  // Try to find existing chat (check both orientations)
  const { data: existing } = await svc
    .from("chats")
    .select("id")
    .or(`and(student_id.eq.${studentId},teacher_id.eq.${teacherId}),and(student_id.eq.${teacherId},teacher_id.eq.${studentId})`)
    .maybeSingle();

  if (existing) return NextResponse.json({ chatId: existing.id });

  // Create new chat
  const { data: chat } = await svc
    .from("chats")
    .insert({ student_id: studentId, teacher_id: teacherId })
    .select("id")
    .single();

  return NextResponse.json({ chatId: chat?.id });
}
