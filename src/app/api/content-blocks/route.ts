import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const svc = createServiceClient();

  let query = svc.from("content_blocks").select("*, content(*)").order("sort_order", { ascending: true });
  if (type) query = query.eq("type", type);

  if (!user) {
    query = query.eq("status", "published");
  } else {
    const { data: p } = await svc.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const mRole = user.user_metadata?.role;
    const isElevated = p?.role === "teacher" || p?.role === "admin" || mRole === "teacher" || mRole === "admin";
    if (!isElevated) query = query.eq("status", "published");
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sorted = (data ?? []).map((block: any) => ({
    ...block,
    content: (block.content ?? []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  }));

  return NextResponse.json(sorted);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient();
  const { data: p } = await svc.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const mRole = user.user_metadata?.role;
  const isElevated = p?.role === "teacher" || p?.role === "admin" || mRole === "teacher" || mRole === "admin";
  if (!isElevated) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  if (!body.type || !body.label) {
    return NextResponse.json({ error: "type and label required" }, { status: 400 });
  }

  const { data: last } = await svc.from("content_blocks").select("sort_order").eq("type", body.type).order("sort_order", { ascending: false }).limit(1);
  const nextOrder = (last?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await svc.from("content_blocks").insert({
    type: body.type,
    label: body.label,
    sort_order: nextOrder,
    status: body.status ?? "published",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient();
  const { data: p } = await svc.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const mRole = user.user_metadata?.role;
  const isElevated = p?.role === "teacher" || p?.role === "admin" || mRole === "teacher" || mRole === "admin";
  if (!isElevated) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data, error } = await svc.from("content_blocks").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient();
  const { data: p } = await svc.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const mRole = user.user_metadata?.role;
  const isElevated = p?.role === "teacher" || p?.role === "admin" || mRole === "teacher" || mRole === "admin";
  if (!isElevated) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await svc.from("content_blocks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
