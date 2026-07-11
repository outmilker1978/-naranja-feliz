import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { avatarUrl } = await req.json();
  if (typeof avatarUrl !== "string") {
    return NextResponse.json({ error: "Missing avatarUrl" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { error: profileError } = await svc.from("profiles").update({ avatar_url: avatarUrl || null }).eq("id", user.id);
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const { error: authError } = await supabase.auth.updateUser({ data: { avatar_url: avatarUrl || null } });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
