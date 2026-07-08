"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, Zap, RefreshCw } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#F59E0B", "#3B82F6", "#10B981"];
const LEVEL_COLORS: Record<string, string> = {
  A1: "#10B981", A2: "#34D399", B1: "#F59E0B", B2: "#F97316",
  C1: "#EF4444", C2: "#DC2626", unknown: "#9CA3AF", none: "#D1D5DB",
};

export default function AdminStatsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const res = await fetch("/api/stats?checkAccess=1");
      if (!res.ok) { router.replace("/courses"); return; }
      load();
    })();
  }, []);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) { setError("Ошибка загрузки"); setLoading(false); return; }
      const json = await res.json();
      setData(json);
    } catch {
      setError("Ошибка загрузки");
    }
    setLoading(false);
  };

  if (loading) return <div className="text-center py-16 text-muted">Загрузка...</div>;
  if (error) return <div className="text-center py-16 text-red-500">{error}</div>;

  const storagePct = data.storagePercent;
  const storageColor = storagePct > 80 ? "bg-red-500" : storagePct > 50 ? "bg-yellow-500" : "bg-primary-500";

  const roleLabels: Record<string, string> = { student: "Ученики", teacher: "Учителя", admin: "Админы" };
  const usersByRole = (data.usersByRole ?? []).map((d: any) => ({ ...d, label: roleLabels[d.role] ?? d.role }));
  const coursesByLevel = (data.coursesByLevel ?? []).map((d: any) => ({ ...d, name: d.level }));
  const studentsByLevel = (data.studentsByLevel ?? []).map((d: any) => ({ ...d, label: d.level === "none" ? "Без уровня" : d.level }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-accent">Статистика</h1>
        <button onClick={load} className="btn-ghost text-sm gap-1.5"><RefreshCw className="w-4 h-4" /> Обновить</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard title="Пользователи" value={data.users} />
        <StatCard title="Курсы" value={data.courses} />
        <StatCard title="Уроки" value={data.lessons} />
        <StatCard title="Блоков в уроках" value={data.blocks} />
        <StatCard title="Записей на курсы" value={data.enrollments} />
        <StatCard title="Ответов студентов" value={data.submissions} />
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-6">
        <DonutCard title="Пользователи по ролям" data={usersByRole} dataKey="count" nameKey="label" />
        <DonutCard title="Курсы по уровням" data={coursesByLevel} dataKey="count" nameKey="level" />
        <DonutCard title="Студенты по уровню языка" data={studentsByLevel} dataKey="count" nameKey="label" />
        <ProgressCard progressStats={data.progressStats ?? []} />
      </div>

      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-accent mb-2">Хранилище (Storage)</h2>
        <p className="text-sm text-muted mb-3">
          Использовано: <strong>{data.storagePretty}</strong> из {data.storageLimit} {data.storageLimitUnit}
          {" — "}{data.fileCount} файлов
        </p>
        <div className="w-full bg-zinc-100 rounded-full h-3">
          <div className={`h-3 rounded-full transition-all ${storageColor}`} style={{ width: `${Math.min(storagePct, 100)}%` }} />
        </div>
        {storagePct > 80 && <p className="text-sm text-red-600 font-medium mt-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Внимание! Хранилище почти заполнено.</p>}
        {storagePct > 50 && storagePct <= 80 && <p className="text-sm text-yellow-600 font-medium mt-2 flex items-center gap-1"><Zap className="w-4 h-4" /> Использовано больше половины хранилища</p>}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-accent mb-2">База данных</h2>
        {data.dbSizeBytes > 0 ? (
          <>
            <p className="text-sm text-muted mb-1">Использовано: <strong>{data.dbSizePretty}</strong> из {data.dbLimit} {data.dbLimitUnit}</p>
            <div className="w-full bg-zinc-100 rounded-full h-3">
              <div className={`h-3 rounded-full ${data.dbPercent > 80 ? "bg-red-500" : data.dbPercent > 50 ? "bg-yellow-500" : "bg-primary-500"}`}
                style={{ width: `${Math.min(data.dbPercent, 100)}%` }} />
            </div>
            {data.dbPercent > 80 && <p className="text-sm text-red-600 font-medium mt-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> База почти заполнена!</p>}
          </>
        ) : (
          <p className="text-sm text-muted">Не удалось получить размер. Добавь функцию в SQL Editor.</p>
        )}
        <p className="text-xs text-muted mt-3">
          <a href="https://supabase.com/dashboard/project/zphehhzgbudetyzezunk" target="_blank" className="font-semibold text-primary-500">Supabase Dashboard →</a>
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-muted">{title}</p>
      <p className="text-2xl font-bold text-accent">{value}</p>
    </div>
  );
}

function DonutCard({ title, data, dataKey, nameKey }: { title: string; data: any[]; dataKey: string; nameKey: string }) {
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-accent mb-4">{title}</h2>
      {data.length === 0 ? (
        <p className="text-sm text-muted text-center py-8">Нет данных</p>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={data} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
              {data.map((_: any, i: number) => (
                <Cell key={i} fill={LEVEL_COLORS[data[i].level ?? data[i].role] ?? COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function ProgressCard({ progressStats }: { progressStats: any[] }) {
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-accent mb-4">Прогресс студентов</h2>
      {progressStats.length === 0 ? (
        <p className="text-sm text-muted text-center py-8">Нет данных</p>
      ) : (
        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {progressStats.map((s: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-accent truncate flex-1">{s.student_name}</span>
              <span className="text-muted whitespace-nowrap">{s.submitted} блоков</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
