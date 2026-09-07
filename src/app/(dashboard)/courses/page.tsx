export const dynamic = "force-dynamic";
import { getServerClient, getCurrentUser } from "@/lib/auth-cache";
import { cookies } from "next/headers";
import Link from "next/link";
import { EnrollButton } from "./enroll-button";
import { OrangeProgress } from "@/components/orange-progress";
import StorageImage from "@/components/storage-image";

export default async function CoursesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await getServerClient();

  const cookieStore = await cookies();
  const viewRole = cookieStore.get("view_role")?.value;

  const metaRole = user.user_metadata?.role;

  // 1 RPC вместо 9 последовательных запросов
  const { data: rpc } = await supabase.rpc("get_course_list", { uid: user.id });

  const dbRole = rpc?.role;
  const isAdmin = dbRole === "admin" || metaRole === "admin";
  const isElevated = dbRole === "teacher" || dbRole === "admin" || metaRole === "teacher" || metaRole === "admin";
  const realRole = isElevated ? "teacher" : "student";
  const isTeacherView = realRole === "teacher" && (viewRole === "teacher" || !viewRole);

  const enrolledIds = (rpc?.enrollments ?? []).map((e: any) => e.course_id);
  const accessGrantedIds = rpc?.course_access ?? [];
  const ownedCourses = rpc?.owned_courses ?? [];
  const ownedIds = ownedCourses.map((c: any) => c.id);

  const { data: subState } = await supabase.from("profiles").select("subscription_until").eq("id", user.id).single();
  const hasActiveSub = !!subState?.subscription_until && new Date(subState.subscription_until) > new Date();
  const unlockedForSub = (course: any) => hasActiveSub && course.access_mode !== "per_course" && course.access_mode !== "marathon";

  const lessonProgress = rpc?.lesson_progress ?? [];
  const completedLessonIds = new Set(lessonProgress.filter((p: any) => p.completed).map((p: any) => p.lesson_id));

  const availableCourses = rpc?.courses ?? [];
  const myCourses = isTeacherView ? (rpc?.owned_courses ?? []) : [];
  const hasOwnCourses = myCourses.length > 0;

  // Для прогресса нужно знать количество уроков на курсе — 1 дополнительный запрос
  const { data: lessonsByCourse } = enrolledIds.length > 0
    ? await supabase.from("lessons").select("id, course_id, published").in("course_id", enrolledIds)
    : { data: [] };

  const lessonCountMap = new Map<string, { total: number; published: number }>();
  for (const l of lessonsByCourse ?? []) {
    const entry = lessonCountMap.get(l.course_id) ?? { total: 0, published: 0 };
    entry.total++;
    if (l.published) entry.published++;
    lessonCountMap.set(l.course_id, entry);
  }

  return (
    <div>
      {isTeacherView && hasOwnCourses && (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-accent tracking-tight">Мои курсы</h1>
            <Link href="/admin/courses/new" className="btn-gradient btn-sm">+ Создать курс</Link>
          </div>
          <div className="space-y-4 mb-12">
            {(myCourses ?? []).map((course: any) => (
              <Link key={course.id} href={`/admin/courses/${course.id}`} className="group block card overflow-hidden hover:-translate-y-1">
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4">
                  {course.image_url && <div className="w-full sm:w-60 h-40 rounded-xl overflow-hidden bg-zinc-100 shrink-0 relative"><StorageImage src={course.image_url} alt="" fill sizes="(min-width:640px) 240px, 100vw" className="object-cover group-hover:scale-105 transition-transform duration-500" /></div>}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-accent break-words">{course.title}</h3>
                    <p className="text-sm text-muted mt-0.5 line-clamp-1">{course.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="badge badge-orange">{course.level}</span>
                      {course.published ? <span className="badge badge-green">Опубликован</span> : <span className="badge badge-gray">Черновик</span>}
                      {course.access_mode === "subscription" && <span className="badge" style={{ background: "#F3E8FF", color: "#7C3AED" }}>По подписке</span>}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-primary-500 shrink-0 self-end sm:self-center mt-2 sm:mt-0">Управлять →</span>
                </div>
              </Link>
            ))}
          </div>
          <hr className="border-border mb-8" />
        </>
      )}

      {!isTeacherView && <h1 className="text-2xl font-bold text-accent mb-6 tracking-tight">Мои курсы</h1>}

      {isTeacherView && !hasOwnCourses && (
        <div className="text-center py-16 text-muted">
          <p className="mb-4">У тебя пока нет курсов</p>
          <Link href="/admin/courses/new" className="btn-gradient">+ Создать курс</Link>
        </div>
      )}

      {isTeacherView && hasOwnCourses && !availableCourses?.length && (
        <div className="text-center py-16 text-muted"><p>Нет опубликованных курсов для студентов</p></div>
      )}

      {!isTeacherView && availableCourses && availableCourses.length > 0 && (
        <div>
          {enrolledIds.length > 0 && <p className="text-sm text-muted mb-4">Ты записан на {enrolledIds.length} курс{enrolledIds.length > 1 ? "а" : ""}</p>}
          <div className="space-y-4">
            {(availableCourses ?? []).map((course: any) => {
              const isEnrolled = enrolledIds.includes(course.id) || ownedIds.includes(course.id);
              const hasAccess = accessGrantedIds.includes(course.id) || ownedIds.includes(course.id) || isAdmin;
              if (isEnrolled || hasAccess || unlockedForSub(course)) {
                const lc = lessonCountMap.get(course.id);
                const total = lc?.published ?? lc?.total ?? 0;
                const completed = [...completedLessonIds].filter(id => (lessonsByCourse ?? []).some(l => l.id === id && l.course_id === course.id)).length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <Link key={course.id} href={`/courses/${course.id}`} className="group block card overflow-hidden hover:-translate-y-1">
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4">
                      {course.image_url && <div className="w-full sm:w-60 h-40 rounded-xl overflow-hidden bg-zinc-100 shrink-0 relative"><StorageImage src={course.image_url} alt="" fill sizes="(min-width:640px) 240px, 100vw" className="object-cover group-hover:scale-105 transition-transform duration-500" /></div>}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-accent break-words">{course.title}</h3>
                        <p className="text-sm text-muted mt-0.5 line-clamp-1">{course.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className="badge badge-orange">{course.level}</span>
                          {course.access_mode === "subscription" && <span className="badge" style={{ background: "#F3E8FF", color: "#7C3AED" }}>По подписке</span>}
                          {total > 0 && <span className="text-xs text-muted">{completed}/{total}</span>}
                        </div>
                        {total > 0 && <div className="mt-2"><OrangeProgress completed={completed} total={total} size="sm" /></div>}
                      </div>
                      <span className="text-sm font-bold text-primary-500 shrink-0 self-end sm:self-center mt-2 sm:mt-0">{pct === 100 ? "🍊 Пройден" : "Перейти к урокам →"}</span>
                    </div>
                  </Link>
                );
              }
              const isPerCourse = course.access_mode === "per_course";
              return (
                <Link key={course.id} href={isPerCourse ? `/courses/${course.id}` : "#"} className="group block card overflow-hidden hover:-translate-y-1 transition-all duration-300">
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4">
                    {course.image_url && <div className="w-full sm:w-60 h-40 rounded-xl overflow-hidden bg-zinc-100 shrink-0 relative"><StorageImage src={course.image_url} alt="" fill sizes="(min-width:640px) 240px, 100vw" className="object-cover group-hover:scale-105 transition-transform duration-500" /></div>}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-accent break-words">{course.title}</h3>
                      <p className="text-sm text-muted mt-0.5 line-clamp-1">{course.description}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="badge badge-orange">{course.level}</span>
                        {course.access_mode === "subscription" && <span className="badge" style={{ background: "#F3E8FF", color: "#7C3AED" }}>По подписке</span>}
                        {isPerCourse && <span className="badge" style={{ background: "#FFF7ED", color: "#C2410C" }}>По запросу</span>}
                      </div>
                    </div>
                    {isPerCourse ? (
                      <span className="text-sm font-semibold text-primary-500 shrink-0 self-end sm:self-center mt-2 sm:mt-0">Запросить доступ →</span>
                    ) : (
                      <EnrollButton courseId={course.id} />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {(!availableCourses || availableCourses.length === 0) && !isTeacherView && (
        <div className="text-center py-16 text-muted"><p>Пока нет доступных курсов</p></div>
      )}
    </div>
  );
}