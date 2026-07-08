"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export function SettingsForm({ userId, email, fullName: initialFullName, avatarUrl: initialAvatarUrl, role, languageLevel: initialLevel, languageLevelConfirmedBy, subscriptionUntil: initialSubscriptionUntil, subscriptionRequestedAt: initialSubscriptionRequestedAt }: { userId: string; email: string; fullName: string; avatarUrl: string | null; role: string; languageLevel: string | null; languageLevelConfirmedBy: string | null; subscriptionUntil: string | null; subscriptionRequestedAt: string | null }) {
  const [fullName, setFullName] = useState(initialFullName);
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [languageLevel, setLanguageLevel] = useState(initialLevel ?? "");
  const [savingLevel, setSavingLevel] = useState(false);
  const [levelSaved, setLevelSaved] = useState(false);

  const [subscriptionUntil, setSubscriptionUntil] = useState<string | null>(initialSubscriptionUntil);
  const [subscriptionRequestedAt, setSubscriptionRequestedAt] = useState<string | null>(initialSubscriptionRequestedAt);
  const [requestingExtend, setRequestingExtend] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const saveName = async () => {
    if (!fullName.trim()) return;
    setSavingName(true);
    await fetch("/api/fix-name", {
      method: "POST",
      body: JSON.stringify({ fullName: fullName.trim() }),
    });
    setSavingName(false);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
    router.refresh();
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `avatar-${userId}-${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("lesson-files").upload(fileName, file);
    if (error) { alert("Ошибка загрузки: " + error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("lesson-files").getPublicUrl(fileName);
    setAvatarUrl(publicUrl);
    await supabase.from("profiles").upsert({ id: userId, avatar_url: publicUrl }, { onConflict: "id" });
    await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
    setUploading(false);
    router.refresh();
  };

  const changePassword = async () => {
    if (!oldPassword || !newPassword) { setPasswordError("Заполни оба поля"); return; }
    if (newPassword.length < 6) { setPasswordError("Новый пароль минимум 6 символов"); return; }
    setChangingPassword(true);
    setPasswordError("");
    setPasswordSuccess(false);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) { setPasswordError(error.message); return; }
    setPasswordSuccess(true);
    setOldPassword("");
    setNewPassword("");
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  const saveLevel = async () => {
    if (!languageLevel) return;
    setSavingLevel(true);
    await fetch("/api/save-language-level", {
      method: "POST",
      body: JSON.stringify({ level: languageLevel }),
    });
    setSavingLevel(false);
    setLevelSaved(true);
    setTimeout(() => setLevelSaved(false), 3000);
    router.refresh();
  };

  const requestExtend = async () => {
    setRequestingExtend(true);
    const res = await fetch("/api/subscription/request-extend", { method: "POST" });
    if (res.ok) setSubscriptionRequestedAt(new Date().toISOString());
    setRequestingExtend(false);
  };

  const isConfirmed = !!languageLevelConfirmedBy;
  const levelLabel = languageLevel || "Не выбран";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Avatar */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-accent mb-4">Аватар</h2>
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-border" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center text-2xl text-primary-500 font-bold">
              {(fullName || email)[0].toUpperCase()}
            </div>
          )}
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-gradient px-4 py-2 text-sm disabled:opacity-50">
              {uploading ? "Загрузка..." : "Загрузить фото"}
            </button>
            {avatarUrl && (
              <button onClick={async () => { await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId); await supabase.auth.updateUser({ data: { avatar_url: null } }); setAvatarUrl(""); router.refresh(); }} className="ml-2 text-sm text-red-500 hover:underline">
                Удалить
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full Name */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-accent mb-4">Имя</h2>
        <div className="flex flex-col gap-2">
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Твоё имя" className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 transition-all" />
          <div className="flex items-center gap-2">
            <button onClick={saveName} disabled={savingName} className="btn-gradient px-4 py-2 text-sm disabled:opacity-50">{savingName ? "..." : "Сохранить"}</button>
            {nameSaved && <span className="text-sm text-green-600 font-medium">✓</span>}
          </div>
        </div>
      </div>

      {/* Email */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-accent mb-4">Email</h2>
        <p className="text-muted text-sm">{email}</p>
        <p className="text-xs text-muted mt-1">Email привязан к аккаунту, изменить нельзя</p>
      </div>

      {/* Role */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-accent mb-4">Роль</h2>
        <span className={`badge ${role === "teacher" || role === "admin" ? "badge-orange" : "bg-blue-100 text-blue-700"}`}>
          {role === "admin" ? "Админ" : role === "teacher" ? "Учитель" : "Ученик"}
        </span>
      </div>

      {/* Language Level */}
      {role !== "teacher" && role !== "admin" && (
        <div className="card p-6 md:col-span-2">
          <h2 className="text-lg font-semibold text-accent mb-4">Уровень языка</h2>
          <p className="text-sm text-muted mb-3">Выбери свой текущий уровень испанского. После подтверждения учителем он будет отображаться в профиле.</p>
          <div className="flex items-center gap-2">
            <select value={languageLevel} onChange={e => setLanguageLevel(e.target.value)} className="px-4 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400">
              <option value="">— Не выбран —</option>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button onClick={saveLevel} disabled={savingLevel || !languageLevel} className="btn-gradient px-4 py-2 text-sm disabled:opacity-50">
              {savingLevel ? "..." : "Сохранить"}
            </button>
            {levelSaved && <span className="text-sm text-green-600 font-medium">✓</span>}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-muted">Текущий уровень: <strong>{levelLabel}</strong></span>
            {isConfirmed && (
              <span className="badge badge-green">Подтверждён</span>
            )}
            {languageLevel && !isConfirmed && (
              <span className="badge badge-orange">Ожидает подтверждения</span>
            )}
          </div>
        </div>
      )}

      {/* Subscription */}
      {role !== "teacher" && role !== "admin" && (
        <div className="card p-6 md:col-span-2">
          <h2 className="text-lg font-semibold text-accent mb-4">Подписка</h2>
          {(() => {
            const isActive = subscriptionUntil && new Date(subscriptionUntil) > new Date();
            const untilDate = subscriptionUntil ? new Date(subscriptionUntil).toLocaleDateString("ru-RU") : null;
            if (isActive) {
              return (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-700 font-medium">✓ Подписка активна</p>
                  <p className="text-sm text-green-600 mt-1">До {untilDate}</p>
                </div>
              );
            }
            if (subscriptionRequestedAt) {
              return (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-700 font-medium">✓ Запрос отправлен</p>
                  <p className="text-sm text-blue-600 mt-1">Учитель получил уведомление. Ожидай подтверждения.</p>
                </div>
              );
            }
            return (
              <div>
                <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: "#F5F5F7" }}>
                  <p className="text-accent font-medium">Подписка неактивна</p>
                  <p className="text-sm text-muted mt-1">Нет доступа к урокам</p>
                </div>
                <button onClick={requestExtend} disabled={requestingExtend}
                  className="btn-gradient px-6 py-2.5 text-sm">
                  {requestingExtend ? "..." : "Запросить продление"}
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* Password */}
      <div className="card p-6 md:col-span-2">
        <h2 className="text-lg font-semibold text-accent mb-4">Сменить пароль</h2>
        <div className="space-y-3">
          <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Текущий пароль" className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Новый пароль (минимум 6 символов)" className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
          {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
          {passwordSuccess && <p className="text-sm text-green-600">✓ Пароль изменён</p>}
          <button onClick={changePassword} disabled={changingPassword} className="btn-gradient px-4 py-2 text-sm disabled:opacity-50">
            {changingPassword ? "..." : "Сменить пароль"}
          </button>
        </div>
      </div>
    </div>
  );
}
