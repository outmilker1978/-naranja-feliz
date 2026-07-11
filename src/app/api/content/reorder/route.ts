import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { items } = await req.json();
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  for (const { id, sort_order } of items) {
    await supabase.from("content").update({ sort_order }).eq("id", id);
  }

  return NextResponse.json({ ok: true });
}
