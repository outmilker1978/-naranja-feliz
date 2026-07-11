"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Newspaper, FileText, Megaphone, Sparkles, Heart, Star, HelpCircle, Plus, PlusCircle, Layout } from "lucide-react";

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
  cover_image?: string;
  block_id?: string;
  profiles?: { full_name: string; avatar_url: string | null };
}

interface ContentBlock {
  id: string;
  type: string;
  label: string;
  sort_order: number;
  status: string;
  content: ContentItem[];
}

interface SectionBlock {
  key: string;
  label: string;
  type: string;
  category: string;
  sort_order: number;
  locked: boolean;
  collection?: boolean;
  items: ContentItem[];
  blockId?: string;
}

const TYPE_LABELS: Record<string, string> = {
  news: "Новость", article: "Статья", ad: "Реклама", page_section: "Секция",
};
const CATEGORY_LABELS: Record<string, string> = {
  hero: "Hero", features: "Преимущества", about: "О школе", testimonials: "Отзывы", faq: "FAQ", cta: "CTA",
};

const STATIC_BLOCK_DEFS = [
  { type: "page_section", category: "hero", label: "Hero", locked: true },
  { type: "page_section", category: "features", label: "Преимущества" },
  { type: "page_section", category: "about", label: "О школе" },
  { type: "page_section", category: "testimonials", label: "Отзывы" },
  { type: "page_section", category: "faq", label: "FAQ" },
  { type: "news", label: "Новости", collection: true },
  { type: "page_section", category: "cta", label: "CTA", locked: true },
];

const COLLECTION_TYPES = ["ad", "article"];

export default function ContentListPage() {
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [filter, setFilter] = useState("");

  const fetchAll = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }
    try {
      const params = filter ? `?type=${filter}` : "";
      const [itemsRes, blocksRes] = await Promise.all([
        fetch(`/api/content${params}`),
        fetch(`/api/content-blocks${params.startsWith("?type=") && COLLECTION_TYPES.includes(filter) ? params : ""}`),
      ]);
      if (itemsRes.ok) setItems(await itemsRes.json());
      if (blocksRes.ok) setBlocks(await blocksRes.json());
    } catch {}
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const buildSectionBlocks = (allItems: ContentItem[], allBlocks: ContentBlock[]): SectionBlock[] => {
    const result: SectionBlock[] = [];

    // Static blocks (page_sections + news)
    for (const def of STATIC_BLOCK_DEFS) {
      let blockItems: ContentItem[];
      if (def.collection) {
        blockItems = allItems.filter(i => i.type === def.type);
      } else {
        blockItems = allItems.filter(i => i.type === def.type && i.category === def.category);
      }
      if (blockItems.length === 0) continue;
      result.push({
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

    // Dynamic blocks from content_blocks (ad, article)
    for (const block of allBlocks) {
      result.push({
        key: `cb-${block.id}`,
        label: block.label,
        type: block.type,
        category: "",
        sort_order: block.sort_order,
        locked: false,
        collection: true,
        items: block.content ?? [],
        blockId: block.id,
      });
    }

    return result.sort((a, b) => {
      if (a.category === "hero") return -1;
      if (b.category === "hero") return 1;
      if (a.category === "cta") return 1;
      if (b.category === "cta") return -1;
      return a.sort_order - b.sort_order;
    });
  };

  const [sectionBlocks, setSectionBlocks] = useState<SectionBlock[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSectionBlocks(buildSectionBlocks(items, blocks));
  }, [items, blocks]);

  const moveBlock = async (blockIdx: number, direction: "up" | "down") => {
    const sb = sectionBlocks[blockIdx];
    if (sb.locked || reordering) return;

    const swapIdx = direction === "up" ? blockIdx - 1 : blockIdx + 1;
    if (swapIdx < 0 || swapIdx >= sectionBlocks.length) return;
    if (sectionBlocks[swapIdx].locked) return;

    setReordering(true);
    const other = sectionBlocks[swapIdx];
    const tempOrder = sb.sort_order;
    const swapOrder = other.sort_order;

    // Dynamic blocks: reorder via content_blocks API
    if (sb.blockId && other.blockId) {
      const res = await fetch("/api/content-blocks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            { id: sb.blockId, sort_order: swapOrder },
            { id: other.blockId, sort_order: tempOrder },
          ],
        }),
      });
      if (res.ok) { await fetchAll(); setReordering(false); }
      else setReordering(false);
      return;
    }

    // Global reindex: assign ALL blocks sequential sort_orders by visual position
    // This prevents jumping when sort_orders overlap across blocks
    const newBlocks = [...sectionBlocks];
    const temp = newBlocks[blockIdx];
    newBlocks[blockIdx] = newBlocks[swapIdx];
    newBlocks[swapIdx] = temp;

    const staticItems: { id: string; sort_order: number }[] = [];
    const dynamicItems: { id: string; sort_order: number }[] = [];

    // Skip locked blocks (hero, cta) — they keep hardcoded positions
    const reindexedBlocks = newBlocks.filter(b => !b.locked);
    reindexedBlocks.forEach((b, idx) => {
      const base = idx * 1000;
      if (b.blockId) {
        dynamicItems.push({ id: b.blockId, sort_order: base });
      } else if (b.collection) {
        const minSort = Math.min(...(b.items as any[]).map((x: any) => x.sort_order));
        (b.items as any[]).forEach((it: any) => {
          staticItems.push({ id: it.id, sort_order: base + (it.sort_order - minSort) });
        });
      } else {
        staticItems.push({ id: (b.items as any[])[0]?.id, sort_order: base });
      }
    });

    if (staticItems.length > 0) {
      await fetch("/api/content/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: staticItems }),
      });
    }
    if (dynamicItems.length > 0) {
      await fetch("/api/content-blocks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: dynamicItems }),
      });
    }
    await fetchAll();
    setReordering(false);
  };

  const moveItemInBlock = async (blockIdx: number, itemIdx: number, direction: "up" | "down") => {
    const sb = sectionBlocks[blockIdx];
    const swapIdx = direction === "up" ? itemIdx - 1 : itemIdx + 1;
    if (swapIdx < 0 || swapIdx >= sb.items.length || reordering) return;

    setReordering(true);
    // Build new items array with swapped positions
    const newItems = [...sb.items];
    const tmp = newItems[itemIdx];
    newItems[itemIdx] = newItems[swapIdx];
    newItems[swapIdx] = tmp;

    // Reassign sequential sort_orders for ALL items in the block
    const reordered = newItems.map((it, ii) => ({ id: it.id, sort_order: ii }));

    const res = await fetch("/api/content/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: reordered }),
    });
    if (!res.ok) {
      const err = await res.json();
      console.error("Reorder failed:", err);
      alert("Ошибка: " + (err.error || res.status));
      setReordering(false);
      return;
    }

    // Update sectionBlocks directly and refresh from server
    const newBlocks = sectionBlocks.map((b, i) => {
      if (i !== blockIdx) return b;
      return { ...b, items: newItems };
    });
    setSectionBlocks(newBlocks);
    await fetchAll();
    setReordering(false);
  };

  const createBlock = async (type: string) => {
    const label = prompt(`Название блока "${TYPE_LABELS[type] ?? type}":`);
    if (!label) return;
    const res = await fetch("/api/content-blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, label }),
    });
    if (res.ok) {
      fetchAll();
    } else {
      const err = await res.json();
      alert("Ошибка: " + (err.error || "неизвестная"));
    }
  };

  if (loading) return <div className="text-center py-16 text-muted">Загрузка...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-accent">Контент портала</h1>
      </div>

      <div className="card p-3 mb-6 flex gap-2 flex-wrap">
        {["", "news", "article", "ad", "page_section"].map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${filter === t ? "bg-primary-500 text-white" : "btn-ghost"}`}>
            {t ? TYPE_LABELS[t] ?? t : "Все"}
          </button>
        ))}
      </div>

      {/* Create buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/admin/content/new?type=news"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-green-300 text-green-700 hover:bg-green-50 transition-colors text-sm font-medium">
          <Newspaper className="w-4 h-4" /> + Новость
        </Link>
        <Link href="/admin/content/new?type=article"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-orange-300 text-orange-700 hover:bg-orange-50 transition-colors text-sm font-medium">
          <FileText className="w-4 h-4" /> + Статья
        </Link>
        <Link href="/admin/content/new?type=ad"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-purple-300 text-purple-700 hover:bg-purple-50 transition-colors text-sm font-medium">
          <Megaphone className="w-4 h-4" /> + Реклама
        </Link>
        <Link href="/admin/content/new?type=page_section"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors text-sm font-medium">
          <Layout className="w-4 h-4" /> + Секция
        </Link>
        <button onClick={() => createBlock("ad")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-purple-300 text-purple-700 hover:bg-purple-50 transition-colors text-sm font-medium">
          <Megaphone className="w-4 h-4" /> + Блок рекламы
        </button>
        <button onClick={() => createBlock("article")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-orange-300 text-orange-700 hover:bg-orange-50 transition-colors text-sm font-medium">
          <FileText className="w-4 h-4" /> + Блок статей
        </button>
      </div>

      {sectionBlocks.length === 0 ? (
        <p className="text-center py-16 text-muted">Нет записей</p>
      ) : (
        <div className="space-y-3">
          {sectionBlocks.map((sb, bi) => {
            const siblings = sectionBlocks.filter(b => !b.locked);
            const idx = siblings.findIndex(b => b.key === sb.key);
            const first = idx <= 0;
            const last = idx < 0 || idx >= siblings.length - 1;
            const isExpanded = expanded[sb.key] ?? false;

            return (
              <div key={sb.key} className="card overflow-hidden">
                <div className="p-4 flex items-center gap-4">
                  <div className="flex flex-col gap-1 shrink-0">
                    <button type="button" onClick={() => moveBlock(bi, "up")}
                      disabled={sb.locked || first || reordering}
                      className="w-6 h-6 flex items-center justify-center rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed">▲</button>
                    <button type="button" onClick={() => moveBlock(bi, "down")}
                      disabled={sb.locked || last || reordering}
                      className="w-6 h-6 flex items-center justify-center rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed">▼</button>
                  </div>

                  {sb.blockId ? (
                    <Link href={`/admin/content/block/${sb.blockId}`}
                      className="flex-1 min-w-0 flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1 flex gap-3 items-start">
                        {sb.category === "hero" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FF4D2D,#FF6B4A)", color: "white" }}><Star className="w-6 h-6" /></div>}
                        {sb.category === "cta" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FF8C2E,#F5C800)", color: "white" }}><Sparkles className="w-6 h-6" /></div>}
                        {sb.category === "features" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#EEF2FF,#E0E7FF)", color: "#6366F1" }}><Sparkles className="w-6 h-6" /></div>}
                        {sb.category === "about" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FFF1F2,#FFE4E6)", color: "#F43F5E" }}><Heart className="w-6 h-6" /></div>}
                        {sb.category === "testimonials" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FFF7ED,#FFEDD5)", color: "#F97316" }}><Star className="w-6 h-6" /></div>}
                        {sb.category === "faq" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#F0FDF4,#DCFCE7)", color: "#16A34A" }}><HelpCircle className="w-6 h-6" /></div>}
                        {sb.type === "news" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "#F0FDF4", color: "#16A34A" }}><Newspaper className="w-6 h-6" /></div>}
                        {sb.type === "article" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "#FFF7ED", color: "#EA580C" }}><FileText className="w-6 h-6" /></div>}
                        {sb.type === "ad" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "#F5F3FF", color: "#7C3AED" }}><Megaphone className="w-6 h-6" /></div>}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-accent truncate">{sb.label}</h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted flex-wrap">
                            <span className={`badge ${sb.type === "ad" ? "badge-purple" : sb.type === "article" ? "badge-orange" : "badge-blue"}`}>
                              {TYPE_LABELS[sb.type] ?? sb.type}
                            </span>
                            {sb.category && sb.type === "page_section" && <span className="text-xs text-zinc-400">{CATEGORY_LABELS[sb.category] ?? sb.category}</span>}
                            <span className="text-xs text-zinc-400">{sb.items.length} элемент{(sb.items.length !== 1) ? "ов" : ""}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div onClick={() => setExpanded({ ...expanded, [sb.key]: !isExpanded })}
                      className="flex-1 min-w-0 flex items-start justify-between gap-4 cursor-pointer">
                      <div className="min-w-0 flex-1 flex gap-3 items-start">
                        {sb.category === "hero" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FF4D2D,#FF6B4A)", color: "white" }}><Star className="w-6 h-6" /></div>}
                        {sb.category === "cta" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FF8C2E,#F5C800)", color: "white" }}><Sparkles className="w-6 h-6" /></div>}
                        {sb.category === "features" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#EEF2FF,#E0E7FF)", color: "#6366F1" }}><Sparkles className="w-6 h-6" /></div>}
                        {sb.category === "about" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FFF1F2,#FFE4E6)", color: "#F43F5E" }}><Heart className="w-6 h-6" /></div>}
                        {sb.category === "testimonials" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FFF7ED,#FFEDD5)", color: "#F97316" }}><Star className="w-6 h-6" /></div>}
                        {sb.category === "faq" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#F0FDF4,#DCFCE7)", color: "#16A34A" }}><HelpCircle className="w-6 h-6" /></div>}
                        {sb.type === "news" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "#F0FDF4", color: "#16A34A" }}><Newspaper className="w-6 h-6" /></div>}
                        {sb.type === "article" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "#FFF7ED", color: "#EA580C" }}><FileText className="w-6 h-6" /></div>}
                        {sb.type === "ad" && <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "#F5F3FF", color: "#7C3AED" }}><Megaphone className="w-6 h-6" /></div>}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-accent truncate">{sb.label}</h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted flex-wrap">
                            <span className={`badge ${sb.type === "ad" ? "badge-purple" : sb.type === "article" ? "badge-orange" : "badge-blue"}`}>
                              {TYPE_LABELS[sb.type] ?? sb.type}
                            </span>
                            {sb.category && sb.type === "page_section" && <span className="text-xs text-zinc-400">{CATEGORY_LABELS[sb.category] ?? sb.category}</span>}
                            <span className="text-xs text-zinc-400">{sb.items.length} элемент{(sb.items.length !== 1) ? "ов" : ""}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 shrink-0">
                    {sb.collection && (
                      <button onClick={(e) => { e.preventDefault(); setExpanded({ ...expanded, [sb.key]: !isExpanded }); }}
                        className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-600 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors">
                        {isExpanded ? "▲ Свернуть" : `▼ ${sb.items.length} элемент${sb.items.length !== 1 ? "ов" : ""}`}
                      </button>
                    )}
                  </div>
                </div>

                {/* Items list */}
                {(sb.collection ? isExpanded : true) && (
                  <div className="border-t border-zinc-100 bg-zinc-50/50">
                    {sb.items.map((item, ii) => {
                      const isPublished = item.status === "published";
                      const editUrl = sb.blockId
                        ? `/admin/content/block/${sb.blockId}/item/${item.id}`
                        : `/admin/content/${item.id}/edit`;
                      return (
                        <div key={item.id} className={`flex items-center gap-3 px-4 py-2.5 border-b border-zinc-100 last:border-b-0 ${isPublished ? "" : "opacity-50"}`}>
                          {sb.collection && (
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <button onClick={() => moveItemInBlock(bi, ii, "up")}
                                disabled={ii <= 0 || reordering}
                                className="w-5 h-5 flex items-center justify-center rounded bg-white hover:bg-zinc-100 text-zinc-400 disabled:opacity-20 disabled:cursor-not-allowed text-[10px]">▲</button>
                              <button onClick={() => moveItemInBlock(bi, ii, "down")}
                                disabled={ii < 0 || ii >= sb.items.length - 1 || reordering}
                                className="w-5 h-5 flex items-center justify-center rounded bg-white hover:bg-zinc-100 text-zinc-400 disabled:opacity-20 disabled:cursor-not-allowed text-[10px]">▼</button>
                            </div>
                          )}
                          <Link href={editUrl} className="flex-1 min-w-0 flex items-center gap-2">
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
                    {/* Add item button */}
                    {sb.blockId && (
                      <Link href={`/admin/content/block/${sb.blockId}/new`}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-primary-500 hover:bg-primary-50 transition-colors border-t border-dashed border-zinc-200">
                        <Plus className="w-4 h-4" /> Добавить {sb.type === "ad" ? "рекламу" : "статью"}
                      </Link>
                    )}
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
