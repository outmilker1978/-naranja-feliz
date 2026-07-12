import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!email || !password || !fullName) {
    return NextResponse.redirect(
      new URL(`/register?error=${encodeURIComponent("Все поля обязательны")}`, process.env.NEXT_PUBLIC_SITE_URL!),
    );
  }

  const svc = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { count } = await svc.from("profiles").select("*", { count: "exact", head: true });
  const isFirstUser = (count ?? 0) === 0;
  const role = isFirstUser ? "admin" : "student";

  const adminSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: createData, error } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/register?error=${encodeURIComponent(error.message)}`, process.env.NEXT_PUBLIC_SITE_URL!),
    );
  }

  if (createData.user) {
    const userId = createData.user.id;
    await svc.from("profiles").upsert({
      id: userId,
      full_name: fullName,
      email,
      role,
    }, { onConflict: "id" });
  }

  const cookieStore = await cookies();
  const pendingCookies: { name: string; value: string; options?: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
            pendingCookies.push({ name, value, options });
          }
        },
      },
    },
  );

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(signInError.message)}`, process.env.NEXT_PUBLIC_SITE_URL!),
    );
  }

  const response = NextResponse.redirect(new URL("/courses", process.env.NEXT_PUBLIC_SITE_URL!));
  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, options);
  }

  return response;
}
