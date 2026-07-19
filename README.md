# Naranja Feliz — Испанский язык с огоньком

Онлайн-школа испанского языка. Next.js 16 + Supabase + Yandex Cloud.

## Быстрый старт

```bash
npm install
cp .env.example .env.local  # заполнить ключи
npm run dev                  # http://localhost:3100
```

## Переменные окружения

См. `.env.example`. Обязательные: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`.

## Деплой

Пуш в `main` → GitHub Actions → сборка Docker → Yandex CR → новая ревизия контейнера.

Подробнее: `docs/CI_CD_PIPELINE.md`, `docs/ARCHITECTURE.md`.

## Документация

- `docs/ARCHITECTURE.md` — архитектура, инфраструктура, endpoints
- `docs/RELEASE_NOTES.md` — история изменений
- `docs/DEVELOPER_GUIDE.md` — руководство разработчика
- `docs/ADMIN_GUIDE.md` — руководство администратора
- `docs/USER_GUIDE.md` — руководство пользователя
- `AGENTS.md` — проектная база знаний (для AI-ассистентов)

## Стек

Next.js 16, React 19, TypeScript, Tailwind CSS v4, Supabase, Sharp, TipTap, Yandex Cloud.
