import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient();

  // Check caller's role
  const { data: callerProfile } = await svc.from("profiles").select("role").eq("id", user.id).single();
  const callerRole = callerProfile?.role;

  // Check if any admin exists
  const { count: adminCount } = await svc.from("profiles").select("*", { count: "exact", head: true }).eq("role", "admin");
  const hasAdmin = (adminCount ?? 0) > 0;

  // Allow if admin, or if teacher and no admin exists yet
  if (callerRole !== "admin") {
    if (callerRole === "teacher" && !hasAdmin) {
      // teacher can manage roles when no admin exists
    } else {
      return NextResponse.json({ error: "Forbidden. Only admin can demote." }, { status: 403 });
    }
  }

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  // Cannot demote yourself
  if (userId === user.id) {
    return NextResponse.json({ error: "You cannot demote yourself" }, { status: 400 });
  }

  const { data: profile } = await svc
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .single();

  if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (profile.role === "student") return NextResponse.json({ error: "Already a student" }, { status: 400 });

  const { error: updateError } = await svc
    .from("profiles")
    .update({ role: "student" })
    .eq("id", profile.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const { error: metaError } = await svc.auth.admin.updateUserById(
    profile.id,
    { user_metadata: { role: "student" } },
  );

  if (metaError) return NextResponse.json({ error: metaError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
