"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export function RegisterForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="glass-card rounded-2xl p-8">
      <div className="text-center mb-8">
        <span className="text-4xl">🍊</span>
        <h1 className="text-2xl font-bold text-accent mt-2">Naranja Feliz</h1>
        <p className="text-muted text-sm">Создай аккаунт</p>
      </div>

      <form action="/api/auth/signup" method="POST" className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-accent mb-1">Имя</label>
          <input
            type="text"
            name="fullName"
            required
            autoComplete="name"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            className="w-full px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            placeholder="Твоё имя"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-accent mb-1">Email</label>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            className="w-full px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            placeholder="tu@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-accent mb-1">Пароль</label>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            className="w-full px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full bg-primary-500 text-white py-2 rounded-xl font-medium hover:bg-primary-600 transition-colors"
        >
          Зарегистрироваться
        </button>
      </form>

      <p className="text-center text-sm text-muted mt-6">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-primary-500 hover:underline font-medium">
          Войти
        </Link>
      </p>
    </div>
  );
}