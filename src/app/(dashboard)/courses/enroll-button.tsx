"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EnrollButton({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [showRequest, setShowRequest] = useState(false);
  const [requestDone, setRequestDone] = useState(false);
  const router = useRouter();

  const handleEnroll = async () => {
    setLoading(true);
    setError("");
    setShowRequest(false);
    const res = await fetch("/api/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });

    const data = await res.json();
    if (res.status === 403) {
      setError(data.error || "Доступ ограничен");
      setShowRequest(true);
      setLoading(false);
      return;
    }
    if (!res.ok && data.error) {
      setError(data.error);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
    router.refresh();
  };

  const handleRequest = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/course-access/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    if (res.ok) {
      setRequestDone(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Ошибка при запросе");
    }
    setLoading(false);
  };

  if (done) return <span className="mt-4 inline-block text-sm text-green-600 font-medium">✓ Вы записаны</span>;
  if (requestDone) return <span className="mt-4 inline-block text-sm text-green-600 font-medium">✓ Запрос отправлен учителю</span>;

  return (
    <div>
      <button
        onClick={showRequest ? handleRequest : handleEnroll}
        disabled={loading}
        className="mt-4 btn-gradient px-4 py-2 text-sm font-medium disabled:opacity-50 transition-all duration-200"
      >
        {loading ? "..." : showRequest ? "Запросить доступ у учителя" : "Записаться"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}