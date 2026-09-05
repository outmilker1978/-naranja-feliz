// Клиентские обёртки над BFF-API урока. Ни один компонент урока больше
// не обращается к Supabase напрямую (иначе — connection-reset/hang на
// нестабильных сетях). Запросы с таймаутом: сбой = пропустить цикл/ошибка UI,
// но страница никогда не висит бесконечно.

const TIMEOUT_MS = 20_000;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export type LessonStatus = {
  hasProgressRow: boolean;
  completed: boolean;
  allDone: boolean;
};

export function getLessonStatus(lessonId: string): Promise<LessonStatus> {
  return fetchJson<LessonStatus>(`/api/lesson/status?lessonId=${encodeURIComponent(lessonId)}`);
}

export async function setLessonProgress(lessonId: string, completed: boolean): Promise<void> {
  await fetchJson("/api/lesson/progress", {
    method: "POST",
    body: JSON.stringify({ lessonId, completed }),
  });
}

export async function clearLessonAnswers(lessonId: string, studentId: string): Promise<void> {
  await fetchJson("/api/lesson/clear-answers", {
    method: "POST",
    body: JSON.stringify({ lessonId, studentId }),
  });
}