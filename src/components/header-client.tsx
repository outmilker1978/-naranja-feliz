"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, LayoutDashboard } from "lucide-react";

export function ToolsButton() {
  return (
    <button onClick={() => window.dispatchEvent(new CustomEvent("open-tools-panel"))}
      className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary-600 transition-colors px-3 py-1.5 rounded-xl hover:bg-primary-50">
      <LayoutDashboard className="w-4 h-4" /> Инструменты
    </button>
  );
}

export function BellIcon() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/notifications?countOnly=true");
        if (res.ok) {
          const data = await res.json();
          setUnread(data.unreadCount ?? 0);
        }
      } catch {}
    };
    poll();
    const id = setInterval(poll, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <Link href="/notifications" className="relative text-muted hover:text-accent transition-colors">
      <Bell className="w-5 h-5" />
      {unread > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 flex items-center justify-center bg-primary-500 text-white text-[10px] font-bold rounded-full min-w-[18px] min-h-[18px]">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
