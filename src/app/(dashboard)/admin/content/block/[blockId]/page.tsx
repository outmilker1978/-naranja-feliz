"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Megaphone, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ContentItem {
  id: string;
  title: string;
  status: string;
  sort_order: number;
  cover_image?: string;
  excerpt?: string;
  created_at: string;
}

interface ContentBlock {
  id: string;
  type: string;
  label: string;
  sort_order: number;
  status: string;
  content: ContentItem[];
}

export default function BlockEditorPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const blockId = params.blockId as string;

  const [block, setBlock] = useState<ContentBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const res = await fetch("/api/content-blocks");
      if (res.ok) {
        const blocks: ContentBlock[] = await res.json();
        const found = blocks.find(b => b.id === blockId);
        if (found) {
          setBlock(found);
          setLabel(found.label);
        }
      }
      setLoading(false);
    })();
  }, [blockId]);

  const saveSettings = async () => {
    setSaving(true);
    await fetch("/api/content-blocks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: blockId, label }),
    });
    setSaving(false);
  };

  if (loading) return <div className="text-center py-16 text-muted">Загрузка...</div>;
  if (!block) return <div className="text-center py-16 text-muted">Блок не найден</div>;

  const isAd = block.type === "ad";
  const icon = isAd ? <Megaphone className="w-5 h-5" /> : <FileText className="w-5 h-5" />;
  const color = isAd ? "purple" : "orange";
  const typeLabel = isAd ? "Реклама" : "Статья";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/admin/content" className="text-sm text-muted hover:text-accent inline-flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Назад к контенту
      </Link>

      <div className="card p-6 space-y-4">
        <h2 className="text-xl font-bold text-accent flex items-center gap-2">
          <span className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isAd ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"}`}>
            {icon}
          </span>
          Редактор блока {typeLabel}
        </h2>

        <div>
          <label className="block text-sm font-medium text-accent mb-1">Название блока</label>
          <input
            type="text" value={label}
            onChange={e => setLabel(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>

        <button onClick={saveSettings} disabled={saving}
          className="btn-gradient px-5 py-2 text-sm">
          {saving ? "Сохранение..." : "Сохранить название"}
        </button>
      </div>

      {/* Content items list */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-accent">Контенты блока</h3>
          <Link href={`/admin/content/block/${blockId}/new`}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors">
            <Plus className="w-4 h-4" /> Добавить {typeLabel.toLowerCase()}
          </Link>
        </div>

        {block.content.length === 0 ? (
          <p className="text-sm text-muted py-4">В блоке пока нет контента. Нажмите "Добавить" чтобы создать.</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {block.content.map((item, i) => (
              <Link key={item.id}
                href={`/admin/content/block/${blockId}/item/${item.id}`}
                className="flex items-center gap-3 py-3 hover:bg-zinc-50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <span className="text-xs text-zinc-400 w-5 shrink-0 text-right">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-accent truncate">{item.title || "(без названия)"}</p>
                  {item.excerpt && <p className="text-xs text-muted truncate">{item.excerpt}</p>}
                </div>
                {item.status === "published" ? (
                  <span className="text-[10px] text-green-600 bg-green-100 px-1.5 py-0.5 rounded shrink-0">Активен</span>
                ) : (
                  <span className="text-[10px] text-zinc-400 bg-zinc-200 px-1.5 py-0.5 rounded shrink-0">Черновик</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
