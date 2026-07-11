import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient();
  const { data: p } = await svc.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const mRole = user.user_metadata?.role;
  const isElevated = p?.role === "teacher" || p?.role === "admin" || mRole === "teacher" || mRole === "admin";
  if (!isElevated) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { items } = body;
  if (!items || !Array.isArray(items)) {
    return NextResponse.json({ error: "items array required" }, { status: 400 });
  }

  for (const { id, sort_order } of items) {
    const { error } = await svc.from("content_blocks").update({ sort_order }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
