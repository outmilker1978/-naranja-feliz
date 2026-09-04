"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LevelControl } from "./confirm-level-button";
import { SubscriptionControl } from "./subscription-control";
import { CourseAccessControl } from "./course-access-control";
import Avatar from "@/components/avatar";

const ROLE_LABELS: Record<string, string> = {
  admin: "Админ",
  teacher: "Учитель",
  student: "Ученик",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  teacher: "bg-primary-50 text-primary-500",
  student: "bg-blue-100 text-blue-700",
};

export function AllUsersList({ profiles, currentUserId }: { profiles: any[]; currentUserId: string }) {
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusStudentId = searchParams.get("studentId");
  const focusCourseId = searchParams.get("courseId");
  const focusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusStudentId && focusRef.current) {
      focusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusStudentId]);

  const currentUser = profiles.find(p => p.id === currentUserId);
  const role = currentUser?.role;
  const hasAdmin = profiles.some(p => p.role === "admin");
  const canManageRoles = role === "admin" || (role === "teacher" && !hasAdmin);

  const filtered = search.trim()
    ? profiles.filter(p =>
        (p.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (p.email ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : profiles;

  const setRole = async (email: string, newRole: string) => {
    setMessage("");
    setLoadingId(`set-${email}`);
    const res = await fetch("/api/assign-teacher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newRole }),
    });
    const data = await res.json();
    if (res.ok) setMessage(`Пользователь теперь ${ROLE_LABELS[data.role || newRole]}`);
    else setMessage("Ошибка: " + (data.error || "неизвестная"));
    setLoadingId(null);
    router.refresh();
  };

  const demoteUser = async (userId: string) => {
    setMessage("");
    setLoadingId(userId);
    const res = await fetch("/api/demote-teacher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (res.ok) setMessage("Пользователь переведён в ученики");
    else setMessage("Ошибка: " + (data.error || "неизвестная"));
    setLoadingId(null);
    router.refresh();
  };

  const setDirector = async (userId: string, isDirector: boolean) => {
    setMessage("");
    setLoadingId(`dir-${userId}`);
    const res = await fetch("/api/set-director", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isDirector }),
    });
    const data = await res.json();
    if (res.ok) setMessage(isDirector ? "Директор школы назначен" : "Директор снят");
    else setMessage("Ошибка: " + (data.error || "неизвестная"));
    setLoadingId(null);
    router.refresh();
  };

  const canManage = (profile: any) => {
    if (!canManageRoles) return false;
    if (profile.id === currentUserId && role === "admin") return false;
    if (profile.id === currentUserId && hasAdmin) return false;
    return true;
  };

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Поиск по имени или email..."
        className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 transition-all mb-4"
      />

      {message && (
        <p className={`text-sm mb-3 ${message.startsWith("Ошибка") ? "text-red-600" : "text-green-600"}`}>{message}</p>
      )}

      <div className="space-y-2">
        {filtered.map((profile) => (
          <div key={profile.id} ref={profile.id === focusStudentId ? focusRef : undefined} className={`card px-4 py-3 ${profile.id === focusStudentId ? "ring-2 ring-primary-400 bg-primary-50/50" : ""}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <Avatar src={profile.avatar_url} name={profile.full_name || profile.email} size={36} />
                  {profile.last_seen && (Date.now() - new Date(profile.last_seen).getTime()) < 120000 && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-green-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-accent truncate">
                    {profile.full_name || "Без имени"}
                    {profile.id === currentUserId && <span className="text-xs text-muted ml-1">(это вы)</span>}
                    {profile.is_director && <span className="text-xs text-amber-600 ml-1.5">👑 директор</span>}
                  </p>
                  <p className="text-xs text-muted truncate">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[profile.role] ?? "bg-zinc-100 text-zinc-500"}`}>
                  {ROLE_LABELS[profile.role] ?? profile.role}
                </span>
                {profile.role === "admin" && canManage(profile) && (
                  <button onClick={() => demoteUser(profile.id)} disabled={loadingId === profile.id}
                    className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50">
                    {loadingId === profile.id ? "..." : "Сделать учеником"}
                  </button>
                )}
                {profile.role === "teacher" && canManage(profile) && (
                  <>
                    <button onClick={() => setRole(profile.email, "admin")} disabled={loadingId === `set-${profile.email}`}
                      className="text-xs text-purple-500 hover:text-purple-700 hover:underline disabled:opacity-50">
                      {loadingId === `set-${profile.email}` ? "..." : "Сделать админом"}
                    </button>
                    {profile.id !== currentUserId && (
                      <button onClick={() => demoteUser(profile.id)} disabled={loadingId === profile.id}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50">
                        {loadingId === profile.id ? "..." : "Сделать учеником"}
                      </button>
                    )}
                  </>
                )}
                {profile.role === "teacher" && role === "admin" && (
                  <button onClick={() => setDirector(profile.id, !profile.is_director)} disabled={loadingId === `dir-${profile.id}`}
                    className={`text-xs hover:underline disabled:opacity-50 ${profile.is_director ? "text-amber-600 hover:text-amber-700" : "text-zinc-500 hover:text-zinc-700"}`}>
                    {loadingId === `dir-${profile.id}` ? "..." : profile.is_director ? "Снять с директора" : "Сделать директором"}
                  </button>
                )}
                {profile.role === "student" && canManage(profile) && (
                  <button onClick={() => setRole(profile.email, "teacher")} disabled={loadingId === `set-${profile.email}`}
                    className="text-xs text-primary-500 hover:text-primary-700 hover:underline disabled:opacity-50">
                    {loadingId === `set-${profile.email}` ? "..." : "Назначить учителем"}
                  </button>
                )}
              </div>
            </div>
            {profile.role !== "teacher" && profile.role !== "admin" && (
              <div className="mt-3 pt-3 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted mb-1">Уровень</p>
                  <LevelControl userId={profile.id} currentLevel={profile.language_level} confirmed={!!profile.language_level_confirmed_by} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted mb-1">Подписка</p>
                  <SubscriptionControl userId={profile.id} subscriptionUntil={profile.subscription_until} requestedAt={profile.subscription_requested_at} creditDays={profile.credit_days ?? 0} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted mb-1">Доступ к курсам</p>
                  <CourseAccessControl userId={profile.id} focusStudentId={profile.id === focusStudentId ? focusStudentId : null} focusCourseId={profile.id === focusStudentId ? focusCourseId : null} />
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center py-8 text-muted">Ничего не найдено</p>
        )}
      </div>
    </div>
  );
}