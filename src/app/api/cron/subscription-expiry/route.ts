import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { ensureSubscriptionReminder } from "@/lib/subscription-reminders";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = (req.headers.get("authorization") ?? req.headers.get("x-cron-secret") ?? "").replace(/^Bearer\s+/i, "");
  if (!secret || auth !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const svc = createServiceClient();

  const { data: students, error: studentsError } = await svc
    .from("profiles")
    .select("id, email, full_name, subscription_until")
    .eq("role", "student")
    .not("subscription_until", "is", null);

  if (studentsError) {
    return NextResponse.json({ error: studentsError.message }, { status: 500 });
  }

  const results = { checked: 0, created: 0, emails: 0, already: 0, errors: [] as string[] };

  for (const s of students ?? []) {
    results.checked++;
    const res = await ensureSubscriptionReminder(svc, s, { emailMode: "always" });
    if (res.emailError) {
      results.errors.push(`user ${s.email}: ${res.emailError}`);
      continue;
    }
    if (res.created) results.created++;
    if (res.emailed) results.emails++;
    if (res.stage && !res.created && !res.emailed && !res.emailError) results.already++;
  }

  return NextResponse.json(results);
}
