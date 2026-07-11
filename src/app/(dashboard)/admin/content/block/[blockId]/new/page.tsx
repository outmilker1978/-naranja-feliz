"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ContentEditor from "@/components/content-editor";

export default function NewBlockItemPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const blockId = params.blockId as string;
  const [block, setBlock] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const res = await fetch("/api/content-blocks");
      if (res.ok) {
        const blocks = await res.json();
        const found = blocks.find((b: any) => b.id === blockId);
        if (found) setBlock(found);
      }
      setLoading(false);
    })();
  }, [blockId]);

  if (loading) return <div className="text-center py-16 text-muted">Загрузка...</div>;
  if (!block) return <div className="text-center py-16 text-muted">Блок не найден</div>;

  const initial = { type: block.type, status: "draft" };

  return (
    <div>
      <div className="border-b border-border/30 bg-white fixed top-[73px] left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center gap-3 px-4 sm:px-8 py-2.5">
          <Link href={`/admin/content/block/${blockId}`} className="text-sm font-semibold text-primary-500 hover:text-primary-600">
            ← Назад
          </Link>
          <h1 className="text-sm font-medium text-accent truncate">Новый элемент — {block.label}</h1>
        </div>
      </div>
      <div className="pt-14">
        <div className="glass-card p-6">
          <ContentEditor initial={initial} blockId={blockId} />
        </div>
      </div>
    </div>
  );
}
