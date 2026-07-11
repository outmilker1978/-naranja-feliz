"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

interface Submission {
  id: string;
  student_id: string;
  answer: string;
  reviewed: boolean;
  comment: string | null;
  created_at: string;
  lesson_blocks: { id: string; lesson_id: string; type: string; content: any };
  profiles: { id: string; full_name: string; email: string };
  lesson_title: string;
  course_title: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const supabase = createClient();
  const [all, setAll] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteChat, setDeleteChat] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [filterStudentId, setFilterStudentId] = useState("");
  const [filterCourseTitle, setFilterCourseTitle] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      try {
        const res = await fetch("/api/history");
        if (!res.ok) { setError("Ошибка загрузки"); setLoading(false); return; }
        setAll(await res.json());
      } catch { setError("Ошибка загрузки"); }
      setLoading(false);
    })();
  }, []);

  const students = [...new Map(all.map(s => [s.student_id, { id: s.student_id, name: s.profiles.full_name, email: s.profiles.email }])).values()];
  const courses = [...new Map(all.map(s => [s.course_title, s.course_title])).values()];

  const filtered = all.filter(s => {
    if (filterStudentId && s.student_id !== filterStudentId) return false;
    if (filterCourseTitle && s.course_title !== filterCourseTitle) return false;
    return true;
  });

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(s => s.id)));
  };

  const handleDelete = async () => {
    setDeleting(true);
    const submissionIds = [...selected];
    const studentIds = [...new Set(filtered.filter(s => selected.has(s.id)).map(s => s.student_id))];
    const res = await fetch("/api/history", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submission_ids: submissionIds, delete_chat: deleteChat, student_ids: studentIds }),
    });
    if (!res.ok) { setError("Ошибка удаления"); setDeleting(false); return; }
    setAll(prev => prev.filter(s => !selected.has(s.id)));
    setSelected(new Set());
    setConfirmOpen(false);
    setDeleting(false);
  };

  if (loading) return <div className="text-center py-16 text-muted">Загрузка...</div>;
  if (error) return <div className="text-center py-16 text-red-500">{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-accent">История проверок</h1>
        <span className="text-xs text-muted">Всего записей: {all.length}</span>
      </div>

      <div className="card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div>
          <label className="block text-xs text-muted mb-1">Студент</label>
          <select value={filterStudentId} onChange={e => setFilterStudentId(e.target.value)}
            className="glass-input text-sm px-3 py-1.5 rounded-lg min-w-[200px]">
            <option value="">Все</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Курс</label>
          <select value={filterCourseTitle} onChange={e => setFilterCourseTitle(e.target.value)}
            className="glass-input text-sm px-3 py-1.5 rounded-lg min-w-[180px]">
            <option value="">Все</option>
            {courses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        {filtered.length !== all.length && (
          <span className="text-xs text-muted ml-2">показано {filtered.length}</span>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-16 text-muted">Нет записей</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted text-left">
                  <th className="p-2 w-8">
                    <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleAll} className="accent-primary-500" />
                  </th>
                  <th className="p-2">Студент</th>
                  <th className="p-2">Курс</th>
                  <th className="p-2">Урок</th>
                  <th className="p-2">Тип блока</th>
                  <th className="p-2">Ответ</th>
                  <th className="p-2">Статус</th>
                  <th className="p-2">Дата</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-border hover:bg-surface">
                    <td className="p-2">
                      <input type="checkbox" checked={selected.has(s.id)}
                        onChange={() => toggle(s.id)} className="accent-primary-500" />
                    </td>
                    <td className="p-2 font-medium text-accent">{s.profiles.full_name}</td>
                    <td className="p-2 text-muted">{s.course_title}</td>
                    <td className="p-2 text-muted">{s.lesson_title}</td>
                    <td className="p-2 text-muted">{s.lesson_blocks?.type ?? "—"}</td>
                    <td className="p-2 text-muted max-w-[200px] truncate">{s.answer}</td>
                    <td className="p-2">
                      {s.reviewed
                        ? <span className="text-green-600 font-medium">Проверен</span>
                        : <span className="text-yellow-600">Ожидает</span>}
                    </td>
                    <td className="p-2 text-muted text-xs">{new Date(s.created_at).toLocaleDateString("ru")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected.size > 0 && (
            <div className="flex items-center gap-4 mt-6 p-4 border border-border rounded-xl">
              <span className="text-sm text-muted">Выбрано: {selected.size}</span>
              <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                <input type="checkbox" checked={deleteChat}
                  onChange={e => setDeleteChat(e.target.checked)} className="accent-primary-500" />
                Также удалить чат с учеником
              </label>
              <button onClick={() => setConfirmOpen(true)} disabled={deleting}
                className="ml-auto text-sm bg-red-500 text-white px-4 py-1.5 rounded-xl hover:bg-red-600 disabled:opacity-50">
                {deleting ? "Удаление..." : <><Trash2 className="w-4 h-4 inline" /> Удалить</>}
              </button>
            </div>
          )}

          {confirmOpen && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
              onClick={() => !deleting && setConfirmOpen(false)}>
              <div className="card p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-accent mb-2">Удалить {selected.size} записей?</h3>
                <p className="text-sm text-muted mb-1">Это действие нельзя отменить.</p>
                {deleteChat && <p className="text-sm text-red-500">Чат с учеником тоже будет удалён.</p>}
                <div className="flex gap-3 mt-4">
                  <button onClick={handleDelete} disabled={deleting}
                    className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 text-sm disabled:opacity-50">
                    {deleting ? "Удаление..." : "Удалить"}
                  </button>
                  <button onClick={() => setConfirmOpen(false)} disabled={deleting}
                    className="btn-ghost text-sm">
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
