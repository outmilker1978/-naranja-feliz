"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useVocabPicker } from "@/components/vocab-picker-context";
import { BookOpen, BookMarked, X, Volume2, Loader2, Check } from "lucide-react";

const TIMEOUT = 10000;

export function VocabPickerFab({ lessonId }: { lessonId: string }) {
  const { pickMode, togglePickMode, disabled } = useVocabPicker();
  const [word, setWord] = useState<string | null>(null);
  const [translation, setTranslation] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [context, setContext] = useState("");
  const [tags, setTags] = useState("");
  const [transcription, setTranscription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isFuncWord, setIsFuncWord] = useState(false);
  const wordRef = useRef<string | null>(null);
  const pendingRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  wordRef.current = word;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; pendingRef.current?.abort(); };
  }, []);

  // Safety timeout to reset loading/saving if something hangs
  useEffect(() => {
    if (!loading && !saving) return;
    const id = setTimeout(() => {
      if (!mountedRef.current) return;
      setLoading(false);
      setSaving(false);
    }, TIMEOUT);
    return () => clearTimeout(id);
  }, [loading, saving]);

  // Global click handler (drag-select) + dblclick handler (word-select)
  useEffect(() => {
    if (!pickMode) { setWord(null); return; }
    let dblclicked = false;

    const processWord = (e: MouseEvent) => {
      if (wordRef.current !== null) return;
      const target = e.target as HTMLElement;
      if (target.closest("button, input, textarea, a, select, [data-no-pick], [data-pick-fab], [data-pick-popup]")) return;

      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !sel.toString().trim()) return;
      const pickedWord = sel.toString().trim().split(/\s+/)[0];
      sel.removeAllRanges();
      if (pickedWord.length < 2) return;

      e.preventDefault();
      e.stopPropagation();

      pendingRef.current?.abort();
      const ctrl = new AbortController();
      pendingRef.current = ctrl;

      const ctxEl = target.closest("p, li, td, th, h1, h2, h3, h4, h5, h6, [class*='prose'] > *, .card, .text-content");
      const ctx = ctxEl?.textContent?.trim() ?? target.parentElement?.textContent?.trim() ?? "";

      setWord(pickedWord);
      setContext(ctx.length > 300 ? ctx.slice(0, 300) + "..." : ctx);
      setDone(false);
      setTranslation("");
      setTags("");
      setTranscription("");
      setError(null);
      setIsFuncWord(false);
      setLoading(true);

      fetch("/api/translate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pickedWord }),
        signal: ctrl.signal,
      }).then(r => r.json()).then(d => {
        if (mountedRef.current) {
          setTranslation(d.translation ?? "");
          setIsFuncWord(!!d.functionWord);
        }
      }).catch(() => {}).finally(() => {
        if (mountedRef.current) setLoading(false);
      });

      fetch("/api/transcription", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pickedWord }),
        signal: ctrl.signal,
      }).then(r => r.json()).then(d => {
        if (mountedRef.current && d.transcription) setTranscription(d.transcription);
      }).catch(() => {});
    };

    const clickHandler = (e: MouseEvent) => {
      if (dblclicked) { dblclicked = false; return; }
      processWord(e);
    };

    const dblclickHandler = (e: MouseEvent) => {
      dblclicked = true;
      setTimeout(() => { dblclicked = false; }, 400);
      processWord(e);
    };

    document.addEventListener("click", clickHandler, true);
    document.addEventListener("dblclick", dblclickHandler, true);
    return () => {
      document.removeEventListener("click", clickHandler, true);
      document.removeEventListener("dblclick", dblclickHandler, true);
      pendingRef.current?.abort();
    };
  }, [pickMode]);

  const handleAdd = useCallback(async () => {
    if (!word || !translation.trim() || saving) return;
    setSaving(true);
    setError(null);
    const tagsArr = tags.split(",").map(t => t.trim()).filter(Boolean);
    try {
      const ctrl = new AbortController();
      const id = setTimeout(() => ctrl.abort(), TIMEOUT);
      const res = await fetch("/api/vocabulary", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word,
          translation: translation.trim(),
          transcription: transcription || undefined,
          tags: tagsArr,
          example_sentence: context || undefined,
          source_lesson_id: lessonId || undefined,
        }),
        signal: ctrl.signal,
      });
      clearTimeout(id);
      if (res.ok) {
        setDone(true);
        setTimeout(() => { if (mountedRef.current) { setWord(null); setDone(false); } }, 800);
      } else {
        const data = await res.json();
        if (mountedRef.current) setError(data.error || "Ошибка сохранения");
      }
    } catch {}
    if (mountedRef.current) setSaving(false);
  }, [word, translation, tags, transcription, context, lessonId, saving]);

  const close = useCallback(() => { pendingRef.current?.abort(); setWord(null); }, []);

  if (disabled) return null;

  return (
    <>
      <button data-pick-fab
        onClick={togglePickMode}
        className={`fixed bottom-20 right-4 sm:right-6 z-40 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
          pickMode
            ? "bg-primary-500 text-white ring-4 ring-primary-200 animate-pulse"
            : "bg-white text-primary-500 border-2 border-primary-200"
        }`}
        title={pickMode ? "Выключить режим словаря" : "Включить режим словаря (жми на слова)"}
      >
        {pickMode ? <BookMarked className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
      </button>

      {pickMode && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-primary-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2 pointer-events-none">
          <BookMarked className="w-4 h-4" /> Режим словаря — выдели слово
          <button onClick={togglePickMode} className="ml-1 hover:bg-white/20 rounded-full p-0.5 pointer-events-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {word && (
        <div data-pick-popup className="fixed inset-0 z-50 flex items-center justify-center" onClick={close}>
          <div onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-border p-5 max-w-sm w-full mx-4"
          >
            {done ? (
              <div className="text-center py-4">
                <Check className="w-8 h-8 text-secondary-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-accent">Добавлено в словарь!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-accent text-base">Добавить в словарь</h3>
                  <button onClick={close}><X className="w-4 h-4 text-muted" /></button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-accent">{word}</span>
                  <button onClick={() => { const u = new SpeechSynthesisUtterance(word); u.lang = "es-ES"; u.rate = 0.8; speechSynthesis.speak(u); }}
                    className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-500 transition-colors">
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Перевод</label>
                  {loading ? (
                    <div className="flex items-center gap-2 text-sm text-muted"><Loader2 className="w-4 h-4 animate-spin" /> Переводим...</div>
                  ) : isFuncWord ? (
                    <div className="text-sm bg-primary-50 text-accent p-2.5 rounded-xl leading-relaxed flex items-start gap-2"><BookOpen className="w-4 h-4 mt-0.5 shrink-0 text-primary-500" /> {translation}</div>
                  ) : (
                    <input value={translation} onChange={e => setTranslation(e.target.value)}
                      className="glass-input w-full text-sm" placeholder="Перевод" autoFocus />
                  )}
                  {!loading && !translation && <p className="text-xs text-muted mt-1">Автоперевод не сработал — впиши перевод вручную</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Транскрипция</label>
                  <input value={transcription} onChange={e => setTranscription(e.target.value)}
                    className="glass-input w-full text-sm" placeholder="Необязательно" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Теги (через запятую)</label>
                  <input value={tags} onChange={e => setTags(e.target.value)}
                    className="glass-input w-full text-sm" placeholder="viajar, comida, работа" />
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                {context && context !== word && (
                  <div>
                    <label className="text-xs font-semibold text-muted mb-1 block">Контекст</label>
                    <p className="text-sm text-muted italic bg-primary-50 p-2 rounded-xl">{context}</p>
                  </div>
                )}

                <button onClick={handleAdd} disabled={saving || !translation.trim()}
                  className="btn-gradient w-full justify-center text-sm">
                  {saving ? "Сохранение..." : "Добавить в словарь"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
