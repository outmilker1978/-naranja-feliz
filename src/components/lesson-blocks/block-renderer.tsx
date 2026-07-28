"use client";

import { useState, useEffect, useRef } from "react";
import { Volume2, Mic, Video, Square, HardDrive, Folder, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LessonBlock, FillBlankContent, ChoiceContent, OpenQuestionContent, AudioAnswerContent, VideoAnswerContent, TextContent, ImageContent, VideoContent, DragOrderContent, ImagePickContent, GroupDragContent } from "./types";
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
      <style>{`
        .text-content img[style*="text-align:"] {
          display: block !important;
        }
        .text-content img[style*="text-align: center"],
        .text-content img[style*="text-align:center"] {
          margin-left: auto !important;
          margin-right: auto !important;
        }
        .text-content img[style*="text-align: right"],
        .text-content img[style*="text-align:right"] {
          margin-left: auto !important;
          margin-right: 0 !important;
        }
      `}</style>
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
          <HardDrive className="w-8 h-8 text-zinc-400" />
          <p className="text-sm text-zinc-500">Фото на Яндекс.Диске</p>
          <a href={c.src} target="_blank" className="bg-primary-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors inline-flex items-center gap-1.5">
            Открыть на Яндекс.Диске <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
        {c.caption && <figcaption className="text-sm text-zinc-500 mt-1 text-center">{c.caption}</figcaption>}
      </figure>
    );
  }

  return (
    <figure className="overflow-hidden rounded-lg group">
      <img src={src} alt={c.caption || ""} loading="lazy" className="w-full transition-transform duration-500 group-hover:scale-105" style={{ width: c.width || "100%" }} />
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
          <span className="text-3xl text-zinc-400">{gdriveMatch ? <Folder className="w-8 h-8" /> : <HardDrive className="w-8 h-8" />}</span>
          <p className="text-sm text-zinc-500">Видео на {serviceName}</p>
          <a href={src} target="_blank" className="bg-primary-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors inline-flex items-center gap-1.5">
            Открыть на {serviceName} <ArrowUpRight className="w-4 h-4" />
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
  const contentRef = useRef<HTMLDivElement>(null);
  const htmlSet = useRef(false);
  const [values, setValues] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [checked, setChecked] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const maxAttempts = c.maxAttempts || 1;
  const [usedAttempts, setUsedAttempts] = useState(0);
  const [attemptsExhausted, setAttemptsExhausted] = useState(false);
  const [attemptMessage, setAttemptMessage] = useState("");

  const blanks = [...c.text.matchAll(/\[\[([^\]]+)\]\]/g)];

  useEffect(() => {
    setValues(new Array(blanks.length).fill(""));
  }, [c.text]);

  useEffect(() => {
    supabase.from("block_submissions").select("answer").eq("lesson_block_id", block.id)
      .eq("student_id", studentId).maybeSingle()
      .then(({ data }) => {
        if (data?.answer) {
          try {
            setValues(JSON.parse(data.answer));
            setSaved(true);
          } catch {}
        }
      });
  }, [block.id, studentId]);

  useEffect(() => {
    if (!contentRef.current || htmlSet.current) return;
    let idx = 0;
    contentRef.current.innerHTML = c.text.replace(/\[\[([^\]]+)\]\]/g, (_, answer) => {
      const i = idx++;
      return `<span class="inline-flex items-center gap-1 mx-0.5">
        <input type="text" data-idx="${i}" data-answer="${answer}" value=""
          placeholder="..." autocomplete="off"
          class="inline-blank-input border-2 rounded px-2 py-0.5 text-sm w-28 border-primary-300 bg-white" />
        <span class="fillblank-feedback text-xs" data-idx="${i}"></span>
      </span>`;
    });
    htmlSet.current = true;
  }, [c.text]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    const inputs = root.querySelectorAll<HTMLInputElement>('input[data-idx]');
    inputs.forEach(input => {
      const idx = parseInt(input.dataset.idx!);
      const answer = input.dataset.answer!;
      const val = values[idx] || "";
      if (input.value !== val) input.value = val;
      input.className = `inline-blank-input border-2 rounded px-2 py-0.5 text-sm w-28 ${
        checked
          ? val === answer ? "bg-green-100 border-green-400" : "bg-red-100 border-red-400"
          : "border-primary-300 bg-white"
      }`;
    });
    const feedbacks = root.querySelectorAll<HTMLElement>('.fillblank-feedback');
    feedbacks.forEach(el => {
      const idx = parseInt(el.dataset.idx!);
      const answer = blanks[idx]?.[1] || "";
      const val = values[idx] || "";
      if (checked) {
        el.textContent = val === answer ? "✓" : "✗";
        el.className = `fillblank-feedback text-xs ${val === answer ? "text-green-600" : "text-red-500"}`;
      } else {
        el.textContent = "";
        el.className = "fillblank-feedback text-xs";
      }
    });
  });

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    const handler = (e: Event) => {
      const input = e.target as HTMLInputElement;
      if (input.tagName !== "INPUT" || !input.dataset.idx) return;
      const idx = parseInt(input.dataset.idx);
      setValues(prev => { const v = [...prev]; v[idx] = input.value; return v; });
      if (checked) setChecked(false);
    };
    root.addEventListener("input", handler);
    return () => root.removeEventListener("input", handler);
  }, [checked]);

  const handleCheck = () => {
    setChecked(true);
    const allCorrect = blanks.every(([, a], i) => (values[i] || "").trim().toLowerCase() === a.trim().toLowerCase());
    if (!allCorrect) {
      const next = usedAttempts + 1;
      setUsedAttempts(next);
      if (next >= maxAttempts) {
        setAttemptsExhausted(true);
        setAttemptMessage("Попытки исчерпаны");
      } else {
        const rem = maxAttempts - next;
        setAttemptMessage(`Неверно, осталось ${rem} ${rem === 1 ? "попытка" : "попытки"}`);
      }
    } else {
      setAttemptMessage("Верно!");
    }
  };

  const handleSave = async () => {
    setSaveError(null);
    const res = await fetch("/api/submit-answer", {
      method: "POST",
      body: JSON.stringify({ lessonBlockId: block.id, answer: JSON.stringify(values) }),
    });
    if (!res.ok) { setSaveError(await res.text()); return; }
    setSaved(true);
  };

  const allCorrect = checked && blanks.every(([, a], i) => (values[i] || "").trim().toLowerCase() === a.trim().toLowerCase());
  const isDisabled = attemptsExhausted || allCorrect;

  return (
    <div>
      <div ref={contentRef} className="text-content" />
      {attemptsExhausted && !allCorrect && (
        <div className="mt-2 p-2 bg-zinc-50 rounded text-sm text-zinc-600">
          {blanks.map(([, a], i) => (
            <span key={i} className="mr-2">{a}{i < blanks.length - 1 ? "," : ""}</span>
          ))}
        </div>
      )}
      {allCorrect && <p className="text-sm text-green-600 mt-2">✓ Правильно!</p>}
      <div className="flex gap-2 mt-3 items-center">
        <button onClick={handleSave} disabled={isDisabled} className="bg-zinc-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-zinc-600 disabled:opacity-50">Сохранить</button>
        {saved && <span className="text-xs text-green-600">✓ сохранено</span>}
        {!checked && !attemptsExhausted && <button onClick={handleCheck} className="bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-600">Проверить</button>}
        {maxAttempts > 1 && <AttemptsDots used={usedAttempts} max={maxAttempts} message={attemptMessage} />}
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
  const maxAttempts = c.maxAttempts || 1;
  const [usedAttempts, setUsedAttempts] = useState(0);
  const [attemptsExhausted, setAttemptsExhausted] = useState(false);
  const [attemptMessage, setAttemptMessage] = useState("");
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

  const sortedSelected = [...selected].sort();
  const sortedCorrect = [...correctIndices].sort();
  const isCorrect = JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);

  const handleSubmit = async () => {
    if (isCorrect) {
      setAttemptMessage("Верно!");
      await fetch("/api/submit-answer", {
        method: "POST",
        body: JSON.stringify({ lessonBlockId: block.id, answer: selected.join(",") }),
      });
      setSubmitted(true);
    } else {
      const next = usedAttempts + 1;
      setUsedAttempts(next);
      if (next >= maxAttempts) {
        setAttemptsExhausted(true);
        setAttemptMessage("Попытки исчерпаны");
      } else {
        const rem = maxAttempts - next;
        setAttemptMessage(`Неверно, осталось ${rem} ${rem === 1 ? "попытка" : "попытки"}`);
      }
    }
  };

  if (submitted) {
    return (
      <div className={`rounded-lg p-4 ${isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
        <div className="font-medium mb-1 text-content" dangerouslySetInnerHTML={{ __html: c.question }} />
        {selected.map(i => <span key={i} className="inline-block bg-white px-2 py-0.5 rounded text-sm mr-1 mb-1">{c.options[i]}</span>)}
        <p className="text-sm mt-1">{isCorrect ? "✓ Правильно" : `✗ Неправильно (верный: ${correctIndices.map(i => c.options[i]).join(", ")})`}</p>
      </div>
    );
  }

  return (
    <div className="border border-primary-200 rounded-lg p-4">
      <div className="flex-1 font-medium text-zinc-800 mb-3 text-content" dangerouslySetInnerHTML={{ __html: c.question }} />
      <div className="space-y-2">
        {c.options.map((opt, i) => (
          <button key={i} onClick={() => toggle(i)}
            className={`block w-full text-left px-4 py-2 rounded-lg text-sm border transition-colors ${
              selected.includes(i) ? "border-primary-500 bg-primary-50 text-primary-500" : "border-zinc-200 text-zinc-600 hover:border-primary-300"
            } ${attemptsExhausted ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {c.multiple && <span className={`inline-block w-4 h-4 mr-2 rounded border ${selected.includes(i) ? "bg-primary-500 border-primary-500" : "border-zinc-300"}`} />}
            <span className="text-zinc-300 mr-1">{i + 1})</span>{opt}
          </button>
        ))}
      </div>
      {attemptsExhausted && (
        <p className="text-sm text-red-500 mt-2">Попытки исчерпаны. Верный: {correctIndices.map(i => c.options[i]).join(", ")}</p>
      )}
      <div className="flex items-center gap-2 mt-3">
        <button onClick={handleSubmit} disabled={selected.length === 0 || attemptsExhausted}
          className="bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {attemptsExhausted ? "Попытки исчерпаны" : "Ответить"}
        </button>
        {maxAttempts > 1 && <AttemptsDots used={usedAttempts} max={maxAttempts} message={attemptMessage} />}
      </div>
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
        <div className="font-medium mb-1 text-content" dangerouslySetInnerHTML={{ __html: c.question }} />
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
      <div className="font-medium text-zinc-800 mb-3 text-content" dangerouslySetInnerHTML={{ __html: c.question }} />
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
        <div className="font-medium mb-1 text-content" dangerouslySetInnerHTML={{ __html: c.prompt }} />
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
      <div className="font-medium text-zinc-800 mb-3 text-content" dangerouslySetInnerHTML={{ __html: c.prompt }} />
      {!recording && !audioUrl && (
        <button onClick={startRecording} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 inline-flex items-center gap-1.5"><Mic className="w-4 h-4" /> Записать</button>
      )}
      {recording && (
        <button onClick={stopRecording} className="bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm inline-flex items-center gap-1.5"><Square className="w-4 h-4" /> Остановить</button>
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
  const correctWords: string[] = [];
  c.sentenceTemplate.replace(/\[([^\]]+)\]/g, (_, w) => { correctWords.push(w); return ""; });

  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [pool, setPool] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [dragWord, setDragWord] = useState<string | null>(null);
  const [dragSource, setDragSource] = useState<"pool" | number | null>(null);
  const maxAttempts = c.maxAttempts || 1;
  const [usedAttempts, setUsedAttempts] = useState(0);
  const [attemptsExhausted, setAttemptsExhausted] = useState(false);
  const [attemptMessage, setAttemptMessage] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("block_submissions").select("answer").eq("lesson_block_id", block.id)
      .eq("student_id", studentId).maybeSingle()
      .then(({ data }) => {
        if (data?.answer) {
          try {
            const parsed = JSON.parse(data.answer);
            if (Array.isArray(parsed)) {
              setSlots(parsed);
              const placed = parsed.filter((w): w is string => w !== null);
              setPool(correctWords.filter(w => !placed.includes(w)).sort(() => Math.random() - 0.5));
              if (placed.length === correctWords.length) setSubmitted(true);
            } else {
              const savedWords: (string | null)[] = parsed.words || [];
              const savedAttempts = parsed.attemptsUsed || 0;
              setSlots(savedWords);
              const placed = savedWords.filter((w): w is string => w !== null);
              setPool(correctWords.filter(w => !placed.includes(w)).sort(() => Math.random() - 0.5));
              setUsedAttempts(savedAttempts);
              if (parsed.correct) setSubmitted(true);
              else if (savedAttempts >= maxAttempts) setAttemptsExhausted(true);
            }
            setLoading(false);
            return;
          } catch {}
        }
        setSlots(new Array(correctWords.length).fill(null));
        setPool([...correctWords].sort(() => Math.random() - 0.5));
        setLoading(false);
      });
  }, [c.sentenceTemplate]);

  const clickPoolWord = (word: string) => {
    const idx = slots.indexOf(null);
    if (idx === -1) return;
    setSlots(prev => { const s = [...prev]; s[idx] = word; return s; });
    setPool(prev => { const p = [...prev]; p.splice(p.indexOf(word), 1); return p; });
  };

  const clickSlot = (idx: number) => {
    if (!slots[idx]) return;
    setPool(prev => [...prev, slots[idx]!]);
    setSlots(prev => { const s = [...prev]; s[idx] = null; return s; });
  };

  const slotDrop = (idx: number) => {
    if (!dragWord || slots[idx]) return;
    setSlots(prev => { const s = [...prev]; s[idx] = dragWord; return s; });
    if (dragSource === "pool") {
      setPool(prev => { const p = [...prev]; p.splice(p.indexOf(dragWord), 1); return p; });
    } else if (typeof dragSource === "number") {
      setSlots(prev => { const s = [...prev]; s[dragSource as number] = null; return s; });
    }
    setDragWord(null);
    setDragSource(null);
  };

  useEffect(() => {
    const el = contentRef.current;
    if (!el || submitted) return;
    const onClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest("[data-idx]") as HTMLElement | null;
      if (t) clickSlot(parseInt(t.dataset.idx!));
    };
    const onDragOver = (e: DragEvent) => e.preventDefault();
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const t = (e.target as HTMLElement).closest("[data-idx]") as HTMLElement | null;
      if (t) slotDrop(parseInt(t.dataset.idx!));
    };
    el.addEventListener("click", onClick);
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("drop", onDrop);
    return () => { el.removeEventListener("click", onClick); el.removeEventListener("dragover", onDragOver); el.removeEventListener("drop", onDrop); };
  }, [slots, pool, dragWord, submitted]);

  const isCorrect = JSON.stringify(slots) === JSON.stringify(correctWords);

  const handleSubmit = async () => {
    if (isCorrect) {
      setAttemptMessage("Верно!");
      await fetch("/api/submit-answer", {
        method: "POST",
        body: JSON.stringify({ lessonBlockId: block.id, answer: JSON.stringify({ words: slots, attemptsUsed: usedAttempts, correct: true }) }),
      });
      setSubmitted(true);
    } else {
      const next = usedAttempts + 1;
      setUsedAttempts(next);
      await fetch("/api/submit-answer", {
        method: "POST",
        body: JSON.stringify({ lessonBlockId: block.id, answer: JSON.stringify({ words: slots, attemptsUsed: next, correct: false }) }),
      });
      if (next >= maxAttempts) {
        setAttemptsExhausted(true);
        setAttemptMessage("Попытки исчерпаны");
      } else {
        const rem = maxAttempts - next;
        setAttemptMessage(`Неверно, осталось ${rem} ${rem === 1 ? "попытка" : "попытки"}`);
      }
    }
  };

  const buildHtml = (filledSlots: (string | null)[], isSubmitted: boolean) => {
    let idx = 0;
    return c.sentenceTemplate.replace(/\[([^\]]+)\]/g, () => {
      const i = idx++;
      const filled = filledSlots[i];
      if (isSubmitted) {
        const ok = filled === correctWords[i];
        return `<span class="${ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800 line-through"} px-1 rounded">${filled || "___"}</span>`;
      }
      return filled
        ? `<span data-idx="${i}" draggable="true" class="inline-block min-w-[60px] px-2 py-0.5 rounded border-2 border-primary-400 bg-primary-50 text-sm cursor-grab active:cursor-grabbing">${filled}</span>`
        : `<span data-idx="${i}" class="inline-block min-w-[60px] px-2 py-0.5 rounded border-2 border-dashed border-zinc-300 text-sm">___</span>`;
    });
  };

  const allFilled = slots.every(s => s !== null);

  if (loading) return <div className="border border-primary-200 rounded-lg p-4 text-sm text-zinc-400">Загрузка...</div>;

  const outerCls = submitted
    ? `rounded-lg p-4 ${isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`
    : "border border-primary-200 rounded-lg p-4";

  return (
    <div className={outerCls}>
      <div ref={contentRef}
        className="text-lg leading-relaxed mb-4 p-3 bg-zinc-50 rounded-lg min-h-[48px] text-content"
      >
        <div className="contents" dangerouslySetInnerHTML={{ __html: buildHtml(slots, submitted || attemptsExhausted) }} />
      </div>

      {!submitted && !attemptsExhausted && pool.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {pool.map((word, i) => (
            <div key={i} onClick={() => clickPoolWord(word)}
              draggable onDragStart={() => { setDragWord(word); setDragSource("pool"); }}
              className="px-3 py-1.5 bg-white border border-primary-300 rounded-lg text-sm hover:bg-primary-50 cursor-grab active:cursor-grabbing transition-colors select-none"
            >
              {word}
            </div>
          ))}
        </div>
      )}

      {attemptsExhausted && !submitted && (
        <div className="flex flex-wrap gap-2 mb-4 opacity-50">
          {correctWords.map((w, i) => (
            <span key={i} className="px-3 py-1.5 bg-zinc-100 border border-zinc-300 rounded-lg text-sm text-zinc-500">{w}</span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        {!submitted && !attemptsExhausted && (
          <button onClick={handleSubmit} disabled={!allFilled}
            className="bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
          >
            Проверить
          </button>
        )}
        {maxAttempts > 1 && <AttemptsDots used={usedAttempts} max={maxAttempts} message={attemptMessage} />}
      </div>

      {attemptsExhausted && !submitted && <p className="text-sm mt-2 text-zinc-500">Попытки исчерпаны. Правильно: {correctWords.join(" ")}</p>}
      {submitted && !isCorrect && <p className="text-sm mt-2">Правильно: {correctWords.join(" ")}</p>}
      {submitted && isCorrect && <p className="text-sm mt-2 text-green-600">✓ Правильно!</p>}
    </div>
  );
}

function ImagePickBlock({ block, studentId }: { block: LessonBlock; studentId: string }) {
  const c = block.content as ImagePickContent;
  const [selected, setSelected] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const maxAttempts = c.maxAttempts || 1;
  const [usedAttempts, setUsedAttempts] = useState(0);
  const [attemptsExhausted, setAttemptsExhausted] = useState(false);
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("block_submissions").select("answer").eq("lesson_block_id", block.id)
      .eq("student_id", studentId).maybeSingle()
      .then(({ data }) => {
        if (data?.answer) {
          try {
            if (data.answer.startsWith("{")) {
              const parsed = JSON.parse(data.answer);
              setSelected(parsed.selected || []);
              setUsedAttempts(parsed.attemptsUsed || 0);
              if (parsed.correct) setSubmitted(true);
              else if ((parsed.attemptsUsed || 0) >= maxAttempts) setAttemptsExhausted(true);
            } else {
              setSelected(data.answer ? data.answer.split(",").map(Number) : []);
              setSubmitted(true);
            }
            setLoading(false);
            return;
          } catch {}
        }
        setLoading(false);
      });
  }, [block.id]);

  const toggle = (i: number) => {
    if (c.multiple) {
      setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
    } else {
      setSelected([i]);
    }
  };

  const isCorrect = JSON.stringify([...selected].sort()) === JSON.stringify([...c.correct].sort());

  const [attemptMessage, setAttemptMessage] = useState("");

  const handleSubmit = async () => {
    if (isCorrect) {
      setAttemptMessage("Верно!");
      await fetch("/api/submit-answer", {
        method: "POST",
        body: JSON.stringify({ lessonBlockId: block.id, answer: JSON.stringify({ selected, attemptsUsed: usedAttempts, correct: true }) }),
      });
      setSubmitted(true);
    } else {
      const next = usedAttempts + 1;
      setUsedAttempts(next);
      await fetch("/api/submit-answer", {
        method: "POST",
        body: JSON.stringify({ lessonBlockId: block.id, answer: JSON.stringify({ selected, attemptsUsed: next, correct: false }) }),
      });
      if (next >= maxAttempts) {
        setAttemptsExhausted(true);
        setAttemptMessage("Попытки исчерпаны");
      } else {
        const rem = maxAttempts - next;
        setAttemptMessage(`Неверно, осталось ${rem} ${rem === 1 ? "попытка" : "попытки"}`);
      }
    }
  };

  if (loading) return <div className="border border-primary-200 rounded-lg p-4 text-sm text-zinc-400">Загрузка...</div>;

  if (submitted) {
    return (
      <div className={`rounded-lg p-4 ${isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
        <div className="font-medium mb-2 text-content" dangerouslySetInnerHTML={{ __html: c.question }} />
        <div className="grid grid-cols-2 gap-2">
          {c.images.map((img, i) => (
            <div key={i} className={`rounded-lg border-2 p-1 ${selected.includes(i) ? "border-primary-500" : "border-transparent"}`}>
              <img src={img.src} alt={img.label} loading="lazy" className="w-full h-24 object-cover rounded" />
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
      <div className="font-medium text-zinc-800 mb-3 text-content" dangerouslySetInnerHTML={{ __html: c.question }} />
      <div className="grid grid-cols-2 gap-3 mb-3">
        {c.images.map((img, i) => (
          <button key={i} onClick={() => toggle(i)}
            className={`rounded-lg border-2 overflow-hidden transition-colors ${selected.includes(i) ? "border-primary-500 ring-2 ring-primary-300" : "border-zinc-200 hover:border-primary-300"} ${attemptsExhausted ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <img src={img.src} alt={img.label} loading="lazy" className="w-full h-28 object-cover" />
            <p className="text-xs text-center py-1 bg-white">{img.label}</p>
          </button>
        ))}
      </div>
      {attemptsExhausted && (
        <p className="text-sm text-red-500 mt-2">Попытки исчерпаны. Верный: {c.correct.map(i => c.images[i]?.label).join(", ")}</p>
      )}
      <div className="flex items-center gap-2">
        <button onClick={handleSubmit} disabled={selected.length === 0 || attemptsExhausted}
          className="bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
        >
          {attemptsExhausted ? "Попытки исчерпаны" : "Ответить"}
        </button>
        {maxAttempts > 1 && <AttemptsDots used={usedAttempts} max={maxAttempts} message={attemptMessage} />}
      </div>
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
        <div className="font-medium mb-2 text-content" dangerouslySetInnerHTML={{ __html: c.prompt }} />
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
      <div className="font-medium text-zinc-800 mb-3 text-content" dangerouslySetInnerHTML={{ __html: c.prompt }} />

      {cameraError && <p className="text-sm text-red-500 mb-2">{cameraError}</p>}

      {!recording && !videoUrl && (
        <button onClick={startRecording} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 inline-flex items-center gap-1.5"><Video className="w-4 h-4" /> Записать видео</button>
      )}

      {recording && (
        <div>
          <video ref={videoRef} autoPlay muted className="w-full max-w-md rounded mb-2 bg-black" />
        <button onClick={stopRecording} className="bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm inline-flex items-center gap-1.5"><Square className="w-4 h-4" /> Остановить</button>
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

function AttemptsDots({ used, max, message }: { used: number; max: 1 | 3; message?: string }) {
  if (max === 1) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500">
      <div className="flex flex-col items-center gap-[2px]">
        {Array.from({ length: max }, (_, i) => (
          <span
            key={i}
            className={`w-[5px] h-[5px] rounded-full border border-primary-400 ${i < used ? "bg-primary-500" : "bg-white"}`}
          />
        ))}
      </div>
      {message && <span>{message}</span>}
    </div>
  );
}

function GroupDragBlock({ block, studentId }: { block: LessonBlock; studentId: string }) {
  const c = block.content as GroupDragContent;
  const groups = c.groups || [];
  const supabase = createClient();

  const flatAll = groups.flatMap((g, gi) => g.words.map(w => ({ word: w, groupIdx: gi })));

  const [pool, setPool] = useState<string[]>([]);
  const [slots, setSlots] = useState<{ groupIdx: number; word: string | null }[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [usedAttempts, setUsedAttempts] = useState(0);
  const maxAttempts = c.maxAttempts || 1;
  const [attemptsExhausted, setAttemptsExhausted] = useState(false);
  const [attemptMessage, setAttemptMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialSlots = groups.flatMap((g, gi) =>
      g.words.map(() => ({ groupIdx: gi, word: null as string | null }))
    );

    supabase.from("block_submissions").select("answer").eq("lesson_block_id", block.id)
      .eq("student_id", studentId).maybeSingle()
      .then(({ data }) => {
        if (data?.answer) {
          try {
            const parsed = JSON.parse(data.answer);
            const savedWords: (string | null)[] = parsed.words || parsed;
            const savedAttempts = parsed.attemptsUsed || 0;
            const wasCorrect = parsed.correct === true;
            const allFilled = savedWords.every(v => v !== null);
            const restored = initialSlots.map((slot, i) => ({
              ...slot,
              word: savedWords[i] || null
            }));
            setSlots(restored);
            const placed = savedWords.filter((w): w is string => w !== null);
            setPool(flatAll.map(w => w.word).filter(w => !placed.includes(w)).sort(() => Math.random() - 0.5));
            setUsedAttempts(savedAttempts);
            if (wasCorrect) {
              setSubmitted(true);
            } else if (savedAttempts >= maxAttempts) {
              setAttemptsExhausted(true);
            }
            setLoading(false);
            return;
          } catch {}
        }
        setSlots(initialSlots);
        setPool([...flatAll].sort(() => Math.random() - 0.5).map(w => w.word));
        setLoading(false);
      });
  }, [c.groups]);

  const handleDragStart = (e: React.DragEvent, word: string) => {
    e.dataTransfer.setData("text/plain", word);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const placeWord = (word: string, slotIdx: number) => {
    setSlots(prev => {
      const copy = [...prev];
      if (copy[slotIdx].word) setPool(p => [...p, copy[slotIdx].word!]);
      copy[slotIdx] = { ...copy[slotIdx], word };
      return copy;
    });
    setPool(prev => {
      const next = prev.filter(w => w !== word);
      if (next.length === prev.length) return prev;
      return next;
    });
  };

  const handleSlotDrop = (e: React.DragEvent, slotIdx: number) => {
    e.preventDefault();
    const word = e.dataTransfer.getData("text/plain");
    if (!word) return;
    placeWord(word, slotIdx);
  };

  const handlePoolDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const word = e.dataTransfer.getData("text/plain");
    if (!word) return;
    setSlots(prev => {
      const copy = [...prev];
      const idx = copy.findIndex(s => s.word === word);
      if (idx >= 0) copy[idx] = { ...copy[idx], word: null };
      return copy;
    });
    setPool(prev => prev.includes(word) ? prev : [...prev, word]);
  };

  const handleSlotClick = (slotIdx: number) => {
    const slot = slots[slotIdx];
    if (!slot.word) return;
    setSlots(prev => {
      const copy = [...prev];
      copy[slotIdx] = { ...copy[slotIdx], word: null };
      return copy;
    });
    setPool(prev => [...prev, slot.word!]);
  };

  const handlePoolClick = (word: string) => {
    const emptyIdx = slots.findIndex(s => s.word === null);
    if (emptyIdx < 0) return;
    setSlots(prev => {
      const copy = [...prev];
      copy[emptyIdx] = { ...copy[emptyIdx], word };
      return copy;
    });
    setPool(prev => prev.filter(w => w !== word));
  };

  const allFilled = slots.length > 0 && slots.every(s => s.word !== null);

  const checkCorrect = () => groups.every((g, gi) => {
    const placed = slots.filter(s => s.groupIdx === gi && s.word !== null).map(s => s.word);
    return g.words.every(w => placed.includes(w));
  });

  const handleSubmit = async () => {
    const correct = checkCorrect();
    if (!correct) {
      const next = usedAttempts + 1;
      setUsedAttempts(next);
      if (next >= maxAttempts) {
        setAttemptsExhausted(true);
        setAttemptMessage("Попытки исчерпаны");
      } else {
        const rem = maxAttempts - next;
        setAttemptMessage(`Неверно, осталось ${rem} ${rem === 1 ? "попытка" : "попытки"}`);
      }
      await fetch("/api/submit-answer", {
        method: "POST",
        body: JSON.stringify({ lessonBlockId: block.id, answer: JSON.stringify({ words: slots.map(s => s.word), attemptsUsed: next, correct: false }) }),
      });
      return;
    }
    setAttemptMessage("Верно!");
    await fetch("/api/submit-answer", {
      method: "POST",
      body: JSON.stringify({ lessonBlockId: block.id, answer: JSON.stringify({ words: slots.map(s => s.word), attemptsUsed: usedAttempts, correct: true }) }),
    });
    setSubmitted(true);
  };

  const groupColors = ["#FF6B35", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"];

  if (loading) return <div className="border border-primary-200 rounded-lg p-4 text-sm text-zinc-400">Загрузка...</div>;

  if (submitted) {
    const isCorrect = checkCorrect();
    return (
      <div className={`rounded-lg p-4 ${isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
        {c.instruction && <div className="font-medium mb-3 text-content" dangerouslySetInnerHTML={{ __html: c.instruction }} />}
        <div className={c.layout === "table" ? "table w-full border-collapse" : "grid gap-4"} style={c.layout === "columns" ? { gridTemplateColumns: `repeat(${groups.length}, 1fr)` } : {}}>
          {groups.map((g, gi) => {
            const groupSlots = slots.filter(s => s.groupIdx === gi);
            return (
              <div key={gi} className={c.layout === "table" ? "table-cell align-top p-2 border border-zinc-200" : ""}>
                <div className="font-semibold text-sm mb-2 px-2 py-1 rounded" style={{ backgroundColor: groupColors[gi % groupColors.length] + "22", color: groupColors[gi % groupColors.length] }}>{g.label}</div>
                {groupSlots.map((slot, si) => {
                  const ok = slot.word !== null && g.words.includes(slot.word);
                  return (
                    <div key={si} className={`p-2 mb-1 rounded text-sm ${ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {slot.word || "___"}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <p className="text-sm mt-1">{isCorrect ? "✓ Правильно" : "✗ Неправильно"}</p>
      </div>
    );
  }

  return (
    <div className="border border-primary-200 rounded-lg p-4">
      {c.instruction && <div className="font-medium mb-3 text-content" dangerouslySetInnerHTML={{ __html: c.instruction }} />}

      <div className={c.layout === "table" ? "table w-full border-collapse mb-4" : "grid gap-4 mb-4"} style={c.layout === "columns" ? { gridTemplateColumns: `repeat(${groups.length}, 1fr)` } : {}}>
        {groups.map((g, gi) => {
          const groupSlots = slots.filter(s => s.groupIdx === gi);
          return (
            <div key={gi} className={c.layout === "table" ? "table-cell align-top p-2 border border-zinc-200" : ""}>
              <div className="font-semibold text-sm mb-2 px-2 py-1 rounded" style={{ backgroundColor: groupColors[gi % groupColors.length] + "22", color: groupColors[gi % groupColors.length] }}>{g.label}</div>
              {groupSlots.map((slot, si) => {
                const idx = slots.indexOf(slot);
                return (
                  <div key={si}
                    draggable={!!slot.word}
                    onDragStart={slot.word ? (e) => handleDragStart(e, slot.word!) : undefined}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleSlotDrop(e, idx)}
                    onClick={() => handleSlotClick(idx)}
                    className={`p-2 mb-1 rounded text-sm border-2 select-none transition-colors min-h-[36px] ${slot.word ? "border-primary-400 bg-primary-50 cursor-grab active:cursor-grabbing" : "border-dashed border-zinc-300 bg-zinc-50"}`}
                  >
                    {slot.word || <span className="text-zinc-300">перетащи сюда</span>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {!attemptsExhausted && pool.length > 0 && (
        <div onDragOver={handleDragOver} onDrop={handlePoolDrop} className="flex flex-wrap gap-2 mb-4 p-3 rounded-lg bg-zinc-50 border-2 border-dashed border-zinc-200 min-h-[44px]">
          {pool.map((word, i) => (
            <div key={i}
              draggable
              onDragStart={(e) => handleDragStart(e, word)}
              onClick={() => handlePoolClick(word)}
              className="px-3 py-1.5 bg-white border-2 border-zinc-300 rounded-lg text-sm hover:border-primary-400 hover:bg-primary-50 cursor-grab active:cursor-grabbing transition-colors select-none"
            >
              {word}
            </div>
          ))}
        </div>
      )}

      {attemptsExhausted && (
        <div className="flex flex-wrap gap-2 mb-4 opacity-50">
          {flatAll.map((item, i) => (
            <span key={i} className="px-3 py-1.5 bg-zinc-100 border border-zinc-300 rounded-lg text-sm text-zinc-500">{item.word}</span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        {!submitted && (
          <button onClick={handleSubmit} disabled={!allFilled || attemptsExhausted}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${attemptsExhausted ? "bg-zinc-300 text-zinc-500 cursor-not-allowed" : "bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"}`}
          >
            {attemptsExhausted ? "Попытки исчерпаны" : "Проверить"}
          </button>
        )}
        {maxAttempts > 1 && <AttemptsDots used={usedAttempts} max={maxAttempts} message={attemptMessage} />}
      </div>

      {attemptsExhausted && (
        <div className="mt-2 text-sm text-zinc-500">
          {groups.map((g, gi) => (
            <div key={gi} className="mb-1">
              <span className="font-medium">{g.label}:</span> {g.words.join(", ")}
            </div>
          ))}
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
      {block.type === "group_drag" && studentId && <GroupDragBlock block={block} studentId={studentId} />}
    </div>
  );
}
