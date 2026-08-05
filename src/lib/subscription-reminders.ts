import nodemailer from "nodemailer";
import type { SupabaseClient } from "@supabase/supabase-js";

const DAY = 86400000;

export type ReminderStudent = {
  id: string;
  email: string | null;
  full_name?: string | null;
  subscription_until: string | null;
};

export type ReminderStage = {
  key: string;
  title: string;
  body: string;
  link: string;
  emailSubject: string;
  emailText: string;
};

export function getReminderStage(daysLeft: number): ReminderStage | null {
  if (daysLeft === 5) {
    return {
      key: "in_5_days",
      title: "Подписка скоро закончится",
      body: "Подписка истекает через 5 дней. Продли доступ в настройках.",
      link: "/settings",
      emailSubject: "Скоро закончится подписка в школе испанского",
      emailText: "Привет! Твоя подписка в школе Naranja Feliz закончится через 5 дней.\n\nПродли её сейчас, чтобы не потерять доступ к урокам: ",
    };
  }
  if (daysLeft === 1) {
    return {
      key: "in_1_day",
      title: "Подписка скоро закончится",
      body: "Подписка истекает завтра. Продли доступ в настройках.",
      link: "/settings",
      emailSubject: "Завтра закончится подписка в школе испанского",
      emailText: "Привет! Твоя подписка в школе Naranja Feliz закончится завтра.\n\nПродли её, чтобы не потерять доступ к урокам: ",
    };
  }
  if (daysLeft <= 0) {
    return {
      key: "expired",
      title: "Подписка закончилась",
      body: "Доступ к урокам закрыт. Продли подписку в настройках.",
      link: "/settings",
      emailSubject: "Подписка закончилась",
      emailText: "Привет! Твоя подписка в школе Naranja Feliz закончилась, доступ к урокам закрыт.\n\nПродли подписку, чтобы вернуть доступ: ",
    };
  }
  return null;
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://naranja.outmilk.online";
}

export async function sendSubscriptionEmail(
  to: string,
  subject: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  const host = process.env.SMTP_HOST;
  if (!host) {
    return { ok: false, error: "SMTP_HOST не задан" };
  }
  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[subscription-reminder] SMTP fail to " + to + ":", msg);
    return { ok: false, error: msg };
  }
}

type EnsureOpts = {
  /** "always" — ретраить email по логу даже если уведомление уже создано (для cron). "only-on-create" — email только при создании (для входа). */
  emailMode?: "always" | "only-on-create";
};

export async function ensureSubscriptionReminder(
  svc: SupabaseClient,
  student: ReminderStudent,
  opts: EnsureOpts = {},
): Promise<{ stage: string | null; created: boolean; emailed: boolean; emailError?: string }> {
  if (!student.subscription_until) {
    return { stage: null, created: false, emailed: false };
  }
  const until = new Date(student.subscription_until);
  const daysLeft = Math.ceil((until.getTime() - Date.now()) / DAY);
  const stage = getReminderStage(daysLeft);
  if (!stage) {
    return { stage: null, created: false, emailed: false };
  }
  if (!student.email) {
    return { stage: stage.key, created: false, emailed: false };
  }

  const existing = await svc
    .from("notifications")
    .select("id")
    .eq("user_id", student.id)
    .eq("title", stage.title)
    .eq("body", stage.body)
    .limit(1);

  const alreadyCreated = existing.data && existing.data.length > 0;
  let created = false;
  if (!alreadyCreated) {
    const { error } = await svc.from("notifications").insert({
      user_id: student.id,
      title: stage.title,
      body: stage.body,
      link: stage.link,
    });
    if (error) {
      return { stage: stage.key, created: false, emailed: false, emailError: "notif: " + error.message };
    }
    created = true;
  }

  const emailMode = opts.emailMode ?? "always";
  const shouldTryEmail = created || emailMode === "always";

  if (!shouldTryEmail) {
    return { stage: stage.key, created, emailed: false };
  }

  const logRes = await svc
    .from("subscription_email_log")
    .select("id")
    .eq("user_id", student.id)
    .eq("stage", stage.key)
    .limit(1);

  const logOk = !logRes.error && logRes.data && logRes.data.length > 0;
  if (logOk) {
    return { stage: stage.key, created, emailed: false };
  }

  const pricingUrl = `${getSiteUrl()}/pricing`;
  const res = await sendSubscriptionEmail(
    student.email,
    stage.emailSubject,
    stage.emailText + pricingUrl,
  );

  if (!res.ok) {
    return { stage: stage.key, created, emailed: false, emailError: res.error };
  }

  await svc
    .from("subscription_email_log")
    .upsert({ user_id: student.id, stage: stage.key }, { onConflict: "user_id,stage" });

  return { stage: stage.key, created, emailed: true };
}
