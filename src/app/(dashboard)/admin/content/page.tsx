"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Newspaper, FileText, Megaphone, Sparkles, Heart, Star, HelpCircle } from "lucide-react";

interface ContentItem {
  id: string;
  type: string;
  category: string;
  title: string;
  status: string;
  author_id: string;
  scheduled_at: string | null;
  created_at: string;
  sort_order: number;
  excerpt?: string;
  content?: any;
  profiles: { full_name: string; avatar_url: string | null };
}

interface Block {
  key: string;
  label: string;
  type: string;
  category: string;
  sort_order: number;
  locked: boolean;
  collection?: boolean;
  items: ContentItem[];
}

const TYPE_LABELS: Record<string, string> = {
  news: "Новость", article: "Статья", ad: "Реклама", page_section: "Секция",
};
const CATEGORY_LABELS: Record<string, string> = {
  hero: "Hero", features: "Преимущества", about: "О школе", testimonials: "Отзывы", faq: "FAQ", cta: "CTA",
};

const BLOCK_DEFS = [
  { type: "page_section", category: "hero", label: "Hero", locked: true },
  { type: "page_section", category: "features", label: "Преимущества" },
  { type: "page_section", category: "about", label: "О школе" },
  { type: "page_section", category: "testimonials", label: "Отзывы" },
  { type: "page_section", category: "faq", label: "FAQ" },
  { type: "news", label: "Новости", collection: true },
  { type: "article", label: "Статьи", collection: true },
  { type: "ad", label: "Реклама", collection: true },
  { type: "page_section", category: "cta", label: "CTA", locked: true },
];

export default function ContentListPage() {
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const buildBlocks = (allItems: ContentItem[]): Block[] => {
    const blocks: Block[] = [];
    for (const def of BLOCK_DEFS) {
      let blockItems: ContentItem[];
      if (def.collection) {
        blockItems = allItems.filter(i => i.type === def.type)
          .sort((a, b) => a.sort_order - b.sort_order);
      } else {
        blockItems = allItems.filter(i => i.type === def.type && i.category === def.category);
      }
      if (blockItems.length === 0) continue;
      blocks.push({
        key: def.collection ? def.type : `ps-${def.category}`,
        label: def.label,
        type: def.type,
        category: def.category || "",
        sort_order: Math.min(...blockItems.map(i => i.sort_order)),
        locked: !!def.locked,
        collection: !!def.collection,
        items: blockItems,
      });
    }
    // Sort: hero first, cta last, others by sort_order
    return blocks.sort((a, b) => {
      if (a.category === "hero") return -1;
      if (b.category === "hero") return 1;
      if (a.category === "cta") return 1;
      if (b.category === "cta") return -1;
      return a.sort_order - b.sort_order;
    });
  };

  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      try {
        const params = filter ? `?type=${filter}` : "";
        const res = await fetch(`/api/content${params}`);
        if (res.ok) {
          const data: ContentItem[] = await res.json();
          setItems(data);
          setBlocks(buildBlocks(data));
        }
      } catch {}
      setLoading(false);
    })();
  }, [filter]);

  const moveBlock = async (blockIdx: number, direction: "up" | "down") => {
    const block = blocks[blockIdx];
    if (block.locked) return;

    const swapIdx = direction === "up" ? blockIdx - 1 : blockIdx + 1;
    if (swapIdx < 0 || swapIdx >= blocks.length) return;
    if (blocks[swapIdx].locked) return;

    const other = blocks[swapIdx];
    const allItems = block.items.concat(other.items);
    const tempOrder = block.sort_order;
    const swapOrder = other.sort_order;

    // Swap sort_orders: all items in block get other's old order, vice versa
    const reordered = allItems.map(i => {
      const isThisBlock = block.items.some(bi => bi.id === i.id);
      return { id: i.id, sort_order: isThisBlock ? swapOrder : tempOrder };
    });

    const res = await fetch("/api/content/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: reordered }),
    });
    if (res.ok) {
      const updatedItems = items.map(it => {
        const u = reordered.find(r => r.id === it.id);
        return u ? { ...it, sort_order: u.sort_order } : it;
      });
      setItems(updatedItems);
      setBlocks(buildBlocks(updatedItems));
    }
  };

  const moveItemInBlock = async (blockIdx: number, itemIdx: number, direction: "up" | "down") => {
    const block = blocks[blockIdx];
    const item = block.items[itemIdx];
    const swapIdx = direction === "up" ? itemIdx - 1 : itemIdx + 1;
    if (swapIdx < 0 || swapIdx >= block.items.length) return;

    const other = block.items[swapIdx];
    const reordered = [
      { id: item.id, sort_order: other.sort_order },
      { id: other.id, sort_order: item.sort_order },
    ];

    const res = await fetch("/api/content/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: reordered }),
    });
    if (res.ok) {
      const updatedItems = items.map(it => {
        const u = reordered.find(r => r.id === it.id);
        return u ? { ...it, sort_order: u.sort_order } : it;
      });
      setItems(updatedItems);
      setBlocks(buildBlocks(updatedItems));
    }
  };

  if (loading) return <div className="text-center py-16 text-muted">Загрузка...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-accent">Контент портала</h1>
        <Link href="/admin/content/new" className="btn-gradient">+ Создать</Link>
      </div>

      <div className="card p-3 mb-6 flex gap-2 flex-wrap">
        {["", "news", "article", "ad", "page_section"].map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${filter === t ? "bg-primary-500 text-white" : "btn-ghost"}`}>
            {t ? TYPE_LABELS[t] ?? t : "Все"}
          </button>
        ))}
      </div>

      {blocks.length === 0 ? (
        <p className="text-center py-16 text-muted">Нет записей</p>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, bi) => {
            const siblings = blocks.filter(b => !b.locked);
            const idx = siblings.findIndex(b => b.key === block.key);
            const first = idx <= 0;
            const last = idx < 0 || idx >= siblings.length - 1;
            const isExpanded = expanded[block.key] ?? false;

            return (
              <div key={block.key} className="card overflow-hidden">
                {/* Block header */}
                <div className="p-4 flex items-center gap-4">
                  <div className="flex flex-col gap-1 shrink-0">
                    <button type="button" onClick={() => moveBlock(bi, "up")}
                      disabled={block.locked || first}
                      className="w-6 h-6 flex items-center justify-center rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed">▲</button>
                    <button type="button" onClick={() => moveBlock(bi, "down")}
                      disabled={block.locked || last}
                      className="w-6 h-6 flex items-center justify-center rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed">▼</button>
                  </div>
                  <div className="flex-1 min-w-0 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 flex gap-3 items-start">
                      {block.category === "hero" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FF4D2D,#FF6B4A)", color: "white" }}><Sparkles className="w-6 h-6" /></div>}
                      {block.category === "cta" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FF8C2E,#F5C800)", color: "white" }}><Star className="w-6 h-6" /></div>}
                      {block.category === "features" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#EEF2FF,#E0E7FF)", color: "#6366F1" }}><Sparkles className="w-6 h-6" /></div>}
                      {block.category === "about" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FFF1F2,#FFE4E6)", color: "#F43F5E" }}><Heart className="w-6 h-6" /></div>}
                      {block.category === "testimonials" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FFF7ED,#FFEDD5)", color: "#F97316" }}><Star className="w-6 h-6" /></div>}
                      {block.category === "faq" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#F0FDF4,#DCFCE7)", color: "#16A34A" }}><HelpCircle className="w-6 h-6" /></div>}
                      {block.type === "news" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "#F0FDF4", color: "#16A34A" }}><Newspaper className="w-6 h-6" /></div>}
                      {block.type === "article" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "#FFF7ED", color: "#EA580C" }}><FileText className="w-6 h-6" /></div>}
                      {block.type === "ad" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "#F5F3FF", color: "#7C3AED" }}><Megaphone className="w-6 h-6" /></div>}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-accent truncate">{block.label}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted flex-wrap">
                          <span className="badge badge-orange">{TYPE_LABELS[block.type] ?? block.type}</span>
                          {block.category && block.type === "page_section" && <span className="text-xs text-zinc-400">{CATEGORY_LABELS[block.category] ?? block.category}</span>}
                          <span className="text-xs text-zinc-400">{block.items.length} элемент{(block.items.length !== 1) ? "ов" : ""}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {block.collection && (
                      <button onClick={() => setExpanded({ ...expanded, [block.key]: !isExpanded })}
                        className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-600 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors">
                        {isExpanded ? "▲ Свернуть" : `▼ ${block.items.length} элемент${block.items.length !== 1 ? "ов" : ""}`}
                      </button>
                    )}
                  </div>
                </div>

                {/* Items list (always visible for non-collection blocks like hero/cta if multi, toggleable for collections) */}
                {(block.collection ? isExpanded : true) && (
                  <div className="border-t border-zinc-100 bg-zinc-50/50">
                    {block.items.map((item, ii) => {
                      const innerSiblings = block.items;
                      const innerIdx = ii;
                      const isPublished = item.status === "published";
                      return (
                        <div key={item.id} className={`flex items-center gap-3 px-4 py-2.5 border-b border-zinc-100 last:border-b-0 ${isPublished ? "" : "opacity-50"}`}>
                          {block.collection && (
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <button onClick={() => moveItemInBlock(bi, ii, "up")}
                                disabled={innerIdx <= 0}
                                className="w-5 h-5 flex items-center justify-center rounded bg-white hover:bg-zinc-100 text-zinc-400 disabled:opacity-20 disabled:cursor-not-allowed text-[10px]">▲</button>
                              <button onClick={() => moveItemInBlock(bi, ii, "down")}
                                disabled={innerIdx < 0 || innerIdx >= innerSiblings.length - 1}
                                className="w-5 h-5 flex items-center justify-center rounded bg-white hover:bg-zinc-100 text-zinc-400 disabled:opacity-20 disabled:cursor-not-allowed text-[10px]">▼</button>
                            </div>
                          )}
                          <Link href={`/admin/content/${item.id}/edit`} className="flex-1 min-w-0 flex items-center gap-2">
                            <span className="text-xs text-zinc-400 w-4 shrink-0 text-right">{ii + 1}.</span>
                            <span className="text-sm text-accent truncate">{item.title || "(без названия)"}</span>
                            {isPublished ? (
                              <span className="text-[10px] text-green-600 bg-green-100 px-1.5 py-0.5 rounded shrink-0">Активен</span>
                            ) : (
                              <span className="text-[10px] text-zinc-400 bg-zinc-200 px-1.5 py-0.5 rounded shrink-0">Черновик</span>
                            )}
                            <span className="text-[10px] text-muted shrink-0">{new Date(item.created_at).toLocaleDateString("ru")}</span>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
