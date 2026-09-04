import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// Initial chat page data in ONE request:
//   - get_chat_data RPC (chats + teachers + role) — 1 вызов вместо 3 запросов
//   - fallback на legacy запросы, если RPC недоступна (миграция не применена)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient();

  // RPC path: one call
  const { data, error } = await svc.rpc("get_chat_data", { uid: user.id });

  if (error) return legacyInit(svc, user.id);

  const r = data as any;
  if (!r) return legacyInit(svc, user.id);

  const users = r.teachers ?? [];
  const rawChats = r.chats ?? [];

  // Map RPC shape → page shape (same as /api/chat GET)
  const chats = rawChats
    .filter((c: any) => c.id && c.partner?.id && c.partner.id !== user.id)
    .map((c: any) => {
      const partner = c.partner;
      const isTeacher = partner?.role === "teacher" || partner?.role === "admin";
      return {
        id: c.id,
        student_id: isTeacher ? user.id : partner?.id,
        teacher_id: isTeacher ? partner?.id : user.id,
        teacher: isTeacher ? partner : null,
        student: isTeacher ? null : partner,
        created_at: c.created_at ?? null,
        last_message: c.last_message
          ? {
              id: c.message_id,
              content: c.last_message,
              file_url: c.last_file_url,
              sender_id: c.last_sender_id,
              created_at: c.last_message_at,
            }
          : null,
        unread_count: c.unread_count ?? 0,
      };
    });

  // Contacts with online flag (mirrors /api/chat/teachers)
  const now = Date.now();
  const teachers = users.map((c: any) => ({
    ...c,
    online: !!c.last_seen && now - new Date(c.last_seen).getTime() < 120000,
  }));

  return NextResponse.json({
    user: { id: user.id },
    chats,
    teachers,
    role: r.role ?? null,
  });
}

// Legacy fallback: same response shape as /api/chat + /api/chat/teachers combined
async function legacyInit(svc: any, userId: string) {
  const [teachersRes, chatsRaw] = await Promise.all([
    svc.from("profiles").select("id, full_name, avatar_url, role, last_seen, email"),
    svc
      .from("chats")
      .select(
        "*, teacher:teacher_id(id, full_name, avatar_url, role, last_seen), student:student_id(id, full_name, avatar_url, role, last_seen)"
      )
      .or(`student_id.eq.${userId},teacher_id.eq.${userId}`)
      .order("created_at", { ascending: false }),
  ]);

  const contacts = teachersRes.data ?? [];
  const projects = (chatsRaw.data ?? []).filter((c: any) => c.student_id !== c.teacher_id);
  const chatIds = projects.map((c: any) => c.id);

  let lastByChat: Record<string, any> = {};
  let unreadByChat: Record<string, number> = {};

  if (chatIds.length > 0) {
    const { data: allMsgs } = await svc
      .from("chat_messages")
      .select("*, sender:sender_id(id, full_name, avatar_url, role, last_seen)")
      .in("chat_id", chatIds)
      .order("created_at", { ascending: false });

    const grouped: Record<string, any[]> = {};
    for (const m of (allMsgs ?? [])) (grouped[m.chat_id] = grouped[m.chat_id] || []).push(m);
    for (const id of chatIds) {
      const msgs = grouped[id] ?? [];
      lastByChat[id] = msgs[0] ?? null;
      unreadByChat[id] = msgs.filter((m: any) => m.sender_id !== userId && !m.read).length;
    }
  }

  const chats = projects.map((chat: any) => ({
    ...chat,
    last_message: lastByChat[chat.id] ?? null,
    unread_count: unreadByChat[chat.id] ?? 0,
  }));

  const now = Date.now();
  const teachers = contacts.map((c: any) => ({
    ...c,
    online: !!c.last_seen && now - new Date(c.last_seen).getTime() < 120000,
  }));

  return NextResponse.json({
    user: { id: userId },
    chats,
    teachers,
    role: null,
    degraded: true,
  });
}