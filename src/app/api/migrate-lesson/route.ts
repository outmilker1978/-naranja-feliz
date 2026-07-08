import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const lessonId = req.nextUrl.searchParams.get("lessonId");
  if (!lessonId) return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*, courses!inner(created_by)")
    .eq("id", lessonId)
    .single();

  if (!lesson || (lesson.courses as any).created_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!lesson.content) return NextResponse.json({ error: "No content" }, { status: 400 });

  const { data: existing } = await supabase
    .from("lesson_blocks")
    .select("id")
    .eq("lesson_id", lessonId);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "Blocks already exist" }, { status: 400 });
  }

  let content = lesson.content
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  content = content.replace(/<span[^>]*data-answer="([^"]*)"[^>]*>.*?<\/span>/gi, (_m: string, a: string) => `[[${a}]]`);

  const service = createServiceClient();
  await service.from("lesson_blocks").insert({
    lesson_id: lessonId,
    type: "text",
    content: { html: content },
    order_index: 0,
  });

  return NextResponse.redirect(new URL(`/admin/lessons/${lessonId}`, req.url));
}
