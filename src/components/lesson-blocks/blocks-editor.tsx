"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TiptapEditor } from "@/components/tiptap-editor";
import { LessonBlock, BlockType, BLOCK_LABELS, BLOCK_DESCRIPTIONS, TextContent, ImageContent, VideoContent, FillBlankContent, ChoiceContent, OpenQuestionContent, AudioAnswerContent, DragOrderContent, ImagePickContent } from "./types";

function convertOldContent(html: string): string {
  return html
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&")
    .replace(/<span[^>]*data-answer="([^"]*)"[^>]*>.*?<\/span>/gi, (_, a) => `[[${a}]]`);
}

function BlockEditForm({ block, onSave, onCancel }: { block: Partial<LessonBlock>; onSave: (b: Partial<LessonBlock>) => void; onCancel: () => void }) {
  const type = block.type || "text";
  const content = block.content || {};

  const [html, setHtml] = useState((content as TextContent).html || "");
  const [imgSrc, setImgSrc] = useState((content as ImageContent).src || "");
  const [imgCaption, setImgCaption] = useState((content as ImageContent).caption || "");
  const [imgWidth, setImgWidth] = useState((content as ImageContent).width || "100%");
  const [videoSrc, setVideoSrc] = useState((content as VideoContent).src || "");
  const [videoType, setVideoType] = useState<"video" | "audio">((content as VideoContent).type || "video");
  const [videoCaption, setVideoCaption] = useState((content as VideoContent).caption || "");
  const [fillText, setFillText] = useState((content as FillBlankContent).text || "");
  const [choiceQuestion, setChoiceQuestion] = useState((content as ChoiceContent).question || "");
  const [choiceOptions, setChoiceOptions] = useState(((content as ChoiceContent).options || []).join("\n"));
  const [choiceCorrect, setChoiceCorrect] = useState(((content as ChoiceContent).correct || []).join(","));
  const [choiceMultiple, setChoiceMultiple] = useState((content as ChoiceContent).multiple || false);
  const [openQ, setOpenQ] = useState((content as OpenQuestionContent).question || "");
  const [audioPrompt, setAudioPrompt] = useState((content as AudioAnswerContent).prompt || "");
  const [dragSentence, setDragSentence] = useState((content as DragOrderContent).sentenceTemplate || "");
  const [pickQuestion, setPickQuestion] = useState((content as ImagePickContent).question || "");
  const [pickImages, setPickImages] = useState(JSON.stringify((content as ImagePickContent).images || []));
  const [pickCorrect, setPickCorrect] = useState(((content as ImagePickContent).correct || []).join(","));
  const [pickMultiple, setPickMultiple] = useState((content as ImagePickContent).multiple || false);

  const buildContent = (): any => {
    switch (type) {
      case "text": return { html };
      case "image": return { src: imgSrc, caption: imgCaption, width: imgWidth };
      case "video": return { src: videoSrc, type: videoType, caption: videoCaption || undefined };
      case "fill_blank": return { text: fillText };
      case "choice":         return { question: choiceQuestion, options: choiceOptions.split("\n").map(s => s.trim()).filter(Boolean), correct: choiceCorrect.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n)), multiple: choiceMultiple };
      case "open_question": return { question: openQ };
      case "audio_answer": return { prompt: audioPrompt };
      case "video_answer": return { prompt: audioPrompt };
      case "drag_order": return { sentenceTemplate: dragSentence };
      case "image_pick": {
        let images: { src: string; label: string }[] = [];
        try { images = JSON.parse(pickImages); } catch {}
        return { question: pickQuestion, images, correct: pickCorrect.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n)), multiple: pickMultiple };
      }
      default: return {};
    }
  };

  return (
    <div className="border border-primary-200 rounded-xl p-4 bg-primary-50/50 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs bg-primary-50 text-primary-500 px-2 py-0.5 rounded-full">{BLOCK_LABELS[type as BlockType]}</span>
      </div>

      {type === "text" && <TiptapEditor content={html} onChange={setHtml} placeholder="Напиши текст урока..." />}

      {type === "image" && (
        <>
          <div className="flex gap-2">
            <input value={imgSrc} onChange={e => setImgSrc(e.target.value)} placeholder="URL изображения" className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg text-sm" />
            <label className="cursor-pointer bg-zinc-100 hover:bg-zinc-200 text-zinc-600 px-3 py-2 rounded-lg text-sm border border-zinc-300 shrink-0">
              Загрузить
              <input type="file" accept="image/*" className="hidden" onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const body = new FormData();
                body.append("file", file);
                const res = await fetch("/api/upload-file", { method: "POST", body });
                const data = await res.json();
                if (data.url) setImgSrc(data.url);
                else alert("Ошибка загрузки: " + (data.error || "неизвестная"));
              }} />
            </label>
          </div>
          <div className="flex gap-2">
            <input value={imgWidth} onChange={e => setImgWidth(e.target.value)} placeholder="Ширина (100%, 600px, etc)" className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg text-sm" />
            <select value={imgWidth} onChange={e => setImgWidth(e.target.value)} className="px-4 py-2 border border-zinc-300 rounded-lg text-sm">
              <option value="100%">100%</option>
              <option value="75%">75%</option>
              <option value="50%">50%</option>
              <option value="25%">25%</option>
              <option value="600px">600px</option>
              <option value="400px">400px</option>
            </select>
          </div>
          <input value={imgCaption} onChange={e => setImgCaption(e.target.value)} placeholder="Подпись (необязательно)" className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm" />
        </>
      )}

      {type === "video" && (
        <>
          <div className="flex gap-2">
            <input value={videoSrc} onChange={e => setVideoSrc(e.target.value)} placeholder="URL видео/аудио" className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg text-sm" />
            <label className="cursor-pointer bg-zinc-100 hover:bg-zinc-200 text-zinc-600 px-3 py-2 rounded-lg text-sm border border-zinc-300 shrink-0">
              Загрузить
              <input type="file" accept="video/*,audio/*" className="hidden" onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const body = new FormData();
                body.append("file", file);
                const res = await fetch("/api/upload-file", { method: "POST", body });
                const data = await res.json();
                if (data.url) setVideoSrc(data.url);
                else alert("Ошибка загрузки: " + (data.error || "неизвестная"));
              }} />
            </label>
          </div>
          <select value={videoType} onChange={e => setVideoType(e.target.value as "video" | "audio")} className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm">
            <option value="video">Видео</option>
            <option value="audio">Аудио</option>
          </select>
          <input value={videoCaption} onChange={e => setVideoCaption(e.target.value)} placeholder="Описание / задание к видео" className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm" />
        </>
      )}

      {type === "fill_blank" && (
        <textarea value={fillText} onChange={e => setFillText(e.target.value)} placeholder="Текст с [[пропусками]] для заполнения" className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm min-h-[80px]" />
      )}

      {type === "choice" && (
        <>
          <input value={choiceQuestion} onChange={e => setChoiceQuestion(e.target.value)} placeholder="Вопрос" className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm" />
          <textarea value={choiceOptions} onChange={e => setChoiceOptions(e.target.value)} placeholder="Варианты ответов (каждый с новой строки)" className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm min-h-[80px]" />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={choiceMultiple} onChange={e => setChoiceMultiple(e.target.checked)} /> Несколько ответов</label>
              <div className="text-sm text-zinc-500">Верные: <input value={choiceCorrect} onChange={e => setChoiceCorrect(e.target.value)} placeholder="номера (1, 2, 3)" className="w-24 px-2 py-1 border border-zinc-300 rounded text-xs" /></div>
            </div>
        </>
      )}

      {type === "open_question" && (
        <textarea value={openQ} onChange={e => setOpenQ(e.target.value)} placeholder="Вопрос для ученика" className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm min-h-[80px]" />
      )}

      {(type === "audio_answer" || type === "video_answer") && (
        <textarea value={audioPrompt} onChange={e => setAudioPrompt(e.target.value)} placeholder="Задание (что записать / сказать)" className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm min-h-[60px]" />
      )}

      {type === "drag_order" && (
        <textarea value={dragSentence} onChange={e => setDragSentence(e.target.value)}
          placeholder='Напиши предложение. Слова в [скобках] станут пустыми слотами. Пример: [Дорога] [ложка] к [обеду]'
          className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm min-h-[60px]" />
      )}

      {type === "image_pick" && (
        <>
          <input value={pickQuestion} onChange={e => setPickQuestion(e.target.value)} placeholder="Вопрос" className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm" />
          <div className="space-y-2">
            {(() => {
              let images: { src: string; label: string }[] = [];
              try { images = JSON.parse(pickImages); } catch {}
              return images.map((img, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1">
                    <div className="flex gap-2">
                      <input value={img.src} onChange={e => {
                        const arr = [...images]; arr[i] = { ...arr[i], src: e.target.value };
                        setPickImages(JSON.stringify(arr));
                      }} placeholder="URL изображения" className="flex-1 px-3 py-1.5 border border-zinc-300 rounded text-sm" />
                      <label className="cursor-pointer bg-zinc-100 hover:bg-zinc-200 text-zinc-600 px-2 py-1.5 rounded text-sm border border-zinc-300 shrink-0">
                        Загрузить
                        <input type="file" accept="image/*" className="hidden" onChange={async e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const body = new FormData();
                          body.append("file", file);
                          const res = await fetch("/api/upload-file", { method: "POST", body });
                          const data = await res.json();
                          if (data.url) {
                            const arr = [...images]; arr[i] = { ...arr[i], src: data.url };
                            setPickImages(JSON.stringify(arr));
                          } else alert("Ошибка загрузки: " + (data.error || "неизвестная"));
                        }} />
                      </label>
                    </div>
                    <input value={img.label} onChange={e => {
                      const arr = [...images]; arr[i] = { ...arr[i], label: e.target.value };
                      setPickImages(JSON.stringify(arr));
                    }} placeholder="Подпись" className="w-full px-3 py-1.5 border border-zinc-300 rounded text-sm" />
                  </div>
                  <button onClick={() => {
                    const arr = images.filter((_, j) => j !== i);
                    setPickImages(JSON.stringify(arr));
                  }} className="text-red-400 hover:text-red-600 text-sm mt-1">✕</button>
                </div>
              ));
            })()}
            <button onClick={() => {
              let images: { src: string; label: string }[] = [];
              try { images = JSON.parse(pickImages); } catch {}
              setPickImages(JSON.stringify([...images, { src: "", label: "" }]));
            }} className="text-sm text-primary-500 hover:underline">+ Добавить изображение</button>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pickMultiple} onChange={e => setPickMultiple(e.target.checked)} /> Несколько ответов</label>
            <div className="text-sm text-zinc-500">Верные: <input value={pickCorrect} onChange={e => setPickCorrect(e.target.value)} placeholder="номера (1, 2, 3)" className="w-24 px-2 py-1 border border-zinc-300 rounded text-xs" /></div>
          </div>
          {pickImages && (() => {
            let images: { src: string; label: string }[] = [];
            try { images = JSON.parse(pickImages); } catch {}
            return images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="text-xs text-zinc-400">
                    {i + 1}) {img.src ? <img src={img.src} alt="" className="w-12 h-12 object-cover rounded border" /> : <span className="text-zinc-300">нет URL</span>}
                  </div>
                ))}
              </div>
            );
          })()}
        </>
      )}

      <div className="flex gap-2 pt-2">
        <button onClick={() => onSave({ ...block, content: buildContent() })} className="bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-600">Сохранить</button>
        <button onClick={onCancel} className="text-zinc-500 px-4 py-1.5 rounded-lg text-sm hover:bg-zinc-100">Отмена</button>
      </div>
    </div>
  );
}

export function BlocksEditor({ lessonId, initialBlocks }: { lessonId: string; initialBlocks: LessonBlock[] }) {
  const [blocks, setBlocks] = useState<LessonBlock[]>(initialBlocks);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState<BlockType>("text");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const saveBlock = async (block: Partial<LessonBlock>, index: number) => {
    setSaving(true);
    if (block.id) {
      await supabase.from("lesson_blocks").update({ content: block.content }).eq("id", block.id);
    } else {
      await supabase.from("lesson_blocks").insert({
        lesson_id: lessonId,
        type: block.type,
        content: block.content,
        order_index: index,
      });
    }
    setBlocks(blocks.map((b, i) => i === index ? { ...b, ...block } as LessonBlock : b));
    setEditingIndex(null);
    setSaving(false);
    router.refresh();
  };

  const addBlock = async () => {
    setSaving(true);
    const defaultContent: Record<string, any> = {
      text: { html: "" },
      image: { src: "", caption: "", width: "100%" },
      video: { src: "", type: "video" },
      fill_blank: { text: "" },
      choice: { question: "", options: [], correct: [], multiple: false },
      open_question: { question: "" },
      audio_answer: { prompt: "" },
      video_answer: { prompt: "" },
      drag_order: { sentenceTemplate: "" },
      image_pick: { question: "", images: [], correct: [], multiple: false },
    };
    const { data } = await supabase.from("lesson_blocks").insert({
      lesson_id: lessonId,
      type: newType,
      content: defaultContent[newType] || {},
      order_index: blocks.length,
    }).select().single();

    if (data) {
      setBlocks([...blocks, data as LessonBlock]);
      setEditingIndex(blocks.length);
    }
    setShowAdd(false);
    setSaving(false);
    router.refresh();
  };

  const deleteBlock = async (blockId: string) => {
    if (!confirm("Удалить блок?")) return;
    await supabase.from("lesson_blocks").delete().eq("id", blockId);
    setBlocks(blocks.filter(b => b.id !== blockId));
    router.refresh();
  };

  const moveBlock = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const arr = [...blocks];
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    arr.forEach((b, i) => { b.order_index = i; });
    setBlocks(arr);
    for (const b of arr) {
      await supabase.from("lesson_blocks").update({ order_index: b.order_index }).eq("id", b.id);
    }
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-800">Блоки урока ({blocks.length})</h2>
      </div>

      {blocks.map((block, i) => (
        <div key={block.id} className="relative group border border-zinc-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs bg-primary-50 text-primary-500 px-2 py-0.5 rounded-full font-medium">{BLOCK_LABELS[block.type]}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => moveBlock(i, -1)} disabled={i === 0} className="text-zinc-400 hover:text-secondary disabled:opacity-30 text-sm px-1">↑</button>
              <button onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1} className="text-zinc-400 hover:text-secondary disabled:opacity-30 text-sm px-1">↓</button>
              {editingIndex !== i && <button onClick={() => setEditingIndex(i)} className="text-zinc-400 hover:text-blue-600 text-sm px-1">✎</button>}
              <button onClick={() => deleteBlock(block.id)} className="text-zinc-400 hover:text-red-600 text-sm px-1">✕</button>
            </div>
          </div>

          {editingIndex === i ? (
            <BlockEditForm
              block={block}
              onSave={(b) => saveBlock(b, i)}
              onCancel={() => setEditingIndex(null)}
            />
          ) : (
            <div className="text-sm text-zinc-600">
              {block.type === "text" && <div className="prose prose-sm max-w-none line-clamp-3" dangerouslySetInnerHTML={{ __html: convertOldContent((block.content as TextContent).html || "") }} />}
              {block.type === "image" && <span className="text-zinc-400">{(block.content as ImageContent).caption || (block.content as ImageContent).src} {(block.content as ImageContent).width && <span className="text-zinc-300">({(block.content as ImageContent).width})</span>}</span>}
              {block.type === "video" && <span>{(block.content as VideoContent).caption || (block.content as VideoContent).src}</span>}
              {block.type === "fill_blank" && <span>{(block.content as FillBlankContent).text}</span>}
              {block.type === "choice" && <span>{(block.content as ChoiceContent).question}</span>}
              {block.type === "open_question" && <span>{(block.content as OpenQuestionContent).question}</span>}
              {block.type === "audio_answer" && <span>{(block.content as AudioAnswerContent).prompt}</span>}
              {block.type === "video_answer" && <span>{(block.content as AudioAnswerContent).prompt}</span>}
              {block.type === "drag_order" && (
                <div>
                  <p className="text-sm text-zinc-500">Шаблон:</p>
                  <p className="text-sm mt-1">{(block.content as DragOrderContent).sentenceTemplate}</p>
                </div>
              )}
              {block.type === "image_pick" && (
                <div>
                  <p className="text-sm font-medium">{(block.content as ImagePickContent).question}</p>
                  <p className="text-xs text-zinc-400">{(block.content as ImagePickContent).images?.length || 0} изображений</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {showAdd ? (
        <div className="border-2 border-dashed border-primary-300 rounded-xl p-4 space-y-3">
          <select value={newType} onChange={e => setNewType(e.target.value as BlockType)} className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm">
            {Object.entries(BLOCK_LABELS).map(([k, v]) => (
              <option key={k} value={k} title={BLOCK_DESCRIPTIONS[k as BlockType]}>{v} — {BLOCK_DESCRIPTIONS[k as BlockType]}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={addBlock} disabled={saving} className="bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50">Добавить</button>
            <button onClick={() => setShowAdd(false)} className="text-zinc-500 px-4 py-1.5 rounded-lg text-sm hover:bg-zinc-100">Отмена</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} className="w-full border-2 border-dashed border-zinc-300 rounded-xl py-3 text-sm text-zinc-400 hover:text-secondary hover:border-primary-300 transition-colors">
          + Добавить блок
        </button>
      )}
    </div>
  );
}
