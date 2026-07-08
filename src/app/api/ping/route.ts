import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient();
  await svc.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", user.id);

  return NextResponse.json({ ok: true });
}
