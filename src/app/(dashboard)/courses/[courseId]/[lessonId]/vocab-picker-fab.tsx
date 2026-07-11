"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useVocabPicker } from "@/components/vocab-picker-context";
import { BookOpen, BookMarked, X, Volume2, Loader2, Check, Languages } from "lucide-react";

const TIMEOUT = 10000;

function getWordAtPoint(x: number, y: number): string | null {
  try {
    const range = document.caretRangeFromPoint(x, y);
    if (!range) return null;
    const node = range.startContainer;
    if (!node || !node.textContent) return null;
    const text = node.textContent;
    const offset = range.startOffset;
    if (offset < 0 || offset > text.length) return null;
    let start = offset;
    while (start > 0 && /\S/.test(text[start - 1])) start--;
    let end = offset;
    while (end < text.length && /\S/.test(text[end])) end++;
    const word = text.slice(start, end).replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/g, "");
    return word.length >= 2 ? word.toLowerCase() : null;
  } catch {
    return null;
  }
}

function getContextAtPoint(x: number, y: number): string {
  const el = document.elementFromPoint(x, y);
  if (!el) return "";
  const ctxEl = (el as HTMLElement).closest("p, li, td, th, h1, h2, h3, h4, h5, h6, [class*='prose'] > *, .card, .text-content, [data-translate]");
  const ctx = ctxEl?.textContent?.trim() ?? "";
  return ctx.length > 300 ? ctx.slice(0, 300) + "..." : ctx;
}

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

  const [fullTrans, setFullTrans] = useState<{ text: string; translation: string } | null>(null);
  const [fullTransLoading, setFullTransLoading] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; pendingRef.current?.abort(); };
  }, []);

  useEffect(() => {
    if (!loading && !saving) return;
    const id = setTimeout(() => {
      if (!mountedRef.current) return;
      setLoading(false);
      setSaving(false);
    }, TIMEOUT);
    return () => clearTimeout(id);
  }, [loading, saving]);

  const openAddWord = useCallback((pickedWord: string, ctx: string) => {
    if (wordRef.current !== null) return;
    pendingRef.current?.abort();
    const ctrl = new AbortController();
    pendingRef.current = ctrl;

    setWord(pickedWord);
    setContext(ctx);
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
  }, []);

  const openFullTranslation = useCallback((ctx: string) => {
    setFullTransLoading(true);
    setFullTrans(null);
    fetch("/api/translate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: ctx }),
    }).then(r => r.json()).then(d => {
      if (mountedRef.current) {
        setFullTrans({ text: ctx, translation: d.translation ?? "" });
      }
    }).catch(() => {}).finally(() => {
      if (mountedRef.current) setFullTransLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!pickMode) { setWord(null); return; }

    document.body.style.touchAction = "manipulation";

    let lastTapTime = 0;
    let lastTapPos = { x: 0, y: 0 };
    let longPressTimer: ReturnType<typeof setTimeout> | null = null;
    let dblclicked = false;
    let touchConsumed = false;

    const resetTouch = () => { setTimeout(() => { touchConsumed = false; }, 400); };

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

      const ctxEl = target.closest("p, li, td, th, h1, h2, h3, h4, h5, h6, [class*='prose'] > *, .card, .text-content");
      const ctx = ctxEl?.textContent?.trim() ?? target.parentElement?.textContent?.trim() ?? "";
      openAddWord(pickedWord, ctx.length > 300 ? ctx.slice(0, 300) + "..." : ctx);
    };

    const clickHandler = (e: MouseEvent) => {
      if (touchConsumed) { touchConsumed = false; return; }
      if (dblclicked) { dblclicked = false; return; }
      processWord(e);
    };

    const dblclickHandler = (e: MouseEvent) => {
      if (touchConsumed) { touchConsumed = false; return; }
      dblclicked = true;
      processWord(e);
      setTimeout(() => { dblclicked = false; }, 400);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || wordRef.current !== null) return;
      const target = e.target as HTMLElement;
      if (target.closest("button, input, textarea, a, select, [data-no-pick], [data-pick-fab], [data-pick-popup]")) return;

      const touch = e.touches[0];
      const now = Date.now();
      const dt = now - lastTapTime;
      const dx = Math.abs(touch.clientX - lastTapPos.x);
      const dy = Math.abs(touch.clientY - lastTapPos.y);

      if (dt < 300 && dt > 0 && dx < 30 && dy < 30) {
        if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        e.preventDefault();
        touchConsumed = true;
        resetTouch();

        const w = getWordAtPoint(touch.clientX, touch.clientY);
        if (w) {
          const ctx = getContextAtPoint(touch.clientX, touch.clientY);
          openAddWord(w, ctx);
        }
        lastTapTime = 0;
        return;
      }

      lastTapTime = now;
      lastTapPos = { x: touch.clientX, y: touch.clientY };

      longPressTimer = setTimeout(() => {
        e.preventDefault();
        touchConsumed = true;
        resetTouch();
        const ctx = getContextAtPoint(lastTapPos.x, lastTapPos.y);
        if (ctx && ctx.length >= 5) openFullTranslation(ctx);
      }, 600);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (longPressTimer && lastTapPos) {
        const touch = e.touches[0];
        if (Math.abs(touch.clientX - lastTapPos.x) > 10 || Math.abs(touch.clientY - lastTapPos.y) > 10) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      }
    };

    const handleTouchEnd = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };

    document.addEventListener("click", clickHandler, true);
    document.addEventListener("dblclick", dblclickHandler, true);
    document.addEventListener("touchstart", handleTouchStart, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.body.style.touchAction = "";
      document.removeEventListener("click", clickHandler, true);
      document.removeEventListener("dblclick", dblclickHandler, true);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      pendingRef.current?.abort();
      if (longPressTimer) clearTimeout(longPressTimer);
    };
  }, [pickMode, openAddWord, openFullTranslation]);

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
  const closeFullTrans = useCallback(() => setFullTrans(null), []);

  if (disabled) return null;

  return (
    <>
      <button data-pick-fab
        onClick={togglePickMode}
        className={`fixed max-md:bottom-20 md:top-20 z-40 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
          pickMode
            ? "bg-primary-500 text-white ring-4 ring-primary-200 animate-pulse"
            : "bg-white text-primary-500 border-2 border-primary-200"
        }`}
        style={{ right: "calc(1rem + var(--tools-panel-width, 0px))" }}
        title={pickMode ? "Выключить режим словаря" : "Включить режим словаря (жми на слова)"}
      >
        {pickMode ? <BookMarked className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
      </button>

      {pickMode && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-primary-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2 pointer-events-none">
          <BookMarked className="w-4 h-4 shrink-0" />
          <span className="md:hidden">Двойной тап — слово, долгое нажатие — перевод</span>
          <span className="hidden md:inline">Двойной клик левой кнопкой — слово, правая кнопка — перевод</span>
          <button onClick={togglePickMode} className="ml-1 hover:bg-white/20 rounded-full p-0.5 pointer-events-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {fullTransLoading && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-white rounded-xl shadow-xl border border-border px-4 py-3 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
          <span className="text-sm text-muted">Переводим текст...</span>
        </div>
      )}

      {fullTrans && !fullTransLoading && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={closeFullTrans}>
          <div onClick={e => e.stopPropagation()}
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border p-5 max-w-lg w-full mx-0 sm:mx-4 max-h-[60vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-accent text-base flex items-center gap-2">
                <Languages className="w-4 h-4 text-primary-500" /> Перевод текста
              </h3>
              <button onClick={closeFullTrans}><X className="w-4 h-4 text-muted" /></button>
            </div>
            <div className="overflow-y-auto space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Оригинал (исп.)</label>
                <p className="text-sm text-accent bg-primary-50 p-3 rounded-xl leading-relaxed">{fullTrans.text}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Перевод (рус.)</label>
                <p className="text-sm text-accent bg-secondary-50 p-3 rounded-xl leading-relaxed">{fullTrans.translation}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <button onClick={() => {
                const u = new SpeechSynthesisUtterance(fullTrans.text);
                u.lang = "es-ES"; u.rate = 0.7;
                speechSynthesis.speak(u);
              }} className="flex items-center gap-1.5 text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors">
                <Volume2 className="w-4 h-4" /> Озвучить
              </button>
            </div>
          </div>
        </div>
      )}

      {word && !fullTrans && (
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
