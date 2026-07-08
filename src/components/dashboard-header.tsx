"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, Bell, MessageCircle, Settings, LogOut, ChevronDown, Wrench } from "lucide-react";

function getLevelLabel(count: number): string {
  if (count === 0) return "— Новичок";
  if (count <= 3) return "— Начинающий";
  if (count <= 6) return "— Ученик";
  if (count <= 10) return "— Знаток";
  if (count <= 20) return "— Мастер";
  return "— Профессор";
}

export function DashboardHeader({
  userName,
  userEmail,
  realRole,
  avatarUrl,
  completedLessons = 0,
  unreadNotifications: initialUnread = 0,
  pendingReviews = 0,
  subscriptionUntil = null,
}: {
  userName: string | null;
  userEmail: string;
  realRole: string;
  avatarUrl: string | null;
  completedLessons?: number;
  unreadNotifications?: number;
  pendingReviews?: number;
  subscriptionUntil?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [viewRole, setViewRole] = useState(realRole);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [liveUnread, setLiveUnread] = useState(initialUnread);
  const [chatUnread, setChatUnread] = useState(0);

  useEffect(() => {
    setLiveUnread(initialUnread);
  }, [initialUnread]);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/notifications?countOnly=true");
        if (res.ok) {
          const data = await res.json();
          setLiveUnread(data.unreadCount ?? 0);
        }
      } catch {}
    };
    const id = setInterval(poll, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/chat/unread-count");
        if (res.ok) {
          const data = await res.json();
          setChatUnread(data.unreadCount ?? 0);
        }
      } catch {}
    };
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  // Online heartbeat
  useEffect(() => {
    const ping = () => fetch("/api/ping").catch(() => {});
    ping();
    const id = setInterval(ping, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("view_role");
    if (saved === "student" || saved === "teacher") {
      setViewRole(saved);
    }
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const switchTo = (role: string) => {
    localStorage.setItem("view_role", role);
    document.cookie = `view_role=${role}; path=/; max-age=86400`;
    setViewRole(role);
    if (role === "student") {
      router.push("/courses");
    } else {
      router.refresh();
    }
  };

  const initial = (userName || userEmail)[0].toUpperCase();
  const levelLabel = getLevelLabel(completedLessons);

  const isSubActive = subscriptionUntil && new Date(subscriptionUntil) > new Date();
  const daysLeft = isSubActive ? Math.ceil((new Date(subscriptionUntil).getTime() - Date.now()) / (86400000)) : 0;

  const linkClass = (href: string) =>
    `text-sm font-medium transition-all duration-200 ${
      pathname === href || pathname.startsWith(href + "/")
        ? "text-primary-500 font-semibold"
        : "text-muted hover:text-accent"
    }`;

  const mobileLinkClass = (href: string) =>
    `block px-4 py-3 text-sm font-medium transition-all duration-200 rounded-xl ${
      pathname === href || pathname.startsWith(href + "/")
        ? "text-primary-500 font-semibold bg-primary-50"
        : "text-muted hover:text-accent hover:bg-primary-50"
    }`;

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6 py-3">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <span className="text-2xl">🍊</span>
            <span className="font-bold text-primary-500 text-lg">Naranja Feliz</span>
          </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/courses" className={linkClass("/courses")}>Мои курсы</Link>
          <Link href="/tools/vocabulary" className={linkClass("/tools/vocabulary")}>Словарь</Link>
          <button onClick={() => window.dispatchEvent(new CustomEvent("open-tools-panel"))}
            className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary-600 transition-colors px-3 py-1.5 rounded-xl hover:bg-primary-50">
            <Wrench className="w-4 h-4" /> Инструменты
          </button>
          {(realRole === "teacher" || realRole === "admin") && viewRole === "teacher" && (
            <Link href="/admin/submissions" className={linkClass("/admin/submissions")}>
              Проверка
              {pendingReviews > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-primary-500 rounded-full">
                  {pendingReviews > 9 ? "9+" : pendingReviews}
                </span>
              )}
            </Link>
          )}
          <Link
            href="/tools/chat"
            className={`relative flex items-center gap-1 transition-all duration-200 ${linkClass("/tools/chat")}`}
          >
            <MessageCircle className="w-4 h-4" />
            Чат
            {chatUnread > 0 && (
              <span className="absolute -top-1.5 -right-3 w-4.5 h-4.5 flex items-center justify-center bg-primary-500 text-white text-[10px] font-bold rounded-full min-w-[18px] min-h-[18px]">
                {chatUnread > 9 ? "9+" : chatUnread}
              </span>
            )}
          </Link>
          {(realRole === "teacher" || realRole === "admin") && (
            <div className="flex items-center gap-1 text-xs border border-primary-200 rounded-full p-0.5">
              <button
                onClick={() => switchTo("teacher")}
                className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                  viewRole === "teacher" ? "bg-primary-500 text-white shadow-sm" : "text-muted hover:text-accent"
                }`}
              >Учитель</button>
              <button
                onClick={() => switchTo("student")}
                className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                  viewRole === "student" ? "bg-primary-500 text-white shadow-sm" : "text-muted hover:text-accent"
                }`}
              >Ученик</button>
            </div>
          )}
          <Link
            href="/notifications"
            className={`relative flex items-center transition-colors ${
              pathname === "/notifications" ? "text-primary-500" : "text-zinc-500 hover:text-secondary"
            }`}
          >
            <Bell className="w-5 h-5" />
            {liveUnread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 flex items-center justify-center bg-primary-500 text-white text-[10px] font-bold rounded-full min-w-[18px] min-h-[18px]">
                {liveUnread > 9 ? "9+" : liveUnread}
              </span>
            )}
          </Link>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 focus:outline-none"
            >
              {realRole !== "teacher" && realRole !== "admin" && isSubActive && (
                <Link href="/settings" onClick={e => e.stopPropagation()}
                  className={`text-xs font-semibold leading-none transition-colors ${daysLeft <= 0 ? "text-muted" : daysLeft <= 3 ? "text-primary-500" : "text-secondary-600"}`}>
                  <span className="hidden sm:inline">{daysLeft} </span>
                  <span className="hidden sm:inline">{daysLeft === 1 ? "день" : daysLeft < 5 ? "дня" : "дней"}</span>
                </Link>
              )}
              <div className="relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-primary-200 shadow-sm" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center text-sm text-white font-bold shadow-sm">
                    {initial}
                  </div>
                )}
                {realRole !== "teacher" && realRole !== "admin" && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-secondary-500" />
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white/95 backdrop-blur-xl border border-black/10 rounded-2xl shadow-lg py-2 z-50">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-bold text-accent">{userName || "Пользователь"}</p>
                  <p className="text-xs text-muted">{userEmail}</p>
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${realRole === "teacher" || realRole === "admin" ? "badge badge-orange" : "badge badge-green"}`}>
                    {realRole === "admin" ? "Админ" : realRole === "teacher" ? "Учитель" : "Ученик"}
                  </span>
                  <div className="mt-1 text-xs font-semibold text-primary-500">
                    🍊 {completedLessons} {levelLabel}
                  </div>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-muted hover:bg-primary-50 hover:text-accent transition-colors"
                >
                  <Settings className="w-4 h-4 text-muted" />
                  Настройки
                </Link>
                <div className="border-t border-border mt-1 pt-1">
                  <form action="/api/auth/logout" method="POST">
                    <button
                      type="submit"
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
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-zinc-600 hover:text-primary-500 transition-colors"
          aria-label="Меню"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-primary-200 bg-surface px-4 pb-4">
          <nav className="flex flex-col gap-1 pt-2">
            <Link href="/courses" className={mobileLinkClass("/courses")}>Мои курсы</Link>
            <Link href="/tools/vocabulary" className={mobileLinkClass("/tools/vocabulary")}>Словарь</Link>
            <Link href="/tools/chat" className={`flex items-center gap-2 ${mobileLinkClass("/tools/chat")}`}>
              <MessageCircle className="w-4 h-4" />
              Чат
              {chatUnread > 0 && (
                <span className="ml-auto w-5 h-5 flex items-center justify-center bg-primary-500 text-white text-[10px] font-bold rounded-full">
                  {chatUnread > 9 ? "9+" : chatUnread}
                </span>
              )}
            </Link>
            <Link href="/notifications" className={`flex items-center gap-2 ${mobileLinkClass("/notifications")}`}>
              <Bell className="w-4 h-4" />
              Уведомления
              {liveUnread > 0 && (
                <span className="ml-auto w-5 h-5 flex items-center justify-center bg-primary-500 text-white text-[10px] font-bold rounded-full">
                  {liveUnread > 9 ? "9+" : liveUnread}
                </span>
              )}
            </Link>
          {(realRole === "teacher" || realRole === "admin") && viewRole === "teacher" && (
              <>
                <button onClick={() => { setMobileOpen(false); window.dispatchEvent(new CustomEvent("open-tools-panel")); }}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-zinc-700 hover:bg-primary-50 transition-colors rounded-lg">
                  <Wrench className="w-4 h-4 text-primary-500" />
                  Все инструменты
                </button>
                <Link href="/admin/submissions" className={mobileLinkClass("/admin/submissions")}>Проверка</Link>
              </>
            )}
            {(realRole === "teacher" || realRole === "admin") && (
              <div className="flex items-center gap-2 mt-2 px-4">
                <span className="text-xs text-muted">Режим:</span>
                <button
                  onClick={() => switchTo("teacher")}
                  className={`px-3 py-1 text-xs rounded-full font-semibold transition-colors ${
                    viewRole === "teacher" ? "bg-primary-500 text-white" : "bg-primary-100 text-muted"
                  }`}
                >Учитель</button>
                <button
                  onClick={() => switchTo("student")}
                  className={`px-3 py-1 text-xs rounded-full font-semibold transition-colors ${
                    viewRole === "student" ? "bg-primary-500 text-white" : "bg-primary-100 text-muted"
                  }`}
                >Ученик</button>
              </div>
            )}
            <div className="border-t border-border mt-2 pt-2">
              <Link href="/settings" className={`flex items-center gap-2 ${mobileLinkClass("/settings")}`}>
                <Settings className="w-4 h-4" />
                Настройки
              </Link>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  Выйти
                </button>
              </form>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
