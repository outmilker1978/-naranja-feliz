import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { level } = await req.json();
  if (!level) return NextResponse.json({ error: "Missing level" }, { status: 400 });

  const svc = createServiceClient();
  const { error } = await svc
    .from("profiles")
    .update({ language_level: level, language_level_confirmed_by: null })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
