import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const svc = createServiceClient();
  const { data } = await svc.from("content").select("*, profiles!inner(id, full_name, avatar_url)").eq("id", id).maybeSingle();
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  if (body.status === "published" && !isAdmin)
    return NextResponse.json({ error: "Only admins can publish" }, { status: 403 });

  const { data, error } = await svc.from("content").update({
    type: body.type,
    category: body.category,
    title: body.title,
    slug: body.slug,
    excerpt: body.excerpt,
    content: body.content,
    cover_image: body.cover_image,
    status: body.status,
    scheduled_at: body.scheduled_at,
    updated_at: new Date().toISOString(),
  }).eq("id", id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient();
  const { data: p } = await svc.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const mRole = user.user_metadata?.role;
  if (!(p?.role === "admin" || mRole === "admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await svc.from("content").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
