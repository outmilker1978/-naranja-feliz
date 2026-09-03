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
  const chatIds = filtered.map(c => c.id);

  let lastByChat: Record<string, any> = {};
  let unreadByChat: Record<string, number> = {};

  if (chatIds.length > 0) {
    // One batched query: fetch the latest message per chat + per-chat read state for this user.
    const { data: allMsgs } = await svc
      .from("chat_messages")
      .select("*, sender:sender_id(id, full_name, avatar_url, role, last_seen)")
      .in("chat_id", chatIds)
      .order("created_at", { ascending: false });

    const grouped: Record<string, any[]> = {};
    for (const m of (allMsgs ?? [])) {
      (grouped[m.chat_id] = grouped[m.chat_id] || []).push(m);
    }
    for (const id of chatIds) {
      const msgs = grouped[id] ?? [];
      lastByChat[id] = msgs[0] ?? null;
      unreadByChat[id] = msgs.filter(m => m.sender_id !== user.id && !m.read).length;
    }
  }

  const enriched = filtered.map((chat) => ({
    ...chat,
    last_message: lastByChat[chat.id] ?? null,
    unread_count: unreadByChat[chat.id] ?? 0,
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
