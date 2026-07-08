"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, Newspaper, BookOpen } from "lucide-react";

interface Item {
  id: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  type: string;
}

export default function ContentCarousel({ items, currentId }: { items: Item[]; currentId: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 320, behavior: "smooth" });
    }
  };

  const filtered = items.filter(i => i.id !== currentId);

  if (filtered.length === 0) return null;

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-accent tracking-tight">Ещё почитать</h2>
        <div className="flex gap-2">
          <button onClick={() => scroll(-1)}
            className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center text-muted hover:text-accent hover:shadow-sm transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => scroll(1)}
            className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center text-muted hover:text-accent hover:shadow-sm transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-5 md:-mx-8 px-5 md:px-8 snap-x snap-mandatory">
        {filtered.map(item => (
          <Link key={item.id} href={`/content/${item.id}`}
            className="card overflow-hidden group shrink-0 w-64 snap-start">
            {item.cover_image ? (
              <div className="h-36 overflow-hidden">
                <img src={item.cover_image} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
            ) : (
              <div className="h-36 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                {item.type === "news" ? <Newspaper className="w-8 h-8 text-primary-500" /> : <BookOpen className="w-8 h-8 text-primary-500" />}
              </div>
            )}
            <div className="p-4">
              <span className="text-[10px] text-muted uppercase tracking-wider">
                {item.type === "news" ? "Новость" : "Статья"}
              </span>
              <h3 className="text-sm font-semibold text-accent group-hover:text-primary-500 transition-colors line-clamp-2 leading-snug mt-1">
                {item.title}
              </h3>
              {item.excerpt && <p className="text-xs text-muted mt-1 line-clamp-2">{item.excerpt}</p>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
