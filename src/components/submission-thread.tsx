"use client";

import { useEffect, useState, useRef } from "react";

interface Comment {
  id: string;
  author_id: string;
  text: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export function SubmissionThread({ submissionId }: { submissionId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef(true);

  const load = async () => {
    const res = await fetch(`/api/comments?submission_id=${submissionId}`);
    const data = await res.json();
    setComments(data.comments ?? []);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [submissionId]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    await fetch("/api/comments", {
      method: "POST",
      body: JSON.stringify({ submissionId, text: text.trim() }),
    });
    setText("");
    setSending(false);
    await load();
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  if (comments.length === 0) {
    return (
      <div className="mt-3 pt-3 border-t border-zinc-200">
        <div className="flex gap-2">
          <input
            value={text} onChange={e => setText(e.target.value)}
            placeholder="Написать сообщение..."
            className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          <button onClick={send} disabled={sending || !text.trim()}
            className="bg-primary-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-primary-600 disabled:opacity-50"
          >Отправить</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-zinc-200">
      <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
        {comments.map((c) => (
          <div key={c.id} className="flex items-start gap-2">
            {c.profiles?.avatar_url ? (
              <img src={c.profiles.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover border border-primary-200 shrink-0 mt-0.5" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center text-[10px] text-primary-500 font-bold shrink-0 mt-0.5">
                {(c.profiles?.full_name || c.profiles?.email || "?")[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-500">
                {c.profiles?.full_name || c.profiles?.email}
                <span className="ml-2 text-zinc-300">{new Date(c.created_at).toLocaleString("ru-RU")}</span>
              </p>
              <p className="text-sm text-zinc-700">{c.text}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input
          value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") send(); }}
          placeholder="Написать сообщение..."
          className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
        <button onClick={send} disabled={sending || !text.trim()}
          className="bg-primary-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-primary-600 disabled:opacity-50"
        >Отправить</button>
      </div>
    </div>
  );
}
