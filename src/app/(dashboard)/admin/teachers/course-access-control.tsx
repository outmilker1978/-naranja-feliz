"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Course {
  id: string;
  title: string;
  level: string;
}

interface Grant {
  course_id: string;
  granted_at: string;
  expires_at: string | null;
  reason: string;
  courses: { title: string };
}

export function CourseAccessControl({ userId, focusStudentId, focusCourseId }: { userId: string; focusStudentId?: string | null; focusCourseId?: string | null }) {
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [duration, setDuration] = useState("30");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dismissed = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (focusStudentId && focusCourseId && !dismissed.current) {
      setOpen(true);
      dismissed.current = false;
    }
  }, [focusStudentId, focusCourseId]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/courses").then(r => r.json()).then(data => {
      const list = Array.isArray(data) ? data : data.courses ?? [];
      setCourses(list);
      if (focusCourseId) {
        setSelected(new Set([focusCourseId]));
      }
    }).catch(() => setError("Не удалось загрузить курсы"));
    loadGrants();
  }, [open, userId, focusCourseId]);

  const loadGrants = () => {
    fetch(`/api/course-access/student-courses?studentId=${userId}`).then(r => r.json()).then(data => {
      if (Array.isArray(data)) setGrants(data);
    }).catch(() => {});
  };

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const close = () => {
    dismissed.current = true;
    setOpen(false);
  };

  const grant = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/course-access/grant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: userId, courseIds: Array.from(selected), duration }),
    });
    if (res.ok) {
      close();
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Ошибка");
    }
    setSaving(false);
  };

  const revoke = async (courseId: string) => {
    setError("");
    const res = await fetch("/api/course-access/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: userId, courseIds: [courseId] }),
    });
    if (res.ok) {
      loadGrants();
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Ошибка при отзыве");
    }
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div>
      <button onClick={() => setOpen(true)}
        className="text-[11px] text-primary-500 hover:underline">
        Доступ к курсам
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={close}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-accent">Выдать доступ к курсам</h3>
              <button onClick={close} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none p-1">&times;</button>
            </div>

            {grants.length > 0 && (
              <div className="mb-4 shrink-0">
                <p className="text-xs font-medium text-muted mb-2">Уже выдано:</p>
                <div className="space-y-1">
                  {grants.map(g => (
                    <div key={g.course_id} className={`flex items-center justify-between text-xs px-2 py-1 rounded ${isExpired(g.expires_at) ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
                      <span className="truncate mr-2">{g.courses?.title || g.course_id}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span>{g.expires_at ? `до ${formatDate(g.expires_at)}` : "навсегда"}</span>
                        <button onClick={() => revoke(g.course_id)}
                          className="text-red-500 hover:text-red-700 hover:underline font-medium">Отозвать</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {courses.length === 0 ? (
              <p className="text-sm text-muted py-4">Загрузка курсов...</p>
            ) : (
              <div className="space-y-1 mb-4 max-h-60 overflow-y-auto min-h-[100px]">
                {courses.map(c => (
                  <label key={c.id} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer">
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)}
                      className="w-4 h-4 rounded border-zinc-300 text-primary-500 focus:ring-primary-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-accent">{c.title}</span>
                      <span className="text-xs text-muted ml-2">{c.level}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="mb-4 shrink-0">
              <label className="text-sm font-medium text-accent block mb-1">Срок доступа</label>
              <select value={duration} onChange={e => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50">
                <option value="14">14 дней</option>
                <option value="30">1 месяц</option>
                <option value="90">3 месяца</option>
                <option value="180">6 месяцев</option>
                <option value="365">1 год</option>
                <option value="forever">Навсегда</option>
              </select>
            </div>
            {error && <p className="text-sm text-red-600 mb-3 shrink-0">{error}</p>}
            <div className="flex gap-3 shrink-0">
              <button onClick={close}
                className="flex-1 px-4 py-2 text-sm rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-50">Отмена</button>
              <button onClick={grant} disabled={saving || selected.size === 0}
                className="flex-1 px-4 py-2 text-sm rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50">
                {saving ? "..." : `Выдать доступ (${selected.size})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}