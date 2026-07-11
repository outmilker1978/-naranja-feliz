"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { X, Pin, PinOff, GraduationCap, Users, ClipboardCheck, BarChart3, History, FileText, MessageCircle, Bell, Settings, BookOpen, LayoutGrid, LayoutDashboard } from "lucide-react";

interface ToolItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  adminOnly?: boolean;
}

export default function ToolsPanel() {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const fetchRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      const mRole = user.user_metadata?.role;
      setRole(p?.role || mRole || "student");
    } else {
      setRole(null);
    }
    setReady(true);
  };

  useEffect(() => { fetchRole(); }, []);

  useEffect(() => {
    const onFocus = () => fetchRole();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    if (!pinned) setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-tools-panel", handler);
    return () => window.removeEventListener("open-tools-panel", handler);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--tools-panel-width", pinned ? "280px" : "0px");
    document.body.style.paddingRight = pinned ? "280px" : "";
    return () => { document.documentElement.style.removeProperty("--tools-panel-width"); document.body.style.paddingRight = ""; };
  }, [pinned]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!pinned && open && panelRef.current && !panelRef.current.contains(e.target as Node)
        && !(e.target as Element)?.closest("[data-tools-trigger]")) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, pinned]);

  const isTeacher = role === "teacher" || role === "admin";

  const allTools: ToolItem[] = [
    { icon: <GraduationCap className="w-4 h-4" />, label: "Курсы", href: "/courses" },
    { icon: <BookOpen className="w-4 h-4" />, label: "Словарь", href: "/tools/vocabulary" },
    { icon: <LayoutGrid className="w-4 h-4" />, label: "Карточки", href: "/tools/cards" },
    { icon: <FileText className="w-4 h-4" />, label: "Контент портала", href: "/admin/content", adminOnly: true },
    { icon: <Users className="w-4 h-4" />, label: "Учительская", href: "/admin/teachers", adminOnly: true },
    { icon: <ClipboardCheck className="w-4 h-4" />, label: "Проверка", href: "/admin/submissions", adminOnly: true },
    { icon: <Bell className="w-4 h-4" />, label: "Уведомления", href: "/notifications" },
    { icon: <MessageCircle className="w-4 h-4" />, label: "Чат", href: "/tools/chat" },
    { icon: <BarChart3 className="w-4 h-4" />, label: "Статистика", href: "/admin/stats", adminOnly: true },
    { icon: <History className="w-4 h-4" />, label: "История", href: "/admin/history", adminOnly: true },
    { icon: <Settings className="w-4 h-4" />, label: "Настройки", href: "/settings" },
    ...(!role ? [{ icon: <GraduationCap className="w-4 h-4" />, label: "Войти", href: "/login" }] : []),
  ];

  const tools = role ? allTools.filter(t => isTeacher || !t.adminOnly) : allTools.filter(t => t.label === "Войти" || t.label === "Курсы");

  return (
    <>
      <button data-tools-trigger onClick={() => setOpen(true)}
        className="fixed max-md:bottom-4 md:top-36 z-30 w-11 h-11 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-600 transition-all hover:scale-105 active:scale-95"
        style={{ right: "calc(1rem + var(--tools-panel-width, 0px))", bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
        title={ready ? "Инструменты" : "Загрузка..."}
      >
        <LayoutDashboard className="w-5 h-5" />
      </button>

      {open && !pinned && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setOpen(false)} />
      )}

      <div ref={panelRef}
        className={`fixed top-0 right-0 h-full z-50 bg-white shadow-2xl transform transition-transform duration-300 flex flex-col
          ${open || pinned ? "translate-x-0" : "translate-x-full"} w-72`}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-primary-500" />
            <span className="font-semibold text-accent text-sm">Инструменты</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPinned(!pinned)}
              className={`max-md:hidden p-1.5 rounded-md transition-colors ${pinned ? "text-primary-500 bg-primary-50" : "text-zinc-400 hover:text-zinc-600"}`}
              title={pinned ? "Открепить" : "Закрепить"}>
              {pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </button>
            <button onClick={() => { setOpen(false); if (pinned) setPinned(false); }}
              className="text-zinc-400 hover:text-zinc-600 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-3 space-y-1 overflow-y-auto flex-1">
          {!ready && <p className="text-xs text-zinc-400 text-center py-4">Загрузка...</p>}
          {tools.map((tool, i) => (
            <button key={i} onClick={() => { router.push(tool.href); if (!pinned) setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-700 hover:bg-primary-50 hover:text-primary-700 transition-colors text-left"
            >
              <span className="text-primary-500 shrink-0">{tool.icon}</span>
              <span className="truncate">{tool.label}</span>
            </button>
          ))}
        </div>

        {pinned && (
          <div className="p-3 border-t border-zinc-100 shrink-0">
            <button onClick={() => { setPinned(false); setOpen(false); }}
              className="w-full text-xs text-zinc-400 hover:text-zinc-600 text-center py-1">
              Скрыть панель
            </button>
          </div>
        )}
      </div>
    </>
  );
}
