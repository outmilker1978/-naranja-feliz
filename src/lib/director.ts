import { createServiceClient } from "@/lib/supabase/server";

export async function getDirectorId(): Promise<string | null> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("profiles")
    .select("id")
    .eq("role", "teacher")
    .eq("is_director", true)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}
