"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shuffle, ArrowLeft, ArrowRight, RotateCcw, Layers, BookOpen, MessageCircle, GraduationCap, Volume2 } from "lucide-react";

export default function CardsGamePage() {
  const router = useRouter();
  const supabase = createClient();
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const res = await fetch("/api/vocabulary");
      if (res.ok) {
        const data = await res.json();
        setWords(data);
      }
      setLoading(false);
    })();
  }, []);

  const shuffle = useCallback(() => {
    setWords(prev => {
      const copy = [...prev];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    });
    setIdx(0);
    setFlipped(false);
    setKnown(new Set());
  }, []);

  const markKnown = () => {
    setKnown(prev => new Set([...prev, idx]));
  };

  const next = () => {
    if (idx < words.length - 1) {
      setIdx(idx + 1);
      setFlipped(false);
    }
  };

  const prev = () => {
    if (idx > 0) {
      setIdx(idx - 1);
      setFlipped(false);
    }
  };

  const progress = words.length > 0 ? Math.round((known.size / words.length) * 100) : 0;

  if (loading) return <div className="text-center py-16 text-muted">Загрузка...</div>;

  if (words.length === 0) {
    return (
      <div className="text-center py-16 text-muted">
        <p className="text-lg mb-2">Словарь пуст</p>
        <p className="text-sm">Добавь слова в словарь, чтобы тренироваться</p>
      </div>
    );
  }

  const w = words[idx];

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-accent flex items-center gap-2"><Layers className="w-7 h-7 text-primary-500" strokeWidth={1.5} /> Карточки</h1>
        <button onClick={shuffle} className="text-sm bg-zinc-100 text-muted px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-zinc-200">
          <Shuffle className="w-4 h-4" /> Перемешать
        </button>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-muted mb-2">
          <span>{idx + 1} из {words.length}</span>
          <span>Знаю: {known.size} ({progress}%)</span>
        </div>
        <div className="w-full bg-zinc-100 rounded-full h-2">
          <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="perspective-1000 cursor-pointer" onClick={() => setFlipped(!flipped)} style={{ minHeight: "280px" }}>
        <div className={`relative w-full h-64 sm:h-72 transition-transform duration-500 preserve-3d ${flipped ? "rotate-y-180" : ""}`}>
          <div className="absolute inset-0 glass-card flex flex-col items-center justify-center p-8 backface-hidden rounded-2xl">
            <p className="text-3xl sm:text-4xl font-bold text-accent text-center">{w?.word}</p>
            {w?.transcription && <p className="text-sm text-muted mt-3">[{w.transcription}]</p>}
            <button onClick={e => { e.stopPropagation(); const u = new SpeechSynthesisUtterance(w?.word); u.lang = "es-ES"; u.rate = 0.8; speechSynthesis.speak(u); }}
              className="mt-4 p-2 rounded-full bg-primary-50 text-primary-500 hover:bg-primary-100 transition-colors">
              <Volume2 className="w-5 h-5" />
            </button>
            {known.has(idx) && <span className="absolute top-4 right-4 text-green-500 text-sm font-medium">✓ Знаю</span>}
            <p className="text-xs text-muted absolute bottom-4">Нажми, чтобы перевернуть</p>
          </div>
          <div className="absolute inset-0 glass-card flex flex-col items-center justify-center p-8 backface-hidden rotate-y-180 rounded-2xl">
            <p className="text-3xl sm:text-4xl font-bold text-accent text-center">{w?.translation}</p>
            {w?.example_sentence && <p className="text-sm text-muted mt-4 italic text-center max-w-sm">{w.example_sentence}</p>}
            {w?.tags && w.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
                {w.tags.map((t: string) => <span key={t} className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded">{t}</span>)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-8">
        <button onClick={prev} disabled={idx === 0}
          className="p-3 rounded-full bg-zinc-100 text-muted hover:bg-zinc-200 disabled:opacity-30 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button onClick={() => { markKnown(); next(); }}
          className="bg-green-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 transition-all">
          Знаю →
        </button>
        <button onClick={next}
          className="bg-primary-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600 transition-all">
          Ещё →
        </button>
        <button onClick={next} disabled={idx >= words.length - 1}
          className="p-3 rounded-full bg-zinc-100 text-muted hover:bg-zinc-200 disabled:opacity-30 transition-all">
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <div className="text-center mt-6">
        <button onClick={() => { setIdx(0); setFlipped(false); setKnown(new Set()); }}
          className="text-xs text-muted hover:text-accent flex items-center gap-1 mx-auto">
          <RotateCcw className="w-3 h-3" /> Начать заново
        </button>
      </div>

      {/* Cross-links */}
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <Link href="/tools/vocabulary" className="card px-4 py-2.5 text-sm font-medium text-accent hover:text-primary-500 transition-colors flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center text-white shrink-0"><BookOpen className="w-4 h-4" /></span>
          Словарь
        </Link>
        <Link href="/tools/chat" className="card px-4 py-2.5 text-sm font-medium text-accent hover:text-primary-500 transition-colors flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-secondary-400 to-secondary-500 flex items-center justify-center text-white shrink-0"><MessageCircle className="w-4 h-4" /></span>
          Чат с учителем
        </Link>
        <Link href="/courses" className="card px-4 py-2.5 text-sm font-medium text-accent hover:text-primary-500 transition-colors flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold-400 to-orange-500 flex items-center justify-center text-white shrink-0"><GraduationCap className="w-4 h-4" /></span>
          Все курсы
        </Link>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}
