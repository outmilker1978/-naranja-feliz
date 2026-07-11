import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Newspaper, BookOpen, Clock, User, Sparkles, Layers, MessageCircle, GraduationCap, Home } from "lucide-react";
import ContentCarousel from "@/components/content-carousel";

export default async function ContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const svc = createServiceClient();

  const { data: item } = await svc
    .from("content")
    .select("*, profiles!inner(id, full_name, avatar_url)")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!item || !["news", "article"].includes(item.type)) notFound();

  const contentBlocks = Array.isArray(item.content) ? item.content : [];

  // Fetch all published content for navigation and carousel
  const { data: allContent } = await svc
    .from("content")
    .select("id, title, excerpt, cover_image, type, category, created_at")
    .in("type", ["news", "article"])
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const allItems = allContent ?? [];
  const currentIdx = allItems.findIndex(c => c.id === id);
  const nextItem = currentIdx < allItems.length - 1 ? allItems[currentIdx + 1] : null;

  // Related items for sidebar (same type first, then others)
  const sameType = allItems.filter(c => c.type === item.type && c.id !== id).slice(0, 3);
  const otherType = allItems.filter(c => c.type !== item.type && c.id !== id).slice(0, 3);
  const related = [...sameType, ...otherType].slice(0, 6);

  const typeLabel = item.type === "news" ? "Новость" : "Статья";
  const TypeIcon = item.type === "news" ? Newspaper : BookOpen;

  return (
    <>
      {/* Navigation bar — fixed below site header */}
      <div className="border-b border-border/30 bg-white" style={{ position: "fixed", top: "73px", left: 0, right: 0, zIndex: 40 }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 md:px-8 py-2.5">
          <Link href="/"
            className="text-sm font-semibold text-primary-500 hover:text-primary-600 transition-colors inline-flex items-center gap-1">
            ← {item.type === "news" ? "Все новости" : "Все статьи"}
          </Link>
          {nextItem && (
            <Link href={`/content/${nextItem.id}`}
              className="text-sm text-muted hover:text-accent transition-colors inline-flex items-center gap-1">
              {item.type === "news" ? "Следующая новость" : "Следующая статья"} →
            </Link>
          )}
        </div>
      </div>

      <article className="max-w-6xl mx-auto px-5 md:px-8 pt-14 pb-10">
        <div className="grid lg:grid-cols-[1fr_320px] gap-10">
          {/* Main content */}
          <div>
            {item.cover_image && (
              <div className="rounded-2xl overflow-hidden mb-8 shadow-md">
                <img src={item.cover_image} alt="" className="w-full h-72 sm:h-96 object-cover" />
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <span className="badge badge-orange flex items-center gap-1.5"><TypeIcon className="w-3.5 h-3.5" /> {typeLabel}</span>
              {item.category && <span className="text-xs text-muted">{item.category}</span>}
              <span className="text-xs text-muted flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(item.created_at).toLocaleDateString("ru")}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-accent tracking-tight mb-4">{item.title}</h1>

            {item.excerpt && (
              <p className="text-lg text-muted leading-relaxed mb-8 border-l-4 border-primary-500 pl-4 italic">{item.excerpt}</p>
            )}

            <div className="prose prose-lg max-w-none text-accent">
              {contentBlocks.map((block: any, i: number) => {
                if (block.type === "text") {
                  return <p key={i} className="text-base leading-relaxed mb-4">{block.value}</p>;
                }
                return null;
              })}
            </div>

            {item.profiles && (
              <div className="flex items-center gap-3 mt-10 pt-6 border-t border-border">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center text-white font-bold text-sm">
                  {item.profiles.avatar_url
                    ? <img src={item.profiles.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                    : (item.profiles.full_name?.[0] ?? "?")}
                </div>
                <div>
                  <span className="text-sm font-semibold text-accent flex items-center gap-1"><User className="w-3.5 h-3.5" /> {item.profiles.full_name}</span>
                  <span className="text-xs text-muted">Автор</span>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="card p-5">
              <h3 className="text-sm font-bold text-accent uppercase tracking-wider mb-4">Читайте также</h3>
              <div className="space-y-4">
                {related.map(r => (
                  <Link key={r.id} href={`/content/${r.id}`} className="flex gap-3 group">
                    {r.cover_image ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                        <img src={r.cover_image} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shrink-0">
                        {r.type === "news" ? <Newspaper className="w-6 h-6 text-primary-500" /> : <BookOpen className="w-6 h-6 text-primary-500" />}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-[10px] text-muted uppercase tracking-wider">
                        {r.type === "news" ? "Новость" : "Статья"}
                      </span>
                      <h4 className="text-sm font-semibold text-accent group-hover:text-primary-500 transition-colors line-clamp-2 leading-snug mt-0.5">
                        {r.title}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="card p-5 text-center">
              <span className="text-3xl block mb-2">🍊</span>
              <h4 className="text-sm font-bold text-accent">Начать учить испанский</h4>
              <p className="text-xs text-muted mt-1">Первый урок бесплатно</p>
              <Link href="/register" className="btn-gradient btn-sm mt-3 w-full inline-flex items-center justify-center gap-1">
                Записаться <Sparkles className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="card p-5 space-y-3">
              <h3 className="text-sm font-bold text-accent uppercase tracking-wider">Полезное</h3>
              <Link href="/tools/cards" className="flex items-center gap-3 text-sm text-muted hover:text-primary-500 transition-colors group">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary-400 to-secondary-500 flex items-center justify-center text-white shrink-0">
                  <Layers className="w-4 h-4" />
                </span>
                Карточки для запоминания
              </Link>
              <Link href="/tools/chat" className="flex items-center gap-3 text-sm text-muted hover:text-primary-500 transition-colors group">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center text-white shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </span>
                Чат с учителем
              </Link>
              <Link href="/courses" className="flex items-center gap-3 text-sm text-muted hover:text-primary-500 transition-colors group">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-orange-500 flex items-center justify-center text-white shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </span>
                Все курсы
              </Link>
              <Link href="/" className="flex items-center gap-3 text-sm text-muted hover:text-primary-500 transition-colors group">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-primary-500 flex items-center justify-center text-white shrink-0">
                  <Home className="w-4 h-4" />
                </span>
                На главную
              </Link>
            </div>
          </aside>
        </div>
      </article>

      {/* Carousel */}
      <section className="max-w-6xl mx-auto px-5 md:px-8">
        <ContentCarousel items={allItems} currentId={id} />
      </section>
    </>
  );
}
