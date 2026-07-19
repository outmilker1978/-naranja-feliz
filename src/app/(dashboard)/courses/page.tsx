export const dynamic = "force-dynamic";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { EnrollButton } from "./enroll-button";
import { OrangeProgress } from "@/components/orange-progress";

import { proxyImgUrl } from "@/lib/image-proxy";

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const viewRole = cookieStore.get("view_role")?.value;

  const metaRole = user.user_metadata?.role;
  const svc = createServiceClient();
  const { data: profileMeta } = await svc.from("profiles").select("role").eq("id", user.id).maybeSingle();

  const dbRole = profileMeta?.role;
  const isElevated = dbRole === "teacher" || dbRole === "admin" || metaRole === "teacher" || metaRole === "admin";
  const realRole = isElevated ? "teacher" : "student";
  const isTeacherView = realRole === "teacher" && (viewRole === "teacher" || !viewRole);

  const { data: enrollments } = await supabase.from("enrollments").select("course_id, paid").eq("student_id", user.id);
  const enrolledIds = (enrollments ?? []).map((e) => e.course_id);

  let accessGrantedIds: string[] = [];
  try {
    const { data: ca } = await svc.from("course_access").select("course_id").eq("student_id", user.id);
    accessGrantedIds = (ca ?? []).map((r: any) => r.course_id);
  } catch {}

  // Teachers/admins in student mode see their own courses as accessible
  const { data: ownedCourses } = isElevated
    ? await svc.from("courses").select("id").eq("created_by", user.id)
    : { data: [] };
  const ownedIds = (ownedCourses ?? []).map((c: any) => c.id);

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

  const { data: progressRecords } = enrolledIds.length > 0
    ? await supabase.from("lesson_progress").select("lesson_id, completed").eq("student_id", user.id)
    : { data: [] };

  const completedLessonIds = new Set((progressRecords ?? []).filter((p) => p.completed).map((p) => p.lesson_id));

  const { data: availableCourses } = await supabase.from("courses").select("*").eq("published", true).order("created_at", { ascending: false });

  const { data: myCourses } = isTeacherView
    ? await supabase.from("courses").select("*").eq("created_by", user.id).order("created_at", { ascending: false })
    : { data: [] };

  const hasOwnCourses = myCourses && myCourses.length > 0;

  return (
    <div>
      {isTeacherView && hasOwnCourses && (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-accent tracking-tight">Мои курсы</h1>
            <Link href="/admin/courses/new" className="btn-gradient btn-sm">+ Создать курс</Link>
          </div>
          <div className="space-y-4 mb-12">
            {(myCourses ?? []).map((course) => (
              <Link key={course.id} href={`/admin/courses/${course.id}`} className="group block card overflow-hidden hover:-translate-y-1">
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4">
                  {course.image_url && <div className="w-full sm:w-60 h-40 rounded-xl overflow-hidden bg-zinc-100 shrink-0"><img src={proxyImgUrl(course.image_url) ?? ""} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>}
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
            {(availableCourses ?? []).map((course) => {
              const isEnrolled = enrolledIds.includes(course.id) || ownedIds.includes(course.id);
              const hasAccess = accessGrantedIds.includes(course.id) || ownedIds.includes(course.id);
              if (isEnrolled || hasAccess) {
                const lc = lessonCountMap.get(course.id);
                const total = lc?.published ?? lc?.total ?? 0;
                const completed = [...completedLessonIds].filter(id => (lessonsByCourse ?? []).some(l => l.id === id && l.course_id === course.id)).length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <Link key={course.id} href={`/courses/${course.id}`} className="group block card overflow-hidden hover:-translate-y-1">
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4">
                      {course.image_url && <div className="w-full sm:w-60 h-40 rounded-xl overflow-hidden bg-zinc-100 shrink-0"><img src={proxyImgUrl(course.image_url) ?? ""} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>}
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
                    {course.image_url && <div className="w-full sm:w-60 h-40 rounded-xl overflow-hidden bg-zinc-100 shrink-0"><img src={proxyImgUrl(course.image_url) ?? ""} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>}
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