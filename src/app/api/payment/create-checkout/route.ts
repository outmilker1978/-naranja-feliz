import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createPayment } from "@/lib/yookassa";
import { requestOrigin } from "@/lib/request-origin";

const PLANS: Record<string, { price: number; days: number; label: string }> = {
  "1m": { price: 700, days: 30, label: "Подписка на 1 месяц" },
  "3m": { price: 1900, days: 90, label: "Подписка на 3 месяца" },
  "6m": { price: 3500, days: 180, label: "Подписка на 6 месяцев" },
  "12m": { price: 6000, days: 365, label: "Подписка на 12 месяцев" },
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await req.json();
  const plan = PLANS[planId as string];
  if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const svc = createServiceClient();
  const siteUrl = requestOrigin(req);

  const yooPayment = await createPayment({
    amount: plan.price,
    description: plan.label,
    returnUrl: `${siteUrl}/settings?payment=success`,
  });

  const { error: dbError } = await svc.from("payment_transactions").insert({
    user_id: user.id,
    amount: plan.price,
    description: plan.label,
    yookassa_id: yooPayment.id,
    status: "pending",
    plan_duration_days: plan.days,
  });

  if (dbError) {
    console.error("Failed to save transaction:", dbError);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({
    paymentId: yooPayment.id,
    confirmationUrl: yooPayment.confirmation?.confirmation_url,
  });
}
