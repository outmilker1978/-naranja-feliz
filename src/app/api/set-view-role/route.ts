import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function POST(req: Request) {
  const formData = await req.formData();
  const role = formData.get("role") as string;
  const referer = req.headers.get("referer") || "/";
  const cookieStore = await cookies();
  cookieStore.set("view_role", role, { path: "/", maxAge: 86400 });
  redirect(referer);
}
