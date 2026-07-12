import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { proxyImgUrl } from "@/lib/image-proxy";

export default async function AboutPage() {
  const svc = createServiceClient();
  const { data: sections } = await svc
    .from("content")
    .select("*")
    .eq("type", "page_section")
    .eq("category", "about")
    .eq("status", "published")
    .limit(1);

  const about = sections?.[0];

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-accent text-center mb-8">
        {about?.content?.title ?? "О школе"}
      </h1>

      {(about?.content?.image || about?.cover_image) && (
        <div className="rounded-2xl overflow-hidden shadow-md mb-8 max-w-lg mx-auto">
          <img src={proxyImgUrl(about.content.image || about.cover_image) ?? ""} alt="О школе" loading="lazy" className="w-full object-cover" />
        </div>
      )}

      <div className="text-accent leading-relaxed text-lg space-y-4">
        {about?.content?.text ? (
          about.content.text.split("\n").map((p: string, i: number) => (
            p.trim() ? <p key={i}>{p}</p> : null
          ))
        ) : (
          <p className="text-muted text-center">Информация о школе скоро появится</p>
        )}
      </div>

      <div className="text-center mt-10">
        <Link href="/" className="text-sm text-muted hover:text-primary-500 transition-colors">← На главную</Link>
      </div>
    </div>
  );
}
