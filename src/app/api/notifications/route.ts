import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const countOnly = searchParams.get("countOnly") === "true";

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (countOnly) {
    return NextResponse.json({ unreadCount: unreadCount ?? 0 });
  }

  const svc = createServiceClient();
  const { data: notifications } = await svc
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const actorIds = [...new Set((notifications ?? []).map(n => n.actor_id).filter(Boolean))];
  const actorsMap = new Map<string, { id: string; full_name: string | null; avatar_url: string | null }>();

  if (actorIds.length > 0) {
    const { data: profiles } = await svc
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", actorIds);
    for (const p of profiles ?? []) {
      actorsMap.set(p.id, p);
    }
  }

  const enriched = (notifications ?? []).map(n => ({
    ...n,
    actor: n.actor_id ? (actorsMap.get(n.actor_id) ?? null) : null,
  }));

  return NextResponse.json({ notifications: enriched, unreadCount: unreadCount ?? 0 });
}

export async function PUT(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, read } = body;

  if (id) {
    await supabase.from("notifications").update({ read }).eq("id", id).eq("user_id", user.id);
  } else {
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  }

  return NextResponse.json({ ok: true });
}
