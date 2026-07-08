"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, X, Volume2, Check, Loader2 } from "lucide-react";

interface Props {
  word: string;
  contextSentence?: string;
  lessonId?: string;
  onAdded?: () => void;
  children?: React.ReactNode;
}

export function AddWordFromLesson({ word, contextSentence, lessonId, onAdded, children }: Props) {
  const [show, setShow] = useState(false);
  const [translation, setTranslation] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) setShow(false);
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [show]);

  const open = useCallback(async () => {
    setShow(true);
    setDone(false);
    setLoading(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: word }),
      });
      const data = await res.json();
      setTranslation(data.translation ?? "");
    } catch {}
    setLoading(false);
  }, [word]);

  const handleAdd = async () => {
    if (!translation.trim()) return;
    setSaving(true);
    const res = await fetch("/api/vocabulary", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        word,
        translation: translation.trim(),
        example_sentence: contextSentence || undefined,
        source_lesson_id: lessonId || undefined,
      }),
    });
    if (res.ok) {
      setDone(true);
      setTimeout(() => setShow(false), 800);
      onAdded?.();
    }
    setSaving(false);
  };

  return (
    <>
      <span onClick={open} className="relative inline-flex items-center cursor-help border-b border-dashed border-primary-300 hover:border-primary-500 transition-colors">
        {children ?? word}
        <Plus className="w-3 h-3 text-primary-400 ml-0.5 shrink-0 opacity-60 group-hover:opacity-100" />
      </span>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShow(false)}>
          <div ref={popupRef} onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-border p-5 max-w-sm w-full mx-4 animate-fade-in-up"
            style={{ animation: "fade-in-up 0.2s ease-out" }}
          >
            {done ? (
              <div className="text-center py-4">
                <Check className="w-8 h-8 text-secondary-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-accent">Добавлено в словарь</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-accent text-base">Добавить в словарь</h3>
                  <button onClick={() => setShow(false)}><X className="w-4 h-4 text-muted" /></button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-accent">{word}</span>
                  <button onClick={() => {
                    const u = new SpeechSynthesisUtterance(word);
                    u.lang = "es-ES";
                    u.rate = 0.8;
                    speechSynthesis.speak(u);
                  }} className="p-1 rounded-lg hover:bg-primary-50 text-primary-500 transition-colors">
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Перевод</label>
                  {loading ? (
                    <div className="flex items-center gap-2 text-sm text-muted"><Loader2 className="w-4 h-4 animate-spin" /> Переводим...</div>
                  ) : (
                    <input value={translation} onChange={e => setTranslation(e.target.value)}
                      className="glass-input w-full text-sm" placeholder="Перевод" autoFocus />
                  )}
                </div>

                {contextSentence && (
                  <div>
                    <label className="text-xs font-semibold text-muted mb-1 block">Контекст</label>
                    <p className="text-sm text-muted italic bg-primary-50 p-2 rounded-xl">{contextSentence}</p>
                  </div>
                )}

                <button onClick={handleAdd} disabled={saving || !translation.trim()}
                  className="btn-gradient w-full justify-center text-sm">
                  {saving ? "Сохранение..." : "➕ Добавить в словарь"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
