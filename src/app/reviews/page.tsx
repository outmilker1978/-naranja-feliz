import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { proxyImgUrl } from "@/lib/image-proxy";

export default async function ReviewsPage() {
  const svc = createServiceClient();
  const { data: sections } = await svc
    .from("content")
    .select("*")
    .eq("type", "page_section")
    .eq("category", "testimonials")
    .eq("status", "published")
    .limit(1);

  const testimonials = sections?.[0];
  const items: { author: string; text: string; avatar?: string }[] = testimonials?.content?.items ?? [];

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-accent text-center mb-2">
        {testimonials?.content?.title ?? "Отзывы"}
      </h1>
      <p className="text-muted text-center mb-10">Что говорят наши ученики</p>

      {items.length === 0 ? (
        <p className="text-muted text-center py-10">Отзывы скоро появятся</p>
      ) : (
        <div className="gap-6 columns-1 sm:columns-2 lg:columns-3 space-y-6">
          {items.map((item, i) => (
            <div key={i} className="relative overflow-hidden rounded-xl break-inside-avoid group"
              style={{ minHeight: `${16 + ((item.text?.length || 80) % 12)}rem`, backgroundImage: item.avatar ? `url(${proxyImgUrl(item.avatar)})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
              {!item.avatar && <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <p className="text-lg leading-relaxed italic font-medium drop-shadow-lg text-white/95">&ldquo;{item.text}&rdquo;</p>
                <p className="font-bold mt-3 drop-shadow-lg text-white">{item.author}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center mt-10">
        <Link href="/" className="text-sm text-muted hover:text-primary-500 transition-colors">← На главную</Link>
      </div>
    </div>
  );
}
