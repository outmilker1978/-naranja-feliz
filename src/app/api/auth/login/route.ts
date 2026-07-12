import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!email || !password) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("Email и пароль обязательны")}`, process.env.NEXT_PUBLIC_SITE_URL!),
    );
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

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, process.env.NEXT_PUBLIC_SITE_URL!),
    );
  }

  const response = NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL!));
  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, options);
  }

  return response;
}
