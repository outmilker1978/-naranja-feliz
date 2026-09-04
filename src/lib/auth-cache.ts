import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Cached server-side Supabase client — one instance per request.
 * Instead of every page/layout calling createClient() again, they share
 * the same client, so auth.getUser() below is only called ONCE per request.
 */
export const getServerClient = cache(async () => createClient());

/**
 * Cached auth helper — deduplicates auth.getUser() within a single request.
 * React.cache() ensures only one Supabase auth call is made per request,
 * regardless of how many server components/layouts call getCurrentUser().
 */
export const getCurrentUser = cache(async () => {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});