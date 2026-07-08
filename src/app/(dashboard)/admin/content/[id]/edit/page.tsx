"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import ContentEditor from "@/components/content-editor";

export default function EditContentPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const res = await fetch(`/api/content/${params.id}`);
      if (!res.ok) { router.replace("/admin/content"); return; }
      setItem(await res.json());
      setLoading(false);
    })();
  }, []);

  const handleDelete = async () => {
    if (!confirm("Удалить этот материал?")) return;
    const res = await fetch(`/api/content/${params.id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/content");
  };

  if (loading) return <div className="text-center py-16 text-muted">Загрузка...</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/content" className="text-muted hover:text-accent">← Назад</Link>
        <h1 className="text-2xl font-bold text-accent">Редактировать</h1>
        <button onClick={handleDelete} className="ml-auto text-sm text-red-500 hover:text-red-700">
          Удалить
        </button>
      </div>
      <div className="glass-card p-6">
        <ContentEditor initial={item} />
      </div>
    </div>
  );
}
