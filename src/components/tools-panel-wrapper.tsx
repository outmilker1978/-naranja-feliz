import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import ToolsPanel from "./tools-panel";

export default async function ToolsPanelWrapper() {
  let role: string | null = null;

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      },
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: p } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const mRole = user.user_metadata?.role;
      role = p?.role || mRole || "student";
    }
  } catch {
    // fallback: role stays null
  }

  return <ToolsPanel initialRole={role} />;
}
