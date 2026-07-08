"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function NewLessonForm({
  courseId,
  orderIndex,
}: {
  courseId: string;
  orderIndex: number;
}) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("lessons")
      .insert({ course_id: courseId, title, order_index: orderIndex })
      .select()
      .single();

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setTitle("");
    setLoading(false);
    router.push(`/admin/lessons/${data.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Название нового урока"
        className="flex-1 px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 transition-all"
      />
      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="btn-gradient px-4 py-2 text-sm font-medium disabled:opacity-50 transition-all duration-200"
      >
        {loading ? "..." : "+ Урок"}
      </button>
    </form>
  );
}
