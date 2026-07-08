import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient();

  // Count messages in all chats where current user is NOT the sender and message is unread
  const { data: chats } = await svc
    .from("chats")
    .select("id")
    .or(`student_id.eq.${user.id},teacher_id.eq.${user.id}`);

  const chatIds = (chats ?? []).map(c => c.id);

  let totalUnread = 0;
  if (chatIds.length > 0) {
    const { count } = await svc
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .in("chat_id", chatIds)
      .neq("sender_id", user.id)
      .eq("read", false);
    totalUnread = count ?? 0;
  }

  return NextResponse.json({ unreadCount: totalUnread });
}
