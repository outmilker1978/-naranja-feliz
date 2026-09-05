import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getServerClient } from "@/lib/auth-cache";

export const dynamic = "force-dynamic";

// BFF: «Очистить все ответы на уроке». Раньше прямой supabase.rpc из браузера
// (висел минутами на нестабильных сетях). Теперь серверный клиент:
// RPC clear_lesson_answers (одна транзакция) + supabaseFetch (таймаут/ретрай).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId, studentId } = await req.json();
  if (!lessonId || !studentId) {
    return NextResponse.json({ error: "Missing lessonId or studentId" }, { status: 400 });
  }

  const supabase = await getServerClient();
  const { error } = await supabase.rpc("clear_lesson_answers", {
    student_id: studentId,
    lesson_id: lessonId,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}