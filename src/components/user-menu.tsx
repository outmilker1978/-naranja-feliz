"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings, LogOut, ChevronDown } from "lucide-react";

interface Props {
  userName: string | null;
  userEmail: string;
  realRole: string;
  avatarUrl: string | null;
}

export function UserMenu({ userName, userEmail, realRole, avatarUrl }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const [imgError, setImgError] = useState(false);
  const initial = (userName || userEmail)[0].toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 focus:outline-none"
      >
        {avatarUrl && !imgError ? (
          <img src={avatarUrl} alt="" loading="lazy" onError={() => setImgError(true)} className="w-9 h-9 rounded-full object-cover border-2 border-primary-200 shadow-sm" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center text-sm text-white font-bold shadow-sm">
            {initial}
          </div>
        )}
        <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white/95 backdrop-blur-xl border border-black/10 rounded-2xl shadow-lg py-2 z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-bold text-accent">{userName || "Пользователь"}</p>
            <p className="text-xs text-muted">{userEmail}</p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${realRole === "admin" ? "badge badge-orange" : realRole === "teacher" ? "badge badge-orange" : "badge badge-green"}`}>
              {realRole === "admin" ? "Админ" : realRole === "teacher" ? "Учитель" : "Ученик"}
            </span>
          </div>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-muted hover:bg-primary-50 hover:text-accent transition-colors"
          >
            <Settings className="w-4 h-4 text-muted" />
            Настройки
          </Link>
          <div className="border-t border-border mt-1 pt-1">
            <form action="/api/auth/logout" method="POST">
              <button type="submit"
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
