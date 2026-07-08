"use client";

import { useState, useEffect, useRef } from "react";
import { Volume2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LessonBlock, FillBlankContent, ChoiceContent, OpenQuestionContent, AudioAnswerContent, VideoAnswerContent, TextContent, ImageContent, VideoContent, DragOrderContent, ImagePickContent } from "./types";
import { SubmissionThread } from "@/components/submission-thread";
import { useVocabPicker } from "@/components/vocab-picker-context";

function TextBlock({ block }: { block: LessonBlock }) {
  const c = block.content as TextContent;
  let html = c.html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
  html = html.replace(/<span[^>]*data-answer="([^"]*)"[^>]*>.*?<\/span>/gi, (_, a: string) => `[[${a}]]`);
  html = html.replace(/\[\[([^\]]+)\]\]/g, (_, a) => `<span class="inline-blank-wrapper"><input type="text" class="inline-blank-input" data-answer="${a}" placeholder="..." autocomplete="off"> <span class="inline-blank-feedback"></span></span>`);
  return <TextBlockRenderer html={html} />;
}

function TextBlockRenderer({ html }: { html: string }) {
  const [popup, setPopup] = useState<{ text: string; translation: string; x: number; y: number } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleContext = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const translateSpan = target.closest("[data-translate]") as HTMLElement | null;
      if (translateSpan) {
        e.preventDefault();
        const translation = translateSpan.getAttribute("data-translate") || "";
        const text = translateSpan.textContent || "";
        setPopup({ text, translation, x: e.clientX, y: e.clientY });
      } else {
        setPopup(null);
      }
    };
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopup(null);
      }
    };
    document.addEventListener("contextmenu", handleContext);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("contextmenu", handleContext);
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  const speak = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-ES";
    u.rate = 0.8;
    speechSynthesis.speak(u);
  };

  return (
    <>
      <div
        className="text-content [&_[data-translate]]:cursor-help [&_[data-translate]]:border-b-2 [&_[data-translate]]:border-secondary-400 [&_[data-translate]]:bg-secondary-50/30 [&_[data-translate]]:transition-colors [&_[data-translate]:hover]:bg-secondary-100/50"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {popup && (
        <div
          ref={popupRef}
          className="fixed z-50 bg-white rounded-xl shadow-xl border border-border p-4 max-w-sm"
          style={{ left: popup.x + 12, top: popup.y + 12 }}
        >
          <p className="text-sm font-semibold text-accent mb-1">{popup.text}</p>
          <p className="text-sm text-muted mb-3">{popup.translation}</p>
          <button onClick={() => speak(popup.text)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors">
            <Volume2 className="w-4 h-4" /> Прослушать
          </button>
        </div>
      )}
    </>
  );
}

function ImageBlock({ block }: { block: LessonBlock }) {
  const c = block.content as ImageContent;
  let src = c.src;

  const gdriveMatch = src.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  const yadiskMatch = src.match(/(?:yadi\.sk|disk\.yandex\.(?:ru|com))\/i\/([a-zA-Z0-9_-]+)/);

  if (gdriveMatch) {
    src = `https://drive.google.com/uc?export=view&id=${gdriveMatch[1]}`;
  }

  if (yadiskMatch) {
    return (
      <figure>
        <div className="border border-zinc-200 rounded-xl p-5 bg-zinc-50 flex flex-col items-center gap-3 text-center">
          <span className="text-3xl">💾</span>
          <p className="text-sm text-zinc-500">Фото на Яндекс.Диске</p>
          <a href={c.src} target="_blank" className="bg-primary-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors">
            Открыть на Яндекс.Диске →
          </a>
        </div>
        {c.caption && <figcaption className="text-sm text-zinc-500 mt-1 text-center">{c.caption}</figcaption>}
      </figure>
    );
  }

  return (
    <figure className="overflow-hidden rounded-lg group">
      <img src={src} alt={c.caption || ""} className="w-full transition-transform duration-500 group-hover:scale-105" style={{ width: c.width || "100%" }} />
      {c.caption && <figcaption className="text-sm text-zinc-500 mt-1 text-center">{c.caption}</figcaption>}
    </figure>
  );
}

function VideoBlock({ block }: { block: LessonBlock }) {
  const c = block.content as VideoContent;
  const src = c.src;

  const youtubeMatch = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  const rutubeMatch = src.match(/rutube\.ru\/video\/([a-zA-Z0-9_-]+)/);
  const vkMatch = src.match(/(?:vk\.com|vkvideo\.ru)\/video(-?\d+)_(\d+)/);
  const gdriveMatch = src.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  const yadiskMatch = src.match(/(?:yadi\.sk|disk\.yandex\.(?:ru|com))\/i\/([a-zA-Z0-9_-]+)/);

  // External storage (Google Drive, Yandex Disk) — not embeddable as video
  if (gdriveMatch || yadiskMatch) {
    const serviceName = gdriveMatch ? "Google Диск" : "Яндекс.Диск";
    return (
      <div className="my-4">
        {c.caption && <p className="text-sm font-medium text-zinc-700 mb-2">{c.caption}</p>}
        <div className="border border-zinc-200 rounded-xl p-5 bg-zinc-50 flex flex-col items-center gap-3 text-center">
          <span className="text-3xl">{gdriveMatch ? "📁" : "💾"}</span>
          <p className="text-sm text-zinc-500">Видео на {serviceName}</p>
          <a href={src} target="_blank" className="bg-primary-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors">
            Открыть на {serviceName} →
          </a>
        </div>
      </div>
    );
  }

  let embedUrl: string | null = null;
  if (youtubeMatch) embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  else if (rutubeMatch) embedUrl = `https://rutube.ru/play/embed/${rutubeMatch[1]}`;
  else if (vkMatch) {
    embedUrl = `https://vk.com/video_ext.php?oid=${vkMatch[1]}&id=${vkMatch[2]}&hash=`;
    const hashMatch = src.match(/hash=([a-f0-9]+)/);
    if (hashMatch) embedUrl = `https://vk.com/video_ext.php?oid=${vkMatch[1]}&id=${vkMatch[2]}&hash=${hashMatch[1]}`;
  }

  const player = embedUrl ? (
    <div className="aspect-video rounded-lg overflow-hidden bg-black">
      <iframe src={embedUrl} className="w-full h-full" allowFullScreen title="Video" />
    </div>
  ) : c.type === "audio" ? (
    <audio src={src} controls className="w-full" />
  ) : (
    <video src={src} controls className="w-full rounded-lg" />
  );

  return (
    <div className="my-4">
      {c.caption && <p className="text-sm font-medium text-zinc-700 mb-1">{c.caption}</p>}
      {player}
    </div>
  );
}

function FillBlankBlock({ block, studentId }: { block: LessonBlock; studentId: string }) {
  const c = block.content as FillBlankContent;
  const { pickMode } = useVocabPicker();
  const supabase = createClient();
  const [values, setValues] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [checked, setChecked] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dbValues, setDbValues] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from("block_submissions")
      .select("answer")
      .eq("lesson_block_id", block.id)
      .eq("student_id", studentId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.answer) {
          try {
            const v = JSON.parse(data.answer);
            setValues(v);
            setDbValues(v);
            setSaved(true);
          } catch {}
        }
      });
  }, [block.id, studentId]);

  const blanks = [...c.text.matchAll(/\[\[([^\]]+)\]\]/g)];
  const parts = c.text.split(/\[\[[^\]]+\]\]/);

  const handleCheck = () => {
    setChecked(true);
  };

  const handleSave = async () => {
    setSaveError(null);
    const res = await fetch("/api/submit-answer", {
      method: "POST",
      body: JSON.stringify({ lessonBlockId: block.id, answer: JSON.stringify(values) }),
    });
    if (!res.ok) { setSaveError(await res.text()); return; }
    setSaved(true);
    setDbValues([...values]);
  };

  return (
    <div>
      <div className="text-content">
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < blanks.length && (
              <span className="inline-flex items-center gap-1 mx-0.5">
                {checked && values[i] === blanks[i][1] ? (
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 border-2 border-green-400 rounded px-2 py-0.5 text-sm font-medium">
                    {values[i]} ✓
                  </span>
                ) : saved && values[i] ? (
                  <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-800 border border-primary-300 rounded px-2 py-0.5 text-sm">
                    {values[i]}
                  </span>
                ) : (
                  <>
                    <input
                      type="text"
                      value={values[i] || ""}
                      onChange={e => {
                        const v = [...values];
                        v[i] = e.target.value;
                        setValues(v);
                        if (checked) setChecked(false);
                      }}
                      className={`inline-blank-input border-2 rounded px-2 py-0.5 text-sm w-28 ${checked ? (values[i] === blanks[i][1] ? "bg-green-100 border-green-400" : "bg-red-100 border-red-400") : "border-primary-300 bg-white"}`}
                      placeholder="..."
                      autoComplete="off"
                    />
                    {checked && <span className={`text-xs ${values[i] === blanks[i][1] ? "text-green-600" : "text-red-500"}`}>{values[i] === blanks[i][1] ? "✓" : "✗"}</span>}
                  </>
                )}
              </span>
            )}
          </span>
        ))}
      </div>
      <div className="flex gap-2 mt-3 items-center">
        <button onClick={handleSave} className="bg-zinc-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-zinc-600">Сохранить</button>
        {saved && <span className="text-xs text-green-600">✓ сохранено</span>}
        {!checked && <button onClick={handleCheck} className="bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-600">Проверить</button>}
        {saveError && <span className="text-xs text-red-500">Ошибка: {saveError}</span>}
      </div>
    </div>
  );
}

function ChoiceBlock({ block, studentId }: { block: LessonBlock; studentId: string }) {
  const c = block.content as ChoiceContent;
  const correct = c.correct ?? [];
  const correctIndices = correct.length > 0 && correct.every((n: number) => n >= 1)
    ? correct.map((n: number) => n - 1)
    : correct;
  const [selected, setSelected] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("block_submissions")
      .select("answer")
      .eq("lesson_block_id", block.id)
      .eq("student_id", studentId)
      .maybeSingle()
      .then(({ data }: { data: { answer: string } | null }) => {
        if (data?.answer) {
          setSelected(data.answer.split(",").map(s => parseInt(s)).filter(n => !isNaN(n)));
          setSubmitted(true);
        }
      });
  }, [block.id, studentId]);

  const toggle = (i: number) => {
    if (c.multiple) {
      setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
    } else {
      setSelected([i]);
    }
  };

  const handleSubmit = async () => {
    const answer = selected.join(",");
    await fetch("/api/submit-answer", {
      method: "POST",
      body: JSON.stringify({ lessonBlockId: block.id, answer }),
    });
    setSubmitted(true);
  };

  if (submitted) {
    const sortedSelected = [...selected].sort();
    const sortedCorrect = [...correctIndices].sort();
    const isCorrect = JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);
    return (
      <div className={`rounded-lg p-4 ${isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
        <p className="font-medium mb-1">{c.question}</p>
        {selected.map(i => <span key={i} className="inline-block bg-white px-2 py-0.5 rounded text-sm mr-1 mb-1">{c.options[i]}</span>)}
        <p className="text-sm mt-1">{isCorrect ? "✓ Правильно" : `✗ Неправильно (верный: ${correctIndices.map(i => c.options[i]).join(", ")})`}</p>
      </div>
    );
  }

  return (
    <div className="border border-primary-200 rounded-lg p-4">
      <p className="font-medium text-zinc-800 mb-3">{c.question}</p>
      <div className="space-y-2">
        {c.options.map((opt, i) => (
          <button key={i} onClick={() => toggle(i)}
            className={`block w-full text-left px-4 py-2 rounded-lg text-sm border transition-colors ${
              selected.includes(i) ? "border-primary-500 bg-primary-50 text-primary-500" : "border-zinc-200 text-zinc-600 hover:border-primary-300"
            }`}
          >
            {c.multiple && <span className={`inline-block w-4 h-4 mr-2 rounded border ${selected.includes(i) ? "bg-primary-500 border-primary-500" : "border-zinc-300"}`} />}
            <span className="text-zinc-300 mr-1">{i + 1})</span>{opt}
          </button>
        ))}
      </div>
      <button onClick={handleSubmit} disabled={selected.length === 0}
        className="mt-3 bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
      >
        Ответить
      </button>
    </div>
  );
}

function OpenQuestionBlock({ block, studentId }: { block: LessonBlock; studentId: string }) {
  const c = block.content as OpenQuestionContent;
  const [answer, setAnswer] = useState("");
  const [saved, setSaved] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [comment, setComment] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("block_submissions")
      .select("id, answer, reviewed, comment")
      .eq("lesson_block_id", block.id)
      .eq("student_id", studentId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.answer) {
          setSubmissionId(data.id);
          setAnswer(data.answer);
          setSubmitted(true);
          setReviewed(!!data.reviewed);
          setComment(data.comment);
        }
      });
  }, [block.id, studentId]);

  const saveAnswer = async () => {
    if (!answer.trim()) return;
    const res = await fetch("/api/submit-answer", {
      method: "POST",
      body: JSON.stringify({ lessonBlockId: block.id, answer }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.id) setSubmissionId(data.id);
      setSaved(true);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    const res = await fetch("/api/submit-answer", {
      method: "POST",
      body: JSON.stringify({ lessonBlockId: block.id, answer }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.id) setSubmissionId(data.id);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className={`rounded-lg p-4 ${reviewed ? "bg-green-50 border border-green-200" : "bg-primary-50 border border-primary-200"}`}>
        <p className="font-medium mb-1">{c.question}</p>
        <p className="text-sm text-zinc-700">Твой ответ: {answer}</p>
        {reviewed ? (
          <>
            <p className="text-xs text-green-600 font-medium mt-1">✓ Проверено</p>
            {comment && <p className="text-sm text-primary-500 mt-1">💬 {comment}</p>}
          </>
        ) : (
          <p className="text-xs text-zinc-400 mt-1">Отправлено на проверку</p>
        )}
        <button onClick={() => setSubmitted(false)} className="text-xs text-primary-500 hover:underline mt-2">✎ Редактировать</button>
        {submissionId && <SubmissionThread submissionId={submissionId} />}
      </div>
    );
  }

  return (
    <div className="border border-primary-200 rounded-lg p-4">
      <p className="font-medium text-zinc-800 mb-3">{c.question}</p>
      <textarea value={answer} onChange={e => { setAnswer(e.target.value); setSaved(false); }} onBlur={saveAnswer} placeholder="Напиши ответ..."
        className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 min-h-[80px]" />
      <div className="flex items-center gap-2 mt-2">
        <button onClick={handleSubmit} disabled={!answer.trim()}
          className="bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
        >Отправить на проверку</button>
        {saved && <span className="text-xs text-green-600">✓ сохранено</span>}
      </div>
    </div>
  );
}

function AudioAnswerBlock({ block, studentId }: { block: LessonBlock; studentId: string }) {
  const c = block.content as AudioAnswerContent;
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [comment, setComment] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("block_submissions")
      .select("id, answer, reviewed, comment")
      .eq("lesson_block_id", block.id)
      .eq("student_id", studentId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.answer) {
          setSubmissionId(data.id);
          setAudioUrl(data.answer);
          setSubmitted(true);
          setReviewed(!!data.reviewed);
          setComment(data.comment);
        }
      });
  }, [block.id, studentId]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mr.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
          const ext = (mr.mimeType || 'audio/webm').split('/')[1]?.split(';')[0] || 'webm';
          const fileName = `audio/${studentId}/${Date.now()}.${ext}`;
          const { data, error } = await supabase.storage.from("lesson-files").upload(fileName, blob, { contentType: mr.mimeType || 'audio/webm' });
          if (error) {
            alert("Ошибка загрузки: " + error.message);
            stream.getTracks().forEach(t => t.stop());
            return;
          }
          const { data: { publicUrl } } = supabase.storage.from("lesson-files").getPublicUrl(data.path);
          setAudioUrl(publicUrl);
        } catch (e: any) {
          alert("Ошибка: " + e.message);
        }
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setMediaRecorder(mr);
      setRecording(true);
    } catch (e: any) {
      alert("Нет доступа к микрофону: " + e.message);
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setRecording(false);
  };

  const handleSubmit = async () => {
    if (!audioUrl) return;
    const res = await fetch("/api/submit-answer", {
      method: "POST",
      body: JSON.stringify({ lessonBlockId: block.id, answer: audioUrl }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.id) setSubmissionId(data.id);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className={`rounded-lg p-4 ${reviewed ? "bg-green-50 border border-green-200" : "bg-primary-50 border border-primary-200"}`}>
        <p className="font-medium mb-1">{c.prompt}</p>
        <audio src={audioUrl!} controls className="w-full" />
        {reviewed ? (
          <>
            <p className="text-xs text-green-600 font-medium mt-1">✓ Проверено</p>
            {comment && <p className="text-sm text-primary-500 mt-1">💬 {comment}</p>}
          </>
        ) : (
          <p className="text-xs text-zinc-400 mt-1">Аудио отправлено на проверку</p>
        )}
        {!reviewed && <button onClick={() => setSubmitted(false)} className="text-xs text-primary-500 hover:underline mt-2">✎ Записать заново</button>}
        {submissionId && <SubmissionThread submissionId={submissionId} />}
      </div>
    );
  }

  return (
    <div className="border border-primary-200 rounded-lg p-4">
      <p className="font-medium text-zinc-800 mb-3">{c.prompt}</p>
      {!recording && !audioUrl && (
        <button onClick={startRecording} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600">🎙 Записать</button>
      )}
      {recording && (
        <button onClick={stopRecording} className="bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm">⏹ Остановить</button>
      )}
      {audioUrl && (
        <div className="mt-2">
          <audio src={audioUrl} controls className="w-full" />
          <button onClick={handleSubmit} className="mt-2 bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm">Отправить</button>
        </div>
      )}
    </div>
  );
}

function DragOrderBlock({ block, studentId }: { block: LessonBlock; studentId: string }) {
  const c = block.content as DragOrderContent;
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [pool, setPool] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [dragWord, setDragWord] = useState<string | null>(null);
  const [dragSource, setDragSource] = useState<"pool" | number | null>(null);
  const supabase = createClient();

  const correctWords: string[] = [];
  const parts: { type: "text" | "blank"; text?: string; word?: string; blankIdx: number }[] = [];
  let bi = 0;
  c.sentenceTemplate.split(/(\[[^\]]+\])/).forEach(part => {
    if (part.startsWith("[") && part.endsWith("]")) {
      const word = part.slice(1, -1);
      correctWords.push(word);
      parts.push({ type: "blank", word, blankIdx: bi++ });
    } else {
      parts.push({ type: "text", text: part, blankIdx: -1 });
    }
  });

  useEffect(() => {
    setSlots(new Array(correctWords.length).fill(null));
    setPool([...correctWords].sort(() => Math.random() - 0.5));
  }, [c.sentenceTemplate]);

  const clickPoolWord = (word: string) => {
    const idx = slots.indexOf(null);
    if (idx === -1) return;
    const newSlots = [...slots];
    newSlots[idx] = word;
    setSlots(newSlots);
    setPool(prev => { const p = [...prev]; p.splice(p.indexOf(word), 1); return p; });
  };

  const clickSlot = (idx: number) => {
    const word = slots[idx];
    if (!word) return;
    const newSlots = [...slots];
    newSlots[idx] = null;
    setSlots(newSlots);
    setPool(prev => [...prev, word]);
  };

  const dragStart = (word: string, source: "pool" | number) => {
    setDragWord(word);
    setDragSource(source);
  };

  const slotDrop = (idx: number) => {
    if (!dragWord) return;
    if (slots[idx]) return;
    const newSlots = [...slots];
    newSlots[idx] = dragWord;
    setSlots(newSlots);
    if (dragSource === "pool") {
      setPool(prev => { const p = [...prev]; p.splice(p.indexOf(dragWord), 1); return p; });
    } else if (typeof dragSource === "number") {
      setSlots(prev => { const s = [...prev]; s[dragSource as number] = null; return s; });
    }
    setDragWord(null);
    setDragSource(null);
  };

  const poolDrop = () => {
    if (!dragWord || typeof dragSource !== "number") return;
    setSlots(prev => { const s = [...prev]; s[dragSource as number] = null; return s; });
    setPool(prev => [...prev, dragWord]);
    setDragWord(null);
    setDragSource(null);
  };

  const handleSubmit = async () => {
    await fetch("/api/submit-answer", {
      method: "POST",
      body: JSON.stringify({ lessonBlockId: block.id, answer: JSON.stringify(slots) }),
    });
    setSubmitted(true);
  };

  if (submitted) {
    const isCorrect = JSON.stringify(slots) === JSON.stringify(correctWords);
    return (
      <div className={`rounded-lg p-4 ${isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
        <p className="font-medium mb-2">Составь предложение</p>
        <div className="flex flex-wrap items-center gap-1 text-lg leading-relaxed">
          {parts.map((part, i) =>
            part.type === "text" ? (
              <span key={i}>{part.text}</span>
            ) : (
              <span key={i} className={`px-1 rounded ${slots[part.blankIdx] === part.word ? "bg-green-100" : "bg-red-100 line-through"}`}>
                {slots[part.blankIdx] || "___"}
              </span>
            )
          )}
        </div>
        {!isCorrect && <p className="text-sm mt-2">Правильно: {correctWords.join(" ")}</p>}
      </div>
    );
  }

  const allFilled = slots.every(s => s !== null);

  return (
    <div className="border border-primary-200 rounded-lg p-4">
      <p className="font-medium text-zinc-800 mb-3">Составь предложение</p>

      <div
        className="flex flex-wrap items-center gap-1 text-lg leading-relaxed mb-4 p-3 bg-zinc-50 rounded-lg min-h-[48px]"
        onDragOver={e => e.preventDefault()}
        onDrop={poolDrop}
      >
        {parts.map((part, i) =>
          part.type === "text" ? (
            <span key={i}>{part.text}</span>
          ) : (
            <div
              key={i}
              onClick={() => clickSlot(part.blankIdx)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); slotDrop(part.blankIdx); }}
              className={`inline-block min-w-[60px] px-2 py-0.5 rounded border-2 transition-colors ${
                slots[part.blankIdx]
                  ? "border-primary-400 bg-primary-50 cursor-grab active:cursor-grabbing hover:bg-primary-50"
                  : "border-dashed border-zinc-300"
              }`}
            >
              {slots[part.blankIdx] ? (
                <span
                  draggable
                  onDragStart={() => dragStart(slots[part.blankIdx]!, part.blankIdx)}
                  className="inline-block w-full"
                >
                  {slots[part.blankIdx]}
                </span>
              ) : "___"}
            </div>
          )
        )}
      </div>

      {pool.length > 0 && (
        <div
          className="flex flex-wrap gap-2 mb-4"
          onDragOver={e => e.preventDefault()}
        >
          {pool.map((word, i) => (
            <div
              key={i}
              onClick={() => clickPoolWord(word)}
              draggable
              onDragStart={() => dragStart(word, "pool")}
              className="px-3 py-1.5 bg-white border border-primary-300 rounded-lg text-sm hover:bg-primary-50 cursor-grab active:cursor-grabbing transition-colors select-none"
            >
              {word}
            </div>
          ))}
        </div>
      )}

      <button onClick={handleSubmit} disabled={!allFilled}
        className="bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
      >
        Проверить
      </button>
    </div>
  );
}

function ImagePickBlock({ block, studentId }: { block: LessonBlock; studentId: string }) {
  const c = block.content as ImagePickContent;
  const [selected, setSelected] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const supabase = createClient();

  const toggle = (i: number) => {
    if (c.multiple) {
      setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
    } else {
      setSelected([i]);
    }
  };

  const handleSubmit = async () => {
    await fetch("/api/submit-answer", {
      method: "POST",
      body: JSON.stringify({ lessonBlockId: block.id, answer: selected.join(",") }),
    });
    setSubmitted(true);
  };

  if (submitted) {
    const isCorrect = JSON.stringify([...selected].sort()) === JSON.stringify([...c.correct].sort());
    return (
      <div className={`rounded-lg p-4 ${isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
        <p className="font-medium mb-2">{c.question}</p>
        <div className="grid grid-cols-2 gap-2">
          {c.images.map((img, i) => (
            <div key={i} className={`rounded-lg border-2 p-1 ${selected.includes(i) ? "border-primary-500" : "border-transparent"}`}>
              <img src={img.src} alt={img.label} className="w-full h-24 object-cover rounded" />
              <p className="text-xs text-center mt-1">{img.label}</p>
            </div>
          ))}
        </div>
        <p className="text-sm mt-1">{isCorrect ? "✓ Правильно" : "✗ Неправильно"}</p>
      </div>
    );
  }

  return (
    <div className="border border-primary-200 rounded-lg p-4">
      <p className="font-medium text-zinc-800 mb-3">{c.question}</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        {c.images.map((img, i) => (
          <button key={i} onClick={() => toggle(i)}
            className={`rounded-lg border-2 overflow-hidden transition-colors ${selected.includes(i) ? "border-primary-500 ring-2 ring-primary-300" : "border-zinc-200 hover:border-primary-300"}`}
          >
            <img src={img.src} alt={img.label} className="w-full h-28 object-cover" />
            <p className="text-xs text-center py-1 bg-white">{img.label}</p>
          </button>
        ))}
      </div>
      <button onClick={handleSubmit} disabled={selected.length === 0}
        className="bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
      >
        Ответить
      </button>
    </div>
  );
}

function VideoAnswerBlock({ block, studentId }: { block: LessonBlock; studentId: string }) {
  const c = block.content as AudioAnswerContent;
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [comment, setComment] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordedBlob = useRef<Blob | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("block_submissions")
      .select("id, answer, reviewed, comment")
      .eq("lesson_block_id", block.id)
      .eq("student_id", studentId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.answer) {
          setVideoUrl(data.answer);
          setSent(true);
          setReviewed(!!data.reviewed);
          setComment(data.comment);
        }
      });
  }, [block.id, studentId]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [stream]);

  const startRecording = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
      recordedBlob.current = null;
      const chunks: Blob[] = [];
      const mr = new MediaRecorder(s, { mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm" });
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        recordedBlob.current = blob;
        setVideoUrl(URL.createObjectURL(blob));
        s.getTracks().forEach(t => t.stop());
        setStream(null);
      };
      mr.start();
      mediaRecorder.current = mr;
      setRecording(true);
      setCameraError("");
    } catch {
      setCameraError("Не удалось получить доступ к камере");
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  const handleSubmit = async () => {
    if (!recordedBlob.current) return;
    setSending(true);
    try {
      const file = new File([recordedBlob.current], `video-${Date.now()}.webm`, { type: "video/webm" });
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/upload-file", { method: "POST", body: fd });
      if (!uploadRes.ok) return;
      const { url } = await uploadRes.json();
      await fetch("/api/submit-answer", {
        method: "POST",
        body: JSON.stringify({ lessonBlockId: block.id, answer: url }),
      });
      setVideoUrl(url);
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className={`rounded-lg p-4 ${reviewed ? "bg-green-50 border border-green-200" : "bg-primary-50 border border-primary-200"}`}>
        <p className="font-medium mb-2">{c.prompt}</p>
        {videoUrl && <video src={videoUrl} controls className="w-full max-w-md rounded" />}
        {reviewed ? (
          <>
            <p className="text-xs text-green-600 font-medium mt-1">✓ Проверено</p>
            {comment && <p className="text-sm text-primary-500 mt-1">💬 {comment}</p>}
          </>
        ) : (
          <p className="text-xs text-zinc-400 mt-1">Отправлено на проверку</p>
        )}
      </div>
    );
  }

  return (
    <div className="border border-primary-200 rounded-lg p-4">
      <p className="font-medium text-zinc-800 mb-3">{c.prompt}</p>

      {cameraError && <p className="text-sm text-red-500 mb-2">{cameraError}</p>}

      {!recording && !videoUrl && (
        <button onClick={startRecording} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600">🎥 Записать видео</button>
      )}

      {recording && (
        <div>
          <video ref={videoRef} autoPlay muted className="w-full max-w-md rounded mb-2 bg-black" />
          <button onClick={stopRecording} className="bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm">⏹ Остановить</button>
        </div>
      )}

      {videoUrl && !recording && (
        <div>
          <video src={videoUrl} controls className="w-full max-w-md rounded mb-2" />
          <div className="flex gap-2">
            <button onClick={() => { setVideoUrl(null); }} className="text-sm text-zinc-500 hover:underline">✎ Перезаписать</button>
            <button onClick={handleSubmit} disabled={sending || !recordedBlob.current}
              className="bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-primary-600 disabled:opacity-50">
              {sending ? "Отправка..." : "Отправить"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function BlockRenderer({ block, studentId }: { block: LessonBlock; studentId?: string }) {

  const handleCheck = () => {
    if (!studentId) return;
    const container = document.getElementById(`block-${block.id}`);
    if (!container) return;
    const inputs = container.querySelectorAll<HTMLInputElement>(".inline-blank-input");
    inputs.forEach(input => {
      const correct = input.dataset.answer || "";
      const fb = input.parentElement?.querySelector(".inline-blank-feedback");
      if (input.value.trim().toLowerCase() === correct.trim().toLowerCase()) {
        input.className = "inline-blank-input correct";
        if (fb) { fb.textContent = "✓"; fb.className = "inline-blank-feedback correct"; }
      } else {
        input.className = "inline-blank-input wrong";
        if (fb) { fb.textContent = `✗ (${correct})`; fb.className = "inline-blank-feedback wrong"; }
      }
      });
  };

  return (
    <div id={`block-${block.id}`} className="mb-6">
      {block.type === "text" && <TextBlock block={block} />}
      {block.type === "image" && <ImageBlock block={block} />}
      {block.type === "video" && <VideoBlock block={block} />}
      {block.type === "fill_blank" && studentId && <FillBlankBlock block={block} studentId={studentId} />}
      {block.type === "choice" && studentId && <ChoiceBlock block={block} studentId={studentId} />}
      {block.type === "open_question" && studentId && <OpenQuestionBlock block={block} studentId={studentId} />}
      {block.type === "audio_answer" && studentId && <AudioAnswerBlock block={block} studentId={studentId} />}
      {block.type === "video_answer" && studentId && <VideoAnswerBlock block={block} studentId={studentId} />}
      {block.type === "drag_order" && studentId && <DragOrderBlock block={block} studentId={studentId} />}
      {block.type === "image_pick" && studentId && <ImagePickBlock block={block} studentId={studentId} />}
    </div>
  );
}
