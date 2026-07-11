import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const svc = createServiceClient();
  const { data } = await svc.from("content").select("content").eq("id", "00000000-0000-0000-0000-000000000001").maybeSingle();
  return NextResponse.json((data?.content as any)?.block_order ?? []);
}

export async function POST(req: Request) {
  const { order } = await req.json();
  if (!Array.isArray(order)) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const svc = createServiceClient();

  // Upsert a special row with id=magic to store layout
  const { data: existing } = await svc.from("content").select("id").eq("id", "00000000-0000-0000-0000-000000000001").maybeSingle();

  if (existing) {
    await svc.from("content").update({ content: { block_order: order } }).eq("id", "00000000-0000-0000-0000-000000000001");
  } else {
    // Use raw SQL to bypass NOT NULL constraints
    const { error } = await svc.rpc("exec_sql", {
      sql: `INSERT INTO content (id, type, category, title, status, author_id, content, sort_order)
            VALUES ('00000000-0000-0000-0000-000000000001', 'page_section', 'hero', '_layout', 'published',
              (SELECT id FROM profiles WHERE role IN ('admin','teacher') LIMIT 1),
              '{"block_order": ${JSON.stringify(JSON.stringify(order))}}', 0)`
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
