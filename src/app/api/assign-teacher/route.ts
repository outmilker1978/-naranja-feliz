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
      return NextResponse.json({ error: "Forbidden. Only admin can assign roles." }, { status: 403 });
    }
  }

  const { email, newRole } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
  const targetRole = newRole === "admin" ? "admin" : "teacher";

  const { data: profile } = await svc
    .from("profiles")
    .select("id, role")
    .eq("email", email)
    .single();

  if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (profile.role === targetRole) return NextResponse.json({ error: `Already ${targetRole}` }, { status: 400 });

  const { error: updateError } = await svc
    .from("profiles")
    .update({ role: targetRole })
    .eq("id", profile.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const { error: metaError } = await svc.auth.admin.updateUserById(
    profile.id,
    { user_metadata: { role: targetRole } },
  );

  if (metaError) return NextResponse.json({ error: metaError.message }, { status: 500 });

  return NextResponse.json({ success: true, role: targetRole });
}
