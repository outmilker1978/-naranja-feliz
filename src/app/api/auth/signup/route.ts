import { NextResponse } from "next/server";
import { createAdminClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { email, password, fullName, role } = await request.json();

  const svc = createServiceClient();
  const { count } = await svc.from("profiles").select("*", { count: "exact", head: true });
  const isFirstUser = (count ?? 0) === 0;
  const assignedRole = isFirstUser ? "admin" : (role ?? "student");

  const supabase = await createAdminClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: assignedRole },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Ensure profile is created with correct role
  if (data.user) {
    await svc.from("profiles").upsert({
      id: data.user.id,
      full_name: fullName,
      email,
      role: assignedRole,
    }, { onConflict: "id" });
  }

  return NextResponse.json({ user: data.user, isFirstUser });
}
