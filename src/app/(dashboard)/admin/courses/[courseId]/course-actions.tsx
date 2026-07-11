"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function CourseActions({
  courseId,
  published: initialPublished,
  title: initialTitle,
  description: initialDescription,
  level: initialLevel,
  imageUrl: initialImageUrl,
  access_mode: initialAccessMode,
}: {
  courseId: string;
  published: boolean;
  title: string;
  description: string | null;
  level: string;
  imageUrl: string | null;
  access_mode: string;
}) {
  const [published, setPublished] = useState(initialPublished);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [level, setLevel] = useState(initialLevel);
  const [accessMode, setAccessMode] = useState(initialAccessMode);
  const [imageUrl, setImageUrl] = useState(initialImageUrl ?? "");

  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `course-${courseId}-${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("lesson-files").upload(fileName, file);
    if (error) { alert("Ошибка загрузки: " + error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("lesson-files").getPublicUrl(fileName);
    setImageUrl(publicUrl);
    setUploading(false);
  };

  const togglePublish = async () => {
    await supabase.from("courses").update({ published: !published }).eq("id", courseId);
    setPublished(!published);
    router.refresh();
  };

  const saveCourse = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await supabase.from("courses").update({
      title,
      description: description || null,
      level,
      access_mode: accessMode,
      image_url: imageUrl || null,
    }).eq("id", courseId);
    setSaving(false);
    setEditing(false);
    router.refresh();
  };

  const deleteCourse = async () => {
    if (!confirm("Удалить курс? Это удалит все уроки и задания.")) return;
    await supabase.from("courses").delete().eq("id", courseId);
    router.push("/admin/courses");
    router.refresh();
  };

  if (editing) {
    return (
      <div className="glass-card p-5 bg-primary-50/50 space-y-3 w-full max-w-lg transition-all duration-200">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Название курса" className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 transition-all" />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Описание курса" className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 transition-all" />
        <select value={level} onChange={e => setLevel(e.target.value)} className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 transition-all">
          <option value="A1">A1 — Начальный</option>
          <option value="A2">A2 — Элементарный</option>
          <option value="B1">B1 — Средний</option>
          <option value="B2">B2 — Выше среднего</option>
          <option value="C1">C1 — Продвинутый</option>
        </select>
        <select value={accessMode} onChange={e => setAccessMode(e.target.value)} className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 transition-all">
          <option value="public">Публичный (без подписки)</option>
          <option value="subscription">По подписке</option>
        </select>
        <div className="flex items-start gap-3">
          {imageUrl && <img src={imageUrl} alt="" loading="lazy" className="w-14 h-14 rounded-lg object-cover shrink-0 border border-zinc-200" />}
          <div className="flex-1 space-y-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadImage} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-zinc-100 text-zinc-600 px-4 py-2 rounded-lg text-sm hover:bg-zinc-200 disabled:opacity-50">{uploading ? "Загрузка..." : "Загрузить с ПК"}</button>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="или вставь URL картинки" className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 transition-all" />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={saveCourse} disabled={saving} className="btn-gradient px-4 py-1.5 text-sm font-medium disabled:opacity-50 transition-all duration-200">{saving ? "..." : "Сохранить"}</button>
          <button onClick={() => { setEditing(false); setTitle(initialTitle); setDescription(initialDescription ?? ""); setLevel(initialLevel); setImageUrl(initialImageUrl ?? ""); }} className="text-zinc-500 px-4 py-1.5 rounded-lg text-sm hover:bg-zinc-100">Отмена</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => setEditing(true)} className="text-sm text-zinc-400 hover:text-blue-600 px-2 py-1">✎ Редактировать курс</button>
      <button
        onClick={togglePublish}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          published
            ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            : "bg-green-500 text-white hover:bg-green-600"
        }`}
      >
        {published ? "Снять с публикации" : "Опубликовать"}
      </button>
      <button
        onClick={deleteCourse}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
      >
        Удалить
      </button>
    </div>
  );
}
