import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = file.name.split(".").pop() || "webm";
  const fileName = `audio/${user.id}/${Date.now()}.${ext}`;

  const service = createServiceClient();
  const { data, error } = await service.storage.from("lesson-files").upload(fileName, file, {
    contentType: file.type || "audio/webm",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = service.storage.from("lesson-files").getPublicUrl(data.path);

  return NextResponse.json({ url: publicUrl });
}
