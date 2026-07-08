"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EnrollButton({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  const handleEnroll = async () => {
    setLoading(true);
    const res = await fetch("/api/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });

    const data = await res.json();
    if (!res.ok && data.error) {
      alert("Ошибка: " + data.error);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
    router.refresh();
  };

  if (done) return <span className="mt-4 inline-block text-sm text-green-600 font-medium">✓ Вы записаны</span>;

  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      className="mt-4 btn-gradient px-4 py-2 text-sm font-medium disabled:opacity-50 transition-all duration-200"
    >
      {loading ? "..." : "Записаться"}
    </button>
  );
}
