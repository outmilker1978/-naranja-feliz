"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Search, Plus, X, FlipHorizontal, List, Shuffle, ArrowLeft, ArrowRight, Volume2, Layers, MessageCircle, GraduationCap } from "lucide-react";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface Word {
  id: string;
  word: string;
  translation: string;
  transcription: string | null;
  example_sentence: string | null;
  tags: string[];
  category: string;
  created_at: string;
}

export default function VocabularyPage() {
  const router = useRouter();
  const supabase = createClient();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [letter, setLetter] = useState("");
  const [mode, setMode] = useState<"list" | "cards">("list");
  const [showAdd, setShowAdd] = useState(false);
  const [addWord, setAddWord] = useState("");
  const [addTrans, setAddTrans] = useState("");
  const [addTransc, setAddTransc] = useState("");
  const [addExample, setAddExample] = useState("");
  const [addTags, setAddTags] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const load = async (q?: string) => {
    const params = new URLSearchParams();
    if (q) params.set("search", q);
    const res = await fetch(`/api/vocabulary?${params}`);
    if (res.ok) setWords(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      load();
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = [...words].sort((a, b) => a.word.localeCompare(b.word));
    if (letter) list = list.filter(w => w.word.toLowerCase().startsWith(letter.toLowerCase()));
    if (search) list = list.filter(w =>
      w.word.toLowerCase().includes(search.toLowerCase()) ||
      w.translation.toLowerCase().includes(search.toLowerCase()) ||
      w.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    );
    return list;
  }, [words, search, letter]);

  const allTags = useMemo(() => [...new Set(words.flatMap(w => w.tags))], [words]);

  const handleAdd = async () => {
    if (!addWord.trim() || !addTrans.trim()) return;
    const tags = addTags.split(",").map(t => t.trim()).filter(Boolean);
    const res = await fetch("/api/vocabulary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: addWord, translation: addTrans, transcription: addTransc || undefined, example_sentence: addExample || undefined, tags }),
    });
    if (res.ok) {
      const newWord = await res.json();
      setShowAdd(false);
      setAddWord(""); setAddTrans(""); setAddTransc(""); setAddExample(""); setAddTags("");
      setWords(prev => [newWord, ...prev]);
    } else {
      const e = await res.json();
      alert(e.error || "Ошибка");
    }
  };

  const handleDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Удалить ${selected.size} слов?`)) return;
    const ids = [...selected];
    const res = await fetch("/api/vocabulary", {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }),
    });
    if (res.ok) {
      setSelected(new Set());
      setWords(prev => prev.filter(w => !ids.includes(w.id)));
    }
  };

  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [currentFlipped, setCurrentFlipped] = useState(false);

  useEffect(() => { setCurrentCardIdx(0); setCurrentFlipped(false); }, [filtered.length, mode]);

  const cardWord = filtered[currentCardIdx];

  if (loading) return <div className="text-center py-16 text-muted">Загрузка...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-accent">Словарь</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setMode(mode === "list" ? "cards" : "list")}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${mode === "cards" ? "bg-primary-500 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
            {mode === "list" ? <FlipHorizontal className="w-4 h-4" /> : <List className="w-4 h-4" />}
            {mode === "list" ? "Карточки" : "Список"}
          </button>
          <button onClick={() => setShowAdd(true)}
            className="bg-primary-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-primary-600">
            <Plus className="w-4 h-4" /> Добавить
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по слову, переводу, тегам..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent" />
      </div>

      {/* Letter filter */}
      <div className="flex flex-wrap gap-1 mb-4">
        <button onClick={() => setLetter("")}
          className={`text-xs px-2.5 py-1 rounded-full transition-colors ${!letter ? "bg-primary-500 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
          Все
        </button>
        {LETTERS.map(l => (
          <button key={l} onClick={() => setLetter(l)}
            className={`text-xs w-7 h-7 rounded-full transition-colors ${letter === l ? "bg-primary-500 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Tags filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {allTags.map(tag => (
            <button key={tag} onClick={() => setSearch(tag)}
              className={`text-xs px-2 py-1 rounded-full transition-colors ${search === tag ? "bg-primary-500 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
              {tag}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted">
          {words.length === 0 ? "Словарь пуст. Добавь первое слово!" : "Ничего не найдено"}
        </div>
      ) : mode === "list" ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted text-left">
                  <th className="p-2 w-8"><input type="checkbox" className="accent-primary-500"
                    checked={selected.size === filtered.length} onChange={() => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(w => w.id)))} /></th>
                  <th className="p-2">Слово</th>
                  <th className="p-2">Перевод</th>
                  <th className="p-2 hidden sm:table-cell">Транскрипция</th>
                  <th className="p-2 hidden md:table-cell">Пример</th>
                  <th className="p-2">Теги</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(w => (
                  <tr key={w.id} className="border-b border-border hover:bg-zinc-50">
                    <td className="p-2"><input type="checkbox" checked={selected.has(w.id)} className="accent-primary-500"
                      onChange={() => setSelected(prev => { const n = new Set(prev); if (n.has(w.id)) n.delete(w.id); else n.add(w.id); return n; })} /></td>
                    <td className="p-2 font-medium text-accent whitespace-nowrap">{w.word}
                      <button onClick={(e) => { e.stopPropagation(); const u = new SpeechSynthesisUtterance(w.word); u.lang = "es-ES"; u.rate = 0.8; speechSynthesis.speak(u); }}
                        className="ml-1.5 p-1 rounded hover:bg-primary-50 text-primary-400 hover:text-primary-600 transition-colors align-middle inline-flex">
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="p-2 text-accent">{w.translation}</td>
                    <td className="p-2 text-muted text-xs hidden sm:table-cell">{w.transcription || "—"}</td>
                    <td className="p-2 text-muted text-xs max-w-[200px] truncate hidden md:table-cell">{w.example_sentence || "—"}</td>
                    <td className="p-2">{w.tags.map(t => <span key={t} className="text-xs bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded mr-1">{t}</span>)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-3 mt-4">
              <span className="text-sm text-muted">Выбрано: {selected.size}</span>
              <button onClick={handleDelete} className="text-sm text-red-500 hover:text-red-700">Удалить</button>
            </div>
          )}
        </>
      ) : (
        /* Cards mode */
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4 text-sm text-muted">
            <span>{currentCardIdx + 1} из {filtered.length}</span>
            <div className="flex gap-1">
              <button onClick={() => { setCurrentCardIdx(0); setCurrentFlipped(false); }} className="text-xs text-muted hover:text-accent flex items-center gap-1">
                <Shuffle className="w-3 h-3" /> Перемешать
              </button>
            </div>
          </div>

          <div className="perspective-1000 cursor-pointer" onClick={() => setCurrentFlipped(!currentFlipped)}>
            <div className={`relative w-full h-56 sm:h-64 transition-transform duration-500 preserve-3d ${currentFlipped ? "rotate-y-180" : ""}`}>
              <div className="absolute inset-0 glass-card flex flex-col items-center justify-center p-4 sm:p-8 backface-hidden overflow-hidden">
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-accent text-center break-words leading-tight max-w-full [hyphens:auto]">{cardWord?.word}</p>
                {cardWord?.transcription && <p className="text-sm text-muted mt-2">[{cardWord.transcription}]</p>}
                {cardWord?.example_sentence && <p className="text-sm text-muted mt-4 italic text-center break-words max-w-full">{cardWord.example_sentence}</p>}
                {!cardWord?.example_sentence && <p className="text-xs text-muted mt-6">Нажми, чтобы перевернуть</p>}
              </div>
              <div className="absolute inset-0 glass-card flex flex-col items-center justify-center p-4 sm:p-8 backface-hidden rotate-y-180 overflow-hidden">
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-accent text-center break-words leading-tight max-w-full [hyphens:auto]">{cardWord?.translation}</p>
                {cardWord?.tags && cardWord.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4 justify-center">{cardWord.tags.map(t => <span key={t} className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded">{t}</span>)}</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 mt-6">
            <button onClick={() => { setCurrentCardIdx(i => Math.max(0, i - 1)); setCurrentFlipped(false); }}
              disabled={currentCardIdx === 0} className="p-2 rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 disabled:opacity-30">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button onClick={() => { setCurrentFlipped(false); setTimeout(() => setCurrentCardIdx(i => Math.min(filtered.length - 1, i + 1)), 200); }}
              disabled={currentCardIdx >= filtered.length - 1} className="p-2 rounded-full bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-30">
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full mx-4 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-accent">Новое слово</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-muted" /></button>
            </div>
            <input value={addWord} onChange={e => setAddWord(e.target.value)} placeholder="Слово на испанском"
              className="glass-input w-full px-3 py-2 rounded-lg text-sm" autoFocus />
            <input value={addTrans} onChange={e => setAddTrans(e.target.value)} placeholder="Перевод"
              className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
            <input value={addTransc} onChange={e => setAddTransc(e.target.value)} placeholder="Транскрипция (необязательно)"
              className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
            <input value={addExample} onChange={e => setAddExample(e.target.value)} placeholder="Пример предложения"
              className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
            <input value={addTags} onChange={e => setAddTags(e.target.value)} placeholder="Теги через запятую (e.g. viajar, comida)"
              className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
            <button onClick={handleAdd} disabled={!addWord.trim() || !addTrans.trim()}
              className="w-full bg-primary-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50">
              Добавить
            </button>
          </div>
        </div>
      )}

      {/* Cross-links */}
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <Link href="/tools/cards" className="card px-4 py-2.5 text-sm font-medium text-accent hover:text-primary-500 transition-colors flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-secondary-400 to-secondary-500 flex items-center justify-center text-white shrink-0"><Layers className="w-4 h-4" /></span>
          Карточки
        </Link>
        <Link href="/tools/chat" className="card px-4 py-2.5 text-sm font-medium text-accent hover:text-primary-500 transition-colors flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center text-white shrink-0"><MessageCircle className="w-4 h-4" /></span>
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
