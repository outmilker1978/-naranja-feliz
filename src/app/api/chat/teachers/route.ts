import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient();
  const { data: profile } = await svc.from("profiles").select("role").eq("id", user.id).single();
  const isElevated = profile?.role === "teacher" || profile?.role === "admin";

  let contacts;
  if (isElevated) {
    // Teacher/admin sees students
    const { data } = await svc
      .from("profiles")
      .select("id, full_name, avatar_url, role, last_seen, email")
      .eq("role", "student");
    contacts = data ?? [];
  } else {
    // Student sees teachers + admins
    const { data } = await svc
      .from("profiles")
      .select("id, full_name, avatar_url, role, last_seen, email")
      .in("role", ["teacher", "admin"]);
    contacts = data ?? [];
  }

  // Add online flag
  const now = new Date();
  contacts = contacts.map((c: any) => ({
    ...c,
    online: c.last_seen && (now.getTime() - new Date(c.last_seen).getTime()) < 120000,
  }));

  return NextResponse.json({ teachers: contacts });
}
