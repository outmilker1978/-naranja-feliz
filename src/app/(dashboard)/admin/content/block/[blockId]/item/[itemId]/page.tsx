"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import ContentEditor from "@/components/content-editor";

export default function EditBlockItemPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const blockId = params.blockId as string;
  const itemId = params.itemId as string;
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const res = await fetch(`/api/content/${itemId}`);
      if (!res.ok) { router.replace("/admin/content"); return; }
      setItem(await res.json());
      setLoading(false);
    })();
  }, [itemId]);

  const handleDelete = async () => {
    if (!confirm("Удалить этот материал?")) return;
    const res = await fetch(`/api/content/${itemId}`, { method: "DELETE" });
    if (res.ok) router.push(`/admin/content/block/${blockId}`);
  };

  if (loading) return <div className="text-center py-16 text-muted">Загрузка...</div>;

  return (
    <>
      <div className="border-b border-border/30 bg-white fixed top-[73px] left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center gap-3 px-4 sm:px-8 py-2.5">
          <Link href={`/admin/content/block/${blockId}`} className="text-sm font-semibold text-primary-500 hover:text-primary-600 transition-colors">
            ← Назад
          </Link>
          <h1 className="text-sm font-medium text-accent truncate">Редактировать</h1>
          <button onClick={handleDelete} className="ml-auto text-xs text-red-500 hover:text-red-700">
            Удалить
          </button>
        </div>
      </div>

      <div className="pt-14">
        <div className="glass-card p-6">
          <ContentEditor initial={item} blockId={blockId} />
        </div>
      </div>
    </>
  );
}
