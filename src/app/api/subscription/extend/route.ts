import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId, days, mode } = await req.json();
  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 });

  const allowedModes = ["gift", "credit", "writeoff", "close"];
  const m = allowedModes.includes(mode) ? mode : "gift";
  const n = Math.max(1, Math.floor(Number(days) || 30));

  // Only teachers can operate
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  const metaRole = user.user_metadata?.role;
  if (!(profile?.role === "teacher" || profile?.role === "admin" || metaRole === "teacher" || metaRole === "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const svc = createServiceClient();

  const { data: student } = await svc.from("profiles").select("subscription_until, credit_days").eq("id", studentId).single();
  const now = Date.now();
  const currentUntil = student?.subscription_until ? new Date(student.subscription_until) : null;
  let newUntil: Date | null = currentUntil;
  if (newUntil && newUntil.getTime() < now) newUntil = new Date(now);
  const currentCredit = student?.credit_days ?? 0;

  let newCredit = currentCredit;
  let note = "";
  let historyType = m;

  if (m === "gift" || m === "credit") {
    const base = newUntil && newUntil.getTime() > now ? newUntil.getTime() : now;
    newUntil = new Date(base + n * 86400000);
    if (m === "credit") {
      newCredit = currentCredit + n;
      note = `Выдано в кредит ${n} дн.`;
    } else {
      note = `Подарок ${n} дн.`;
    }
  } else if (m === "writeoff") {
    const repaid = Math.min(currentCredit, n);
    newCredit = currentCredit - repaid;
    note = `Списано ${repaid} дн. долга`;
    historyType = "writeoff";
  } else if (m === "close") {
    newUntil = null;
    newCredit = 0;
    note = "Доступ закрыт учителем";
    historyType = "close";
  }

  const { error } = await svc.from("profiles").update({
    subscription_until: newUntil ? newUntil.toISOString() : null,
    credit_days: newCredit,
    subscription_requested_at: null,
  }).eq("id", studentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await svc.from("subscription_credit_history").insert({
    user_id: studentId,
    actor_id: user.id,
    type: historyType,
    days: historyType === "close" ? 0 : n,
    note,
  });

  const teacherName = profile?.full_name || user.user_metadata?.full_name || "Учитель";
  const title = m === "writeoff" ? "✓ Долг списан" : m === "credit" ? "📌 Доступ в кредит" : m === "close" ? "⛔ Доступ закрыт" : "✓ Подписка продлена";

  return NextResponse.json({ ok: true, subscription_until: newUntil?.toISOString() ?? null, credit_days: newCredit });
}
