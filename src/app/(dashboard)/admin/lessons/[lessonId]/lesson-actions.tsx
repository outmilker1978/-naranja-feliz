"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LessonActions({ lessonId, courseId, published: initialPublished, title: initialTitle, courseTitle, coverUrl: initialCoverUrl, description: initialDescription }: { lessonId: string; courseId: string; published: boolean; title: string; courseTitle: string; coverUrl: string | null; description: string | null }) {
  const [published, setPublished] = useState(initialPublished);
  const [toggling, setToggling] = useState(false);

  const [title, setTitle] = useState(initialTitle);
  const [editingTitle, setEditingTitle] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);

  const [description, setDescription] = useState(initialDescription ?? "");
  const [editingDescription, setEditingDescription] = useState(false);
  const [savingDescription, setSavingDescription] = useState(false);

  const [coverUrl, setCoverUrl] = useState(initialCoverUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();
  const router = useRouter();

  const togglePublish = async () => {
    setToggling(true);
    await supabase.from("lessons").update({ published: !published }).eq("id", lessonId);
    setPublished(!published);
    setToggling(false);
    router.refresh();
  };

  const saveTitle = async () => {
    if (!title.trim()) return;
    setSavingTitle(true);
    await supabase.from("lessons").update({ title }).eq("id", lessonId);
    setSavingTitle(false);
    setEditingTitle(false);
    router.refresh();
  };

  const saveDescription = async () => {
    setSavingDescription(true);
    await supabase.from("lessons").update({ description: description || null }).eq("id", lessonId);
    setSavingDescription(false);
    setEditingDescription(false);
    router.refresh();
  };

  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `lesson-cover-${lessonId}-${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("lesson-files").upload(fileName, file);
    if (error) { alert("Ошибка загрузки: " + error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("lesson-files").getPublicUrl(fileName);
    setCoverUrl(publicUrl);
    await supabase.from("lessons").update({ cover_url: publicUrl }).eq("id", lessonId);
    setUploading(false);
    router.refresh();
  };

  return (
    <div className="space-y-3 flex-1">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl font-bold text-accent border border-primary-300 rounded-lg px-3 py-1 w-full focus:outline-none focus:ring-2 focus:ring-primary-400"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") { setEditingTitle(false); setTitle(initialTitle); } }}
              />
              <button onClick={saveTitle} disabled={savingTitle} className="btn-gradient px-3 py-1.5 text-sm font-medium disabled:opacity-50 transition-all duration-200">{savingTitle ? "..." : "✓"}</button>
              <button onClick={() => { setEditingTitle(false); setTitle(initialTitle); }} className="text-zinc-400 px-2 py-1.5 rounded-lg text-sm hover:bg-zinc-100">✕</button>
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-accent cursor-pointer hover:underline" onClick={() => setEditingTitle(true)}>{title} ✎</h1>
          )}
          {editingDescription ? (
            <div className="flex items-center gap-2 mt-1">
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Краткое описание урока" className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 transition-all" autoFocus onKeyDown={(e) => { if (e.key === "Enter") saveDescription(); if (e.key === "Escape") { setEditingDescription(false); setDescription(initialDescription ?? ""); } }} />
              <button onClick={saveDescription} disabled={savingDescription} className="btn-gradient px-2 py-1 text-xs font-medium disabled:opacity-50 transition-all duration-200">{savingDescription ? "..." : "✓"}</button>
              <button onClick={() => { setEditingDescription(false); setDescription(initialDescription ?? ""); }} className="text-zinc-400 px-2 py-1 rounded text-xs hover:bg-zinc-100">✕</button>
            </div>
          ) : (
            <p className="text-sm mt-1 cursor-pointer" onClick={() => setEditingDescription(true)}>
              {description ? <><span className="font-semibold text-primary-500">Описание:</span> <span className="text-zinc-700">{description}</span> <span className="text-primary-400 text-xs">✎</span></> : <span className="text-zinc-400 hover:text-secondary">+ Добавить описание урока</span>}
            </p>
          )}
          <p className="text-zinc-400 text-xs mt-0.5">Курс: {courseTitle}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a href={`/courses/${courseId}/${lessonId}`} target="_blank" className="text-sm text-primary-500 hover:text-primary-500 underline">Предпросмотр →</a>
          <button onClick={togglePublish} disabled={toggling} className={`text-sm px-3 py-1 rounded-lg font-medium transition-colors disabled:opacity-50 ${published ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}>
            {published ? "✓ Опубликовано" : "Черновик"}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {coverUrl && <img src={coverUrl} alt="" className="h-20 rounded-lg object-cover border border-zinc-200" />}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadCover} className="hidden" />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="text-sm bg-zinc-100 text-zinc-600 px-3 py-1.5 rounded-lg hover:bg-zinc-200 disabled:opacity-50">{uploading ? "..." : "Загрузить обложку урока"}</button>
      </div>
    </div>
  );
}
