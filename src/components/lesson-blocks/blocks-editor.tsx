"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { proxyImgUrl } from "@/lib/image-proxy";
import { ChevronUp, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { TiptapEditor } from "@/components/tiptap-editor";
import { LessonBlock, BlockType, BLOCK_LABELS, BLOCK_DESCRIPTIONS, TextContent, ImageContent, VideoContent, FillBlankContent, ChoiceContent, OpenQuestionContent, AudioAnswerContent, DragOrderContent, ImagePickContent, GroupDragContent, MemoryContent } from "./types";
import { MediaAsset } from "./media-asset";

function convertOldContent(html: string): string {
  return html
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&")
    .replace(/<span[^>]*data-answer="([^"]*)"[^>]*>.*?<\/span>/gi, (_, a) => `[[${a}]]`);
}

function VideoBlockPreview({ block }: { block: LessonBlock }) {
  const c = block.content as VideoContent;
  const src = c.src;
  const isEmbed = /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(src) || src.includes("rutube.ru/video/") || /(?:vk\.com|vkvideo\.ru)\/video/.test(src);
  const isCloud = /(?:drive\.google\.com\/file\/d\/|yadi\.sk|disk\.yandex\.)/.test(src);
  const mediaSrc = proxyImgUrl(src) ?? src;
  return (
    <div className="space-y-1">
      {c.caption && <p className="font-medium text-zinc-700 text-sm">{c.caption}</p>}
      {isEmbed ? (
        <span className="text-zinc-400 text-sm">Видео по внешней ссылке (плеер — на уроке)</span>
      ) : isCloud ? (
        <a href={src} target="_blank" className="text-primary-500 hover:underline text-sm">Открыть на внешнем сайте</a>
      ) : c.type === "audio" || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(src) ? (
        <MediaAsset src={mediaSrc} variant="audio" className="max-w-sm" />
      ) : (
        <MediaAsset src={mediaSrc} variant="video" className="max-w-sm rounded-lg" />
      )}
    </div>
  );
}

function BlockEditForm({ block, onSave, onCancel, saving }: { block: Partial<LessonBlock>; onSave: (b: Partial<LessonBlock>) => void; onCancel: () => void; saving?: boolean }) {
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

  const [groupInst, setGroupInst] = useState((content as GroupDragContent).instruction || "");
  const [groupGroups, setGroupGroups] = useState(JSON.stringify((content as GroupDragContent).groups || []));
  const [groupLayout, setGroupLayout] = useState<"columns" | "table">((content as GroupDragContent).layout || "columns");

  const [memSize, setMemSize] = useState<12 | 16 | 20>((content as MemoryContent).size || 12);
  const [memPairs, setMemPairs] = useState(JSON.stringify((content as MemoryContent).pairs || []));
  const [memInst, setMemInst] = useState((content as MemoryContent).instruction || "");

  const [fbAttempts, setFbAttempts] = useState((content as FillBlankContent).maxAttempts || 1);
  const [choiceAttempts, setChoiceAttempts] = useState((content as ChoiceContent).maxAttempts || 1);
  const [dragAttempts, setDragAttempts] = useState((content as DragOrderContent).maxAttempts || 1);
  const [pickAttempts, setPickAttempts] = useState((content as ImagePickContent).maxAttempts || 1);
  const [groupAttempts, setGroupAttempts] = useState((content as GroupDragContent).maxAttempts || 1);

  const buildContent = (): any => {
    switch (type) {
      case "text": return { html };
      case "image": return { src: imgSrc, caption: imgCaption, width: imgWidth };
      case "video": return { src: videoSrc, type: videoType, caption: videoCaption || undefined };
      case "fill_blank": return { text: fillText, maxAttempts: fbAttempts !== 1 ? fbAttempts : undefined };
      case "choice":         return { question: choiceQuestion, options: choiceOptions.split("\n").map(s => s.trim()).filter(Boolean), correct: choiceCorrect.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n)), multiple: choiceMultiple, maxAttempts: choiceAttempts !== 1 ? choiceAttempts : undefined };
      case "open_question": return { question: openQ };
      case "audio_answer": return { prompt: audioPrompt };
      case "video_answer": return { prompt: audioPrompt };
      case "drag_order": return { sentenceTemplate: dragSentence, maxAttempts: dragAttempts !== 1 ? dragAttempts : undefined };
      case "image_pick": {
        let images: { src: string; label: string }[] = [];
        try { images = JSON.parse(pickImages); } catch {}
        return { question: pickQuestion, images, correct: pickCorrect.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n)), multiple: pickMultiple, maxAttempts: pickAttempts !== 1 ? pickAttempts : undefined };
      }
      case "group_drag": {
        let groups: { label: string; words: string[] }[] = [];
        try { groups = JSON.parse(groupGroups); } catch {}
        return { instruction: groupInst, groups: groups.map(g => ({ ...g, words: g.words.filter(w => w.trim()) })), layout: groupLayout, maxAttempts: groupAttempts !== 1 ? groupAttempts : undefined };
      }
      case "memory": {
        let pairs: { left: string; right: string }[] = [];
        try { pairs = JSON.parse(memPairs); } catch {}
        return { instruction: memInst, pairs: pairs.filter(p => p.left.trim() || p.right.trim()), size: memSize };
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
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
            Используй <strong>[[двойные скобки]]</strong> для пропущенных слов. Всё что внутри <strong>[[...]]</strong> станет полем для ввода.
          </div>
          <TiptapEditor content={fillText} onChange={setFillText} placeholder="Текст с [[пропусками]] для заполнения" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={fbAttempts === 3} onChange={e => setFbAttempts(e.target.checked ? 3 : 1)} /> Три попытки ответа</label>
        </>
      )}

      {type === "choice" && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
            Напиши вопрос в редакторе (можно добавить таблицу, изображение, форматирование). Варианты ответов — в поле ниже, каждый с новой строки.
          </div>
          <TiptapEditor content={choiceQuestion} onChange={setChoiceQuestion} placeholder="Вопрос" />
          <textarea value={choiceOptions} onChange={e => setChoiceOptions(e.target.value)} placeholder="Варианты ответов (каждый с новой строки)" className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm min-h-[80px]" />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={choiceMultiple} onChange={e => setChoiceMultiple(e.target.checked)} /> Несколько ответов</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={choiceAttempts === 3} onChange={e => setChoiceAttempts(e.target.checked ? 3 : 1)} /> Три попытки ответа</label>
              <div className="text-sm text-zinc-500">Верные: <input value={choiceCorrect} onChange={e => setChoiceCorrect(e.target.value)} placeholder="номера (1, 2, 3)" className="w-24 px-2 py-1 border border-zinc-300 rounded text-xs" /></div>
            </div>
        </>
      )}

      {type === "open_question" && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
            Ученик увидит этот вопрос и напишет ответ текстом. Можно добавить таблицу, изображение, форматирование.
          </div>
          <TiptapEditor content={openQ} onChange={setOpenQ} placeholder="Вопрос для ученика" />
        </>
      )}

      {(type === "audio_answer" || type === "video_answer") && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
            Ученик увидит это задание и запишет {type === "audio_answer" ? "голосовой" : "видео"} ответ. Можно добавить таблицу, изображение, форматирование.
          </div>
          <TiptapEditor content={audioPrompt} onChange={setAudioPrompt} placeholder="Задание (что записать / сказать)" />
        </>
      )}

      {type === "drag_order" && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
            Используй <strong>[одинарные скобки]</strong> для слов, которые ученик будет собирать по порядку. Пример: <strong>[Сегодня] [хорошая] [погода]</strong>. Можно добавить таблицу с <strong>[слотами]</strong> внутри ячеек.
          </div>
          <TiptapEditor content={dragSentence} onChange={setDragSentence} placeholder='Напиши предложение. Слова в [скобках] станут пустыми слотами. Пример: [Дорога] [ложка] к [обеду]' />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dragAttempts === 3} onChange={e => setDragAttempts(e.target.checked ? 3 : 1)} /> Три попытки ответа</label>
        </>
      )}

      {type === "image_pick" && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
            Напиши вопрос. Добавь изображения ниже, укажи правильный(е) номер(а).
          </div>
          <TiptapEditor content={pickQuestion} onChange={setPickQuestion} placeholder="Вопрос" />
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
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pickAttempts === 3} onChange={e => setPickAttempts(e.target.checked ? 3 : 1)} /> Три попытки ответа</label>
            <div className="text-sm text-zinc-500">Верные: <input value={pickCorrect} onChange={e => setPickCorrect(e.target.value)} placeholder="номера (1, 2, 3)" className="w-24 px-2 py-1 border border-zinc-300 rounded text-xs" /></div>
          </div>
          {pickImages && (() => {
            let images: { src: string; label: string }[] = [];
            try { images = JSON.parse(pickImages); } catch {}
            return images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="text-xs text-zinc-400">
                    {i + 1}) {img.src ? <img src={proxyImgUrl(img.src) || img.src} alt="" loading="lazy" className="w-12 h-12 object-cover rounded border" /> : <span className="text-zinc-300">нет URL</span>}
                  </div>
                ))}
              </div>
            );
          })()}
        </>
      )}

      {type === "group_drag" && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
            Создай группы слов. Ученик будет перетаскивать слова в ячейки своей группы (колонки или таблица).
          </div>
          <TiptapEditor content={groupInst} onChange={setGroupInst} placeholder="Инструкция / задание (необязательно)" />
          <div className="space-y-2">
            {(() => {
              let groups: { label: string; words: string[] }[] = [];
              try { groups = JSON.parse(groupGroups); } catch {}
              return groups.map((g, i) => (
                <div key={i} className="border border-primary-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500">Группа #{i + 1}</span>
                    <button onClick={() => {
                      const arr = groups.filter((_, j) => j !== i);
                      setGroupGroups(JSON.stringify(arr));
                    }} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </div>
                  <input value={g.label} onChange={e => {
                    const arr = [...groups]; arr[i] = { ...arr[i], label: e.target.value };
                    setGroupGroups(JSON.stringify(arr));
                  }} placeholder="Название группы (напр. Женский род)" className="w-full px-3 py-1.5 border border-zinc-300 rounded text-sm" />
                  <textarea value={g.words.join("\n")} onChange={e => {
                     const arr = [...groups]; arr[i] = { ...arr[i], words: e.target.value.split("\n") };
                     setGroupGroups(JSON.stringify(arr));
                   }} placeholder="Слова группы (каждое с новой строки)" className="w-full px-3 py-1.5 border border-zinc-300 rounded text-sm min-h-[60px]" />
                </div>
              ));
            })()}
            <button onClick={() => {
              let groups: { label: string; words: string[] }[] = [];
              try { groups = JSON.parse(groupGroups); } catch {}
              setGroupGroups(JSON.stringify([...groups, { label: "", words: [] }]));
            }} className="text-sm text-primary-500 hover:underline">+ Добавить группу</button>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="groupLayout" checked={groupLayout === "columns"} onChange={() => setGroupLayout("columns")} /> Колонки
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="groupLayout" checked={groupLayout === "table"} onChange={() => setGroupLayout("table")} /> Таблица
            </label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={groupAttempts === 3} onChange={e => setGroupAttempts(e.target.checked ? 3 : 1)} /> Три попытки ответа</label>
          </div>
        </>
      )}

      {type === "memory" && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
            Ученик увидит поле карточек и будет открывать их по две, ища пары слов. Раскладка перемешивается каждый раз. Найденные пары окрашиваются зелёным.
          </div>
          <TiptapEditor content={memInst} onChange={setMemInst} placeholder="Инструкция / задание (необязательно)" />
          <div>
            <label className="block text-sm font-medium text-zinc-600 mb-1">Размер поля</label>
            <div className="flex gap-2">
              {([12, 16, 20] as const).map(sz => {
                const grid = sz === 12 ? "3×4" : sz === 16 ? "4×4" : "4×5";
                return (
                <button key={sz} type="button" title={`${grid} · ${sz} карточек`} onClick={() => {
                  setMemSize(sz);
                  let pairs: { left: string; right: string }[] = [];
                  try { pairs = JSON.parse(memPairs); } catch {}
                  const target = sz / 2;
                  const next = Array.from({ length: target }, (_, i) => pairs[i] || { left: "", right: "" });
                  setMemPairs(JSON.stringify(next));
                }}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${memSize === sz ? "bg-primary-500 text-white border-primary-500" : "bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50"}`}>
                  {sz} ({grid})
                </button>
                );
              })}
            </div>
            <p className="text-xs text-zinc-400 mt-1">{memSize / 2} пар слов</p>
          </div>
          <div className="space-y-2">
            {(() => {
              let pairs: { left: string; right: string }[] = [];
              try { pairs = JSON.parse(memPairs); } catch {}
              return pairs.map((p, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-xs text-zinc-400 w-5 text-right shrink-0">{i + 1}.</span>
                  <input value={p.left} onChange={e => {
                    const arr = [...pairs]; arr[i] = { ...arr[i], left: e.target.value };
                    setMemPairs(JSON.stringify(arr));
                  }} placeholder="Слово / фраза 1" className="flex-1 px-3 py-1.5 border border-zinc-300 rounded text-sm" />
                  <span className="text-zinc-300">↔</span>
                  <input value={p.right} onChange={e => {
                    const arr = [...pairs]; arr[i] = { ...arr[i], right: e.target.value };
                    setMemPairs(JSON.stringify(arr));
                  }} placeholder="Слово / фраза 2" className="flex-1 px-3 py-1.5 border border-zinc-300 rounded text-sm" />
                  <button type="button" onClick={() => {
                    const arr = pairs.filter((_, j) => j !== i);
                    setMemPairs(JSON.stringify(arr));
                  }} className="text-red-400 hover:text-red-600 text-sm shrink-0">✕</button>
                </div>
              ));
            })()}
            <button type="button" onClick={() => {
              let pairs: { left: string; right: string }[] = [];
              try { pairs = JSON.parse(memPairs); } catch {}
              if (pairs.length >= memSize / 2) return;
              setMemPairs(JSON.stringify([...pairs, { left: "", right: "" }]));
            }} className="text-sm text-primary-500 hover:underline">+ Добавить пару</button>
          </div>
        </>
      )}

      <div className="flex gap-2 pt-2">
        <button onClick={() => onSave({ ...block, content: buildContent() })} disabled={saving} className="bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50">{saving ? "Сохраняю…" : "Сохранить"}</button>
        <button onClick={onCancel} disabled={saving} className="text-zinc-500 px-4 py-1.5 rounded-lg text-sm hover:bg-zinc-100 disabled:opacity-50">Отмена</button>
      </div>
    </div>
  );
}

export function BlocksEditor({ lessonId, initialBlocks }: { lessonId: string; initialBlocks: LessonBlock[] }) {
  const [blocks, setBlocks] = useState<LessonBlock[]>(initialBlocks);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState<BlockType>("text");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragTarget, setDragTarget] = useState<number | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const saveBlock = async (block: Partial<LessonBlock>, index: number) => {
    setSaving(true);
    const { error } = block.id
      ? await supabase.from("lesson_blocks").update({ content: block.content }).eq("id", block.id)
      : await supabase.from("lesson_blocks").insert({
          lesson_id: lessonId,
          type: block.type,
          content: block.content,
          order_index: index,
        });
    setSaving(false);
    if (error) {
      setToast({ kind: "err", text: "Ошибка сохранения: " + error.message });
      return;
    }
    setBlocks(blocks.map((b, i) => i === index ? { ...b, ...block } as LessonBlock : b));
    setEditingBlockId(null);
    setToast({ kind: "ok", text: "✓ Сохранено" });
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
      group_drag: { instruction: "", groups: [], layout: "columns" },
      memory: { instruction: "", pairs: [], size: 12 },
    };
    const { data, error } = await supabase.from("lesson_blocks").insert({
      lesson_id: lessonId,
      type: newType,
      content: defaultContent[newType] || {},
      order_index: blocks.length,
    }).select().single();

    if (error) {
      alert("Ошибка при добавлении блока: " + error.message);
    } else if (data) {
      const newBlocks = [...blocks, data as LessonBlock];
      setBlocks(newBlocks);
      setEditingBlockId(data.id);
    }
    setShowAdd(false);
    setSaving(false);
  };

  const deleteBlock = async (blockId: string) => {
    if (!confirm("Удалить блок?")) return;
    await supabase.from("lesson_blocks").delete().eq("id", blockId);
    setBlocks(blocks.filter(b => b.id !== blockId));
    router.refresh();
  };

  const persistOrder = async (arr: LessonBlock[]) => {
    const next = arr.map((b, i) => ({ ...b, order_index: i }));
    setBlocks(next);
    await Promise.all(next.map((b) => supabase.from("lesson_blocks").update({ order_index: b.order_index }).eq("id", b.id)));
    router.refresh();
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const arr = [...blocks];
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    persistOrder(arr);
  };

  const reorderTo = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length || to === from) return;
    const arr = [...blocks];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    persistOrder(arr);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-800">Блоки урока ({blocks.length})</h2>
        {toast && (
          <span className={`text-sm px-3 py-1 rounded ${toast.kind === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {toast.text}
          </span>
        )}
      </div>

      {blocks.map((block, i) => (
        <div
          key={block.id}
          onDragOver={(e) => { e.preventDefault(); setDragTarget(i); }}
          onDrop={() => { if (dragIndex !== null && dragIndex !== i) reorderTo(dragIndex, i); setDragIndex(null); setDragTarget(null); }}
          onDragLeave={() => setDragTarget(null)}
          onDragEnd={() => { setDragIndex(null); setDragTarget(null); }}
          className={`relative group flex gap-3 border rounded-xl p-4 transition-colors ${
            dragTarget === i ? "border-primary-400 bg-primary-50/40"
              : dragIndex === i ? "border-zinc-300 bg-zinc-50 opacity-60"
              : "border-zinc-200 bg-white"
          }`}
        >
          <div
            draggable
            onDragStart={() => setDragIndex(i)}
            title="Потяни, чтобы переставить (или стрелками)"
            className="flex flex-col items-center justify-center gap-1 shrink-0 w-12 bg-zinc-50 border border-zinc-200 rounded-lg cursor-grab active:cursor-grabbing py-1.5 select-none"
          >
            <button onClick={() => moveBlock(i, -1)} disabled={i === 0} title="Переместить выше"
              className="flex items-center justify-center w-9 h-9 rounded-lg text-zinc-500 hover:bg-primary-100 hover:text-primary-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition active:scale-95">
              <ChevronUp className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-medium text-zinc-400">{i + 1}</span>
            <button onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1} title="Переместить ниже"
              className="flex items-center justify-center w-9 h-9 rounded-lg text-zinc-500 hover:bg-primary-100 hover:text-primary-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition active:scale-95">
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs bg-primary-50 text-primary-500 px-2 py-0.5 rounded-full font-medium">{BLOCK_LABELS[block.type]}</span>
              <div className="flex items-center gap-1.5">
                {editingBlockId !== block.id && (
                  <button onClick={() => setEditingBlockId(block.id)} title="Редактировать"
                    className="flex items-center justify-center w-9 h-9 rounded-lg text-zinc-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition active:scale-95">
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => deleteBlock(block.id)} title="Удалить блок"
                  className="flex items-center justify-center w-9 h-9 rounded-lg text-zinc-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition active:scale-95">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

          {editingBlockId === block.id ? (
            <BlockEditForm
              block={block}
              onSave={(b) => saveBlock(b, i)}
              onCancel={() => setEditingBlockId(null)}
              saving={saving}
            />
          ) : (
            <div className="text-sm text-zinc-600">
              {block.type === "text" && <div className="prose prose-sm max-w-none line-clamp-3" dangerouslySetInnerHTML={{ __html: convertOldContent((block.content as TextContent).html || "") }} />}
              {block.type === "image" && <span className="text-zinc-400">{(block.content as ImageContent).caption || (block.content as ImageContent).src} {(block.content as ImageContent).width && <span className="text-zinc-300">({(block.content as ImageContent).width})</span>}</span>}
              {block.type === "video" && <VideoBlockPreview block={block} />}
              {block.type === "fill_blank" && <div className="prose prose-sm max-w-none line-clamp-3" dangerouslySetInnerHTML={{ __html: (block.content as FillBlankContent).text }} />}
              {block.type === "choice" && <div className="prose prose-sm max-w-none line-clamp-3" dangerouslySetInnerHTML={{ __html: (block.content as ChoiceContent).question }} />}
              {block.type === "open_question" && <div className="prose prose-sm max-w-none line-clamp-3" dangerouslySetInnerHTML={{ __html: (block.content as OpenQuestionContent).question }} />}
              {block.type === "audio_answer" && <div className="prose prose-sm max-w-none line-clamp-3" dangerouslySetInnerHTML={{ __html: (block.content as AudioAnswerContent).prompt }} />}
              {block.type === "video_answer" && <div className="prose prose-sm max-w-none line-clamp-3" dangerouslySetInnerHTML={{ __html: (block.content as AudioAnswerContent).prompt }} />}
              {block.type === "drag_order" && (
                <div className="prose prose-sm max-w-none line-clamp-3" dangerouslySetInnerHTML={{ __html: (block.content as DragOrderContent).sentenceTemplate }} />
              )}
              {block.type === "image_pick" && (
                <div>
                  <div className="prose prose-sm max-w-none line-clamp-3" dangerouslySetInnerHTML={{ __html: (block.content as ImagePickContent).question }} />
                  <p className="text-xs text-zinc-400">{(block.content as ImagePickContent).images?.length || 0} изображений</p>
                </div>
              )}
              {block.type === "group_drag" && (
                <div>
                  <p className="text-xs text-zinc-400">{(block.content as GroupDragContent).groups?.length || 0} групп, {(block.content as GroupDragContent).groups?.reduce((s, g) => s + g.words.length, 0) || 0} слов</p>
                </div>
              )}
            </div>
          )}
          </div>
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
