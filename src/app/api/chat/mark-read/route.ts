import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId } = await req.json();
  if (!chatId) return NextResponse.json({ error: "Missing chatId" }, { status: 400 });

  const svc = createServiceClient();
  await svc
    .from("chat_messages")
    .update({ read: true })
    .eq("chat_id", chatId)
    .neq("sender_id", user.id);

  return NextResponse.json({ ok: true });
}
