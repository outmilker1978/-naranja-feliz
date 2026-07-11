import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getPayment, verifyWebhookIp } from "@/lib/yookassa";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
  if (!verifyWebhookIp(ip)) {
    console.warn("YooKassa webhook from unknown IP:", ip);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let event: { type: string; object: { id: string } };
  try {
    event = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type !== "payment.succeeded") {
    return NextResponse.json({ ok: true });
  }

  const svc = createServiceClient();
  const paymentId = event.object.id;

  const { data: tx } = await svc
    .from("payment_transactions")
    .select("*")
    .eq("yookassa_id", paymentId)
    .single();

  if (!tx) {
    console.error("Transaction not found for yookassa_id:", paymentId);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (tx.status === "succeeded") {
    return NextResponse.json({ ok: true });
  }

  const yooPayment = await getPayment(paymentId);
  if (yooPayment.status !== "succeeded") {
    return NextResponse.json({ ok: true });
  }

  const { data: profile } = await svc
    .from("profiles")
    .select("subscription_until")
    .eq("id", tx.user_id)
    .single();

  const now = new Date();
  const currentUntil = profile?.subscription_until
    ? new Date(profile.subscription_until)
    : now;
  if (currentUntil < now) currentUntil.setTime(now.getTime());

  const newUntil = new Date(currentUntil.getTime() + tx.plan_duration_days * 86400000);

  await svc.from("profiles").update({ subscription_until: newUntil.toISOString() }).eq("id", tx.user_id);
  await svc.from("payment_transactions").update({ status: "succeeded", updated_at: new Date().toISOString() }).eq("id", tx.id);

  await svc.from("notifications").insert({
    user_id: tx.user_id,
    title: "Подписка продлена",
    body: `Срок действия подписки продлён до ${newUntil.toLocaleDateString("ru-RU")}`,
    link: "/settings",
  });

  return NextResponse.json({ ok: true });
}
