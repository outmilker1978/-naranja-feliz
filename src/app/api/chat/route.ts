import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");
  const svc = createServiceClient();

  if (chatId) {
    const { data: messages } = await svc
      .from("chat_messages")
      .select("*, sender:sender_id(id, full_name, avatar_url, role, last_seen)")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    return NextResponse.json({ messages: messages ?? [] });
  }

  const { data: chats } = await svc
    .from("chats")
    .select("*, teacher:teacher_id(id, full_name, avatar_url, role, last_seen), student:student_id(id, full_name, avatar_url, role, last_seen)")
    .or(`student_id.eq.${user.id},teacher_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const filtered = (chats ?? []).filter(c => c.student_id !== c.teacher_id);

  const enriched = await Promise.all((filtered).map(async (chat) => {
    const { data: lastMsg } = await svc
      .from("chat_messages")
      .select("*")
      .eq("chat_id", chat.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { count: unread } = await svc
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("chat_id", chat.id)
      .neq("sender_id", user.id)
      .eq("read", false);

    return { ...chat, last_message: lastMsg ?? null, unread_count: unread ?? 0 };
  }));

  return NextResponse.json({ chats: enriched });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId, content, fileUrl } = await req.json();
  if (!chatId || (!content?.trim() && !fileUrl)) {
    return NextResponse.json({ error: "Missing chatId or content" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data: message } = await svc
    .from("chat_messages")
    .insert({ chat_id: chatId, sender_id: user.id, content: content?.trim() || null, file_url: fileUrl || null })
    .select("*, sender:sender_id(id, full_name, avatar_url)")
    .single();

  return NextResponse.json({ message });
}
