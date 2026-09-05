import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseFetch } from "@/lib/supabase/server";
import { requestOrigin } from "@/lib/request-origin";

export async function POST(request: Request) {
  const origin = requestOrigin(request);
  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Email обязателен" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: supabaseFetch },
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) { for (const { name, value, options } of cookiesToSet) { cookieStore.set(name, value, options); } },
      },
    },
  );

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
