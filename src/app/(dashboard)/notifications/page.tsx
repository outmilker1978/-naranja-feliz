"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setNotifications(data.notifications ?? []);
    setUnreadCount(data.unreadCount ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PUT",
      body: JSON.stringify({ id, read: true }),
    });
    load();
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PUT",
      body: JSON.stringify({ read: true }),
    });
    load();
  };

  if (loading) return <div className="text-center py-16 text-muted">Загрузка...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-accent">Уведомления</h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm font-semibold text-primary-500">
            Прочитать все
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="mb-2"><Bell className="w-10 h-10 text-muted mx-auto" /></p>
          <p>Нет уведомлений</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => {
            const actor = n.actor as { id: string; full_name: string | null; avatar_url: string | null } | null;
            const initial = (actor?.full_name || "?")[0].toUpperCase();
            return (
              <Link
                key={n.id}
                href={n.link || "#"}
                onClick={() => { if (!n.read) markRead(n.id); }}
                className={`block card p-4 transition-all duration-200 ${
                  n.read ? "border-border bg-surface" : "border-primary-200 bg-primary-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {actor ? (
                    actor.avatar_url ? (
                      <img src={actor.avatar_url} alt="" loading="lazy" className="w-9 h-9 rounded-full object-cover border border-border shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center text-sm text-primary-500 font-bold shrink-0">
                        {initial}
                      </div>
                    )
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-sm text-muted shrink-0">?</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm ${n.read ? "text-muted" : "text-accent font-medium"}`}>
                          {n.title}
                        </p>
                        {n.body && <p className="text-xs text-muted mt-1">{n.body}</p>}
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-2" />}
                    </div>
                    <p className="text-xs text-muted mt-2">
                      {new Date(n.created_at).toLocaleString("ru-RU")}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
