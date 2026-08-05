import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const TYPE_LABELS: Record<string, string> = {
  gift: "Подарок",
  credit: "Кредит",
  payment: "Оплата",
  writeoff: "Списание долга",
  close: "Доступ закрыт",
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient();
  const { data: history } = await svc
    .from("subscription_credit_history")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const enriched = (history ?? []).map(h => ({
    ...h,
    typeLabel: TYPE_LABELS[h.type] ?? h.type,
  }));

  return NextResponse.json({ history: enriched });
}
