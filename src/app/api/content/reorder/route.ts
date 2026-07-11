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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const headers = {
    "Content-Type": "application/json",
    "apikey": key,
    "Authorization": `Bearer ${key}`,
  };

  for (const { id, sort_order } of items) {
    const res = await fetch(`${url}/rest/v1/content?id=eq.${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ sort_order }),
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Update failed for ${id}: ${res.status} ${text}` }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
