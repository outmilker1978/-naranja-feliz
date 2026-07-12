"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Минимум 6 символов"); return; }
    if (password !== confirm) { setError("Пароли не совпадают"); return; }

    const res = await fetch("/api/auth/update-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push("/courses"), 2000);
    } else {
      const data = await res.json();
      setError(data.error || "Ошибка");
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-16">
      <h1 className="text-2xl font-bold text-accent text-center mb-2">Новый пароль</h1>
      {done ? (
        <div className="text-center">
          <p className="text-green-600 font-medium mt-4">Пароль изменён!</p>
          <p className="text-muted text-sm mt-2">Сейчас перенаправим в аккаунт...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Новый пароль" minLength={6}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors bg-bg" />
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Подтвердите пароль" minLength={6}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors bg-bg" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="btn-gradient w-full text-sm py-2.5">Сохранить пароль</button>
        </form>
      )}
      <div className="text-center mt-4">
        <Link href="/login" className="text-sm text-muted hover:text-primary-500 transition-colors">← На страницу входа</Link>
      </div>
    </div>
  );
}
