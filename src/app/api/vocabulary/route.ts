import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient();
  let query = svc.from("vocabulary").select("*").eq("user_id", user.id).order("created_at", { ascending: false });

  const search = searchParams.get("search");
  if (search) query = query.or(`word.ilike.%${search}%,translation.ilike.%${search}%`);
  const tag = searchParams.get("tag");
  if (tag) query = query.contains("tags", [tag]);
  const category = searchParams.get("category");
  if (category) query = query.eq("category", category);

  const { data } = await query;
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const svc = createServiceClient();
  const { data, error } = await svc.from("vocabulary").insert({
    user_id: user.id,
    word: body.word,
    translation: body.translation,
    transcription: body.transcription || null,
    example_sentence: body.example_sentence || null,
    tags: body.tags || [],
    category: body.category || "general",
    source_lesson_id: body.source_lesson_id || null,
  }).select().maybeSingle();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Слово уже в словаре" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: "No ids" }, { status: 400 });

  const svc = createServiceClient();
  const { error } = await svc.from("vocabulary").delete().in("id", ids).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
