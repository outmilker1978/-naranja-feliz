import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Returns the current user from the secure server session (cookies).
// Used by client pages instead of the browser-side supabase.auth.getUser()
// (which hits Supabase directly from the browser and can stall on slow networks).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: { id: user.id, email: user.email, user_metadata: user.user_metadata },
  });
}
