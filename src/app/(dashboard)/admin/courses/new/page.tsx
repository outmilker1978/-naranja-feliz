"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewCoursePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("A1");
  const [accessMode, setAccessMode] = useState("public");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const res = await fetch("/api/stats?checkAccess=1");
      if (!res.ok) { router.replace("/courses"); return; }
      setChecking(false);
    })();
  }, []);

  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

  if (checking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("courses")
      .insert({ title, description, level, access_mode: accessMode, created_by: user.id })
      .select()
      .single();

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    router.push(`/admin/courses/${data.id}`);
    router.refresh();
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-accent mb-6">Новый курс</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-accent mb-1">Название</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
            placeholder="Испанский для начинающих"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-accent mb-1">Описание</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
            placeholder="Краткое описание курса"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-accent mb-1">Уровень</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            {levels.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-accent mb-1">Доступ</label>
          <select
            value={accessMode}
            onChange={(e) => setAccessMode(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="public">Публичный (без подписки)</option>
            <option value="per_course">По запросу (учитель выдаёт доступ)</option>
            <option value="subscription">По подписке</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-gradient px-6 py-2"
        >
          {loading ? "Создание..." : "Создать курс"}
        </button>
      </form>
    </div>
  );
}
