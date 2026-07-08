"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface ContentItem {
  id: string;
  type: string;
  category: string;
  title: string;
  status: string;
  author_id: string;
  scheduled_at: string | null;
  created_at: string;
  profiles: { full_name: string; avatar_url: string | null };
}

const TYPE_LABELS: Record<string, string> = {
  news: "Новость", article: "Статья", ad: "Реклама", page_section: "Секция",
};
const STATUS_LABELS: Record<string, string> = { draft: "Черновик", published: "Опубликован" };
const STATUS_COLORS: Record<string, string> = { draft: "badge badge-gray", published: "badge badge-green" };

export default function ContentListPage() {
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      try {
        const params = filter ? `?type=${filter}` : "";
        const res = await fetch(`/api/content${params}`);
        if (res.ok) setItems(await res.json());
      } catch {}
      setLoading(false);
    })();
  }, [filter]);

  if (loading) return <div className="text-center py-16 text-muted">Загрузка...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-accent">Контент портала</h1>
        <Link href="/admin/content/new" className="btn-gradient">
          + Создать
        </Link>
      </div>

      <div className="card p-3 mb-6 flex gap-2">
        {["", "news", "article", "ad", "page_section"].map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${filter === t ? "bg-primary-500 text-white" : "btn-ghost"}`}>
            {t ? TYPE_LABELS[t] ?? t : "Все"}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-center py-16 text-muted">Нет записей</p>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <Link key={item.id} href={`/admin/content/${item.id}/edit`}
              className="block card p-4 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-accent">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted">
                    <span className="badge badge-orange">{TYPE_LABELS[item.type] ?? item.type}</span>
                    <span className={STATUS_COLORS[item.status]}>{STATUS_LABELS[item.status] ?? item.status}</span>
                    {item.scheduled_at && <span>🕐 {new Date(item.scheduled_at).toLocaleDateString("ru")}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(item.status === "published" && (item.type === "news" || item.type === "article")) && (
                    <a href={`/content/${item.id}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary-500 hover:text-primary-600 whitespace-nowrap"
                      onClick={e => e.stopPropagation()}>
                      Читать ↗
                    </a>
                  )}
                  <span className="text-xs text-muted whitespace-nowrap">
                    {new Date(item.created_at).toLocaleDateString("ru")}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
