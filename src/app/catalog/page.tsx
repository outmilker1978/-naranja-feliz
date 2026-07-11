import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function CatalogPage() {
  const svc = createServiceClient();

  const { data: courses } = await svc
    .from("courses")
    .select("id, title, description, level, image_url, access_mode, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });

  const courseIds = (courses ?? []).map(c => c.id);
  const { data: allLessons } = courseIds.length > 0 ? await svc
    .from("lessons")
    .select("id, title, course_id, order_index")
    .in("course_id", courseIds)
    .order("order_index", { ascending: true }) : { data: [] };

  const lessonsByCourse: Record<string, any[]> = {};
  for (const l of allLessons ?? []) {
    if (!lessonsByCourse[l.course_id]) lessonsByCourse[l.course_id] = [];
    lessonsByCourse[l.course_id].push(l);
  }

  const { data: materials } = await svc
    .from("content")
    .select("id, title, excerpt, type, cover_image, created_at")
    .in("type", ["news", "article"])
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-accent mb-2">Каталог курсов</h1>
      <p className="text-muted mb-10">Все курсы школы. Уроки доступны по подписке.</p>

      <div className="space-y-8">
        {(courses ?? []).map(course => (
          <div key={course.id} className="card overflow-hidden">
            <div className="grid md:grid-cols-[280px_1fr] gap-0">
              {course.image_url ? (
                <div className="h-48 md:h-full overflow-hidden">
                  <img src={course.image_url} alt={course.title} loading="lazy" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-48 md:h-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                  <span className="text-5xl opacity-30">🍊</span>
                </div>
              )}
              <div className="p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  {course.level && <span className="badge badge-orange">{course.level}</span>}
                  {course.access_mode === "subscription" && <span className="badge" style={{ background: "#F3E8FF", color: "#7C3AED" }}>По подписке</span>}
                </div>
                <h2 className="text-xl font-bold text-accent mb-2">{course.title}</h2>
                {course.description && <p className="text-sm text-muted mb-4 line-clamp-2">{course.description}</p>}

                <div className="mt-auto">
                  <p className="text-xs text-zinc-400 mb-2">Уроков: {lessonsByCourse[course.id]?.length ?? 0}</p>
                  {lessonsByCourse[course.id]?.length > 0 && (
                    <div className="space-y-1 mb-4">
                      {lessonsByCourse[course.id].map((lesson, li) => (
                        <Link key={lesson.id} href={`/courses/${course.id}/${lesson.id}`}
                          className="block text-sm text-muted hover:text-primary-500 transition-colors pl-3 border-l-2 border-zinc-200 hover:border-primary-400">
                          {lesson.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {(!courses || courses.length === 0) && (
          <p className="text-muted text-center py-10">Курсы скоро появятся</p>
        )}
      </div>

      {/* Materials preview */}
      {materials && materials.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-accent mb-6">Учебные материалы</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map(m => (
              <Link key={m.id} href={`/content/${m.id}`} className="card p-4 hover:-translate-y-1 transition-all duration-300">
                <span className="badge badge-orange text-[10px]">{m.type === "news" ? "Новость" : "Статья"}</span>
                <h3 className="font-semibold text-accent mt-2">{m.title}</h3>
                {m.excerpt && <p className="text-xs text-muted mt-1 line-clamp-2">{m.excerpt}</p>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
