import { NextResponse } from "next/server";
import { createAdminClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fullName } = await req.json();
  if (!fullName?.trim()) {
    return NextResponse.json({ error: "Missing fullName" }, { status: 400 });
  }

  const svc = createServiceClient();
  await svc.from("profiles").update({ full_name: fullName.trim() }).eq("id", user.id);
  await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { full_name: fullName.trim() },
  });

  return NextResponse.json({ ok: true });
}
