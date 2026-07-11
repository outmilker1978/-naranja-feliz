import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function TeachersPage() {
  const svc = createServiceClient();
  const { data: teachers } = await svc
    .from("content")
    .select("*")
    .eq("type", "teacher")
    .eq("status", "published")
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-accent text-center mb-2">Наши преподаватели</h1>
      <p className="text-muted text-center mb-10 max-w-xl mx-auto">Знакомьтесь с командой Naranja Feliz</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(teachers ?? []).map(t => {
          const photo = t.content?.photos?.[0];
          const social = t.content?.social ?? {};
          return (
            <Link key={t.id} href={`/teachers/${t.id}`} className="card overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              {photo ? (
                <div className="h-56 overflow-hidden">
                  <img src={photo} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ) : (
                <div className="h-56 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                  <span className="text-5xl opacity-30">🍊</span>
                </div>
              )}
              <div className="p-5">
                <h2 className="text-lg font-bold text-accent group-hover:text-primary-500 transition-colors">{t.title}</h2>
                {t.excerpt && <p className="text-sm text-muted mt-1 line-clamp-2">{t.excerpt}</p>}
                <div className="flex gap-3 mt-3">
                  {social.vk && <span className="text-xs text-zinc-400">VK</span>}
                  {social.telegram && <span className="text-xs text-zinc-400">TG</span>}
                  {social.email && <span className="text-xs text-zinc-400">Email</span>}
                </div>
              </div>
            </Link>
          );
        })}
        {(!teachers || teachers.length === 0) && (
          <p className="text-muted col-span-full text-center py-10">Информация о преподавателях скоро появится</p>
        )}
      </div>
    </div>
  );
}
