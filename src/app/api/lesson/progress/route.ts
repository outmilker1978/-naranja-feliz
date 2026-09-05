import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getServerClient } from "@/lib/auth-cache";

export const dynamic = "force-dynamic";

// BFF: отметить/снять «урок пройден». Раньше делалось напрямую из браузера
// в Supabase (connection-reset на нестабильных сетях). Теперь — серверный клиент
// со стальными таймаутами/ретраями (supabaseFetch).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { lessonId?: string; completed?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { lessonId, completed } = body;
  if (!lessonId || typeof completed !== "boolean") {
    return NextResponse.json({ error: "Missing lessonId or completed" }, { status: 400 });
  }

  const supabase = await getServerClient();
  const { error } = await supabase.from("lesson_progress").upsert(
    {
      lesson_id: lessonId,
      student_id: user.id,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    },
    { onConflict: "lesson_id,student_id" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}