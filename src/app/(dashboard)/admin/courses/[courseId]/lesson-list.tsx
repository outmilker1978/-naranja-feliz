"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Lesson {
  id: string;
  title: string;
  order_index: number;
  published: boolean;
  cover_url?: string | null;
  description?: string | null;
}

export function LessonList({ lessons: initial }: { lessons: Lesson[] }) {
  const [lessons, setLessons] = useState(initial);
  const supabase = createClient();
  const router = useRouter();

  const moveLesson = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= lessons.length) return;
    const arr = [...lessons];
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    arr.forEach((l, i) => { l.order_index = i; });
    setLessons(arr);
    for (const l of arr) {
      await supabase.from("lessons").update({ order_index: l.order_index }).eq("id", l.id);
    }
    router.refresh();
  };

  const togglePublish = async (lesson: Lesson) => {
    const next = !lesson.published;
    await supabase.from("lessons").update({ published: next }).eq("id", lesson.id);
    setLessons(lessons.map(l => l.id === lesson.id ? { ...l, published: next } : l));
    router.refresh();
  };

  return (
    <div className="space-y-2 mb-6">
      {lessons.length === 0 && (
        <p className="text-zinc-400 text-sm">Пока нет уроков. Добавь первый!</p>
      )}
      {lessons.map((lesson, i) => (
        <div key={lesson.id} className="flex items-center gap-2 group">
          <div className="flex flex-col gap-0.5">
            <button onClick={() => moveLesson(i, -1)} disabled={i === 0} className="text-zinc-300 hover:text-secondary disabled:opacity-20 text-[10px] leading-none">▲</button>
            <button onClick={() => moveLesson(i, 1)} disabled={i === lessons.length - 1} className="text-zinc-300 hover:text-secondary disabled:opacity-20 text-[10px] leading-none">▼</button>
          </div>
          <Link
            href={`/admin/lessons/${lesson.id}`}
            className="flex-1 block glass-card hover:shadow-sm transition-all duration-200"
          >
            <div className="p-4 flex items-start gap-3">
              {lesson.cover_url && (
                <div className="w-60 h-40 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                  <img src={lesson.cover_url} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-zinc-400 w-6 shrink-0">{i + 1}.</span>
                  <span className="font-medium text-zinc-800 truncate">{lesson.title}</span>
                  {lesson.published
                    ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0">опубликован</span>
                    : <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full shrink-0">черновик</span>
                  }
                    <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePublish(lesson); }}
                    className={`text-xs ml-1 shrink-0 underline ${lesson.published ? "text-zinc-400 hover:text-red-500" : "text-green-600 hover:text-green-700"}`}
                  >
                    {lesson.published ? "снять" : "опубликовать"}
                  </button>
                </div>
                {lesson.description && <p className="text-sm mt-1 ml-9"><span className="font-semibold text-zinc-700">{lesson.description}</span></p>}
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
