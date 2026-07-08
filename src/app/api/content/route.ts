import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const published = searchParams.get("published") === "1";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const svc = createServiceClient();

  let query = svc.from("content").select("*, profiles!inner(id, full_name, avatar_url)")
    .order("created_at", { ascending: false });

  if (type) query = query.eq("type", type);
  if (status) query = query.eq("status", status);

  if (published) {
    query = query.eq("status", "published")
      .or(`scheduled_at.is.null,scheduled_at.lte.${new Date().toISOString()}`);
    const { data } = await query;
    return NextResponse.json(data ?? []);
  }

  if (user) {
    const { data: p } = await svc.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const mRole = user.user_metadata?.role;
    const isElevated = p?.role === "teacher" || p?.role === "admin" || mRole === "teacher" || mRole === "admin";
    if (!isElevated) {
      query = query.eq("status", "published");
    }
  } else {
    query = query.eq("status", "published");
  }

  const { data } = await query;
  return NextResponse.json(data ?? []);
}

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
  const isAdmin = p?.role === "admin" || mRole === "admin";

  const status = body.status;
  if (status === "published" && !isAdmin)
    return NextResponse.json({ error: "Only admins can publish" }, { status: 403 });

  const { data, error } = await svc.from("content").insert({
    type: body.type,
    category: body.category ?? "general",
    title: body.title,
    slug: body.slug || null,
    excerpt: body.excerpt || null,
    content: body.content ?? [],
    cover_image: body.cover_image || null,
    status: status ?? "draft",
    author_id: user.id,
    scheduled_at: body.scheduled_at || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
