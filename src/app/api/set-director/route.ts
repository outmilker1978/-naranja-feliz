import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, isDirector } = await req.json();
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const svc = createServiceClient();

  const { data: caller } = await svc.from("profiles").select("role").eq("id", user.id).single();
  const metaRole = user.user_metadata?.role;
  if (!(caller?.role === "admin" || metaRole === "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: target } = await svc.from("profiles").select("role").eq("id", userId).single();
  if (target?.role !== "teacher") {
    return NextResponse.json({ error: "Only teachers can be director" }, { status: 400 });
  }

  if (isDirector) {
    await svc.from("profiles").update({ is_director: false }).eq("is_director", true);
  }

  const { error } = await svc.from("profiles").update({ is_director: !!isDirector }).eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
