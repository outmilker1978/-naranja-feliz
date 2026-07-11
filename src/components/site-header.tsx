import { createClient, createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { cookies } from "next/headers";
import { MessageCircle } from "lucide-react";
import { UserMenu } from "./user-menu";
import { ToolsButton, BellIcon } from "./header-client";

export default async function SiteHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <header className="glass">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-5 md:px-8 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo-128.png" alt="Naranja Feliz" className="w-12 h-12" />
            <span className="font-bold text-primary-500 text-lg">Naranja Feliz</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-muted hover:text-accent transition-colors">Войти</Link>
            <Link href="/register" className="btn-gradient btn-sm">Записаться</Link>
          </nav>
        </div>
      </header>
    );
  }

  const svc = createServiceClient();
  const cookieStore = await cookies();
  const viewRole = cookieStore.get("view_role")?.value;

  const { data: profile } = await svc.from("profiles")
    .select("role, full_name, avatar_url, subscription_until")
    .eq("id", user.id)
    .maybeSingle();

  const dbRole = profile?.role;
  const metaRole = user.user_metadata?.role ?? "student";
  const isElevated = dbRole === "teacher" || dbRole === "admin" || metaRole === "teacher" || metaRole === "admin";
  const realRole = isElevated ? (dbRole === "admin" || metaRole === "admin" ? "admin" : "teacher") : "student";
  const activeRole = viewRole === "student" || viewRole === "teacher" ? viewRole : realRole;

  const userName = profile?.full_name || user.user_metadata?.full_name || null;
  const userEmail = user.email!;
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || null;

  const linkClass = (href: string) =>
    `text-sm font-medium transition-colors duration-200 text-muted hover:text-accent`;

  return (
    <header className="glass">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-5 md:px-8 py-3">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <img src="/logo-128.png" alt="Naranja Feliz" className="w-12 h-12" />
          <span className="font-bold text-primary-500 text-lg">Naranja Feliz</span>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden lg:flex items-center gap-5">
            <Link href="/courses" className={linkClass("/courses")}>Мои курсы</Link>
            <Link href="/tools/vocabulary" className={linkClass("/tools/vocabulary")}>Словарь</Link>
            <Link href="/tools/chat" className={`${linkClass("/tools/chat")} flex items-center gap-1`}>
              <MessageCircle className="w-4 h-4" /> Чат
            </Link>
            {(realRole === "teacher" || realRole === "admin") && activeRole !== "student" && (
              <Link href="/admin/submissions" className={linkClass("/admin/submissions")}>Проверка</Link>
            )}
          </nav>
          {(realRole === "teacher" || realRole === "admin") && (
            <div className="flex items-center gap-1 text-xs border border-primary-200 rounded-full p-0.5">
              <form action="/api/set-view-role" method="POST" className="contents">
                <input type="hidden" name="role" value="teacher" />
                <button type="submit"
                  className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${activeRole !== "student" ? "bg-primary-500 text-white shadow-sm" : "text-muted hover:text-accent"}`}>
                  Учитель
                </button>
              </form>
              <form action="/api/set-view-role" method="POST" className="contents">
                <input type="hidden" name="role" value="student" />
                <button type="submit"
                  className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${activeRole === "student" ? "bg-primary-500 text-white shadow-sm" : "text-muted hover:text-accent"}`}>
                  Ученик
                </button>
              </form>
            </div>
          )}
          <div className="hidden lg:block"><ToolsButton /></div>
          {realRole === "student" && profile?.subscription_until && new Date(profile.subscription_until) > new Date() && (
            <div className="flex items-center gap-1.5 text-xs text-secondary-500 font-semibold bg-secondary-50 px-2.5 py-1 rounded-full" title={`Подписка активна до ${new Date(profile.subscription_until).toLocaleDateString("ru-RU")}`}>
              <span className="w-2 h-2 rounded-full bg-secondary-500 inline-block" />
              {Math.ceil((new Date(profile.subscription_until).getTime() - Date.now()) / 86400000)} дн.
            </div>
          )}
          <BellIcon />
          <UserMenu
            userName={userName}
            userEmail={userEmail}
            realRole={realRole}
            avatarUrl={avatarUrl}
          />
        </div>
      </div>
    </header>
  );
}
