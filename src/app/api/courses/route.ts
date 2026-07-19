import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const svc = createServiceClient();
  const { data } = await svc.from("courses").select("id, title, level").order("title", { ascending: true });
  return NextResponse.json(data ?? []);
}
