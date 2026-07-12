"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setSent(true);
    } else {
      const data = await res.json();
      setError(data.error || "Ошибка");
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-16">
      <h1 className="text-2xl font-bold text-accent text-center mb-2">Восстановление пароля</h1>
      {sent ? (
        <div className="text-center">
          <p className="text-green-600 font-medium mt-4">Письмо отправлено на {email}</p>
          <p className="text-muted text-sm mt-2">Перейдите по ссылке в письме, чтобы сменить пароль</p>
          <Link href="/login" className="text-sm text-primary-500 mt-6 inline-block">← Вернуться ко входу</Link>
        </div>
      ) : (
        <>
          <p className="text-muted text-center text-sm mb-6">Введите email, на который зарегистрирован аккаунт</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors bg-bg" />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" className="btn-gradient w-full text-sm py-2.5">Отправить письмо</button>
          </form>
          <div className="text-center mt-4">
            <Link href="/login" className="text-sm text-muted hover:text-primary-500 transition-colors">← Назад</Link>
          </div>
        </>
      )}
    </div>
  );
}
