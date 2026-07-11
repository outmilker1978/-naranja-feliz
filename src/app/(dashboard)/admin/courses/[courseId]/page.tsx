import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CourseActions } from "./course-actions";
import { NewLessonForm } from "./new-lesson-form";
import { LessonList } from "./lesson-list";
import { OrangeProgress } from "@/components/orange-progress";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const svc = createServiceClient();
  const { data: callerProfile } = await svc.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const metaRole = user.user_metadata?.role;
  if (!(callerProfile?.role === "teacher" || callerProfile?.role === "admin" || metaRole === "teacher" || metaRole === "admin")) redirect("/courses");

  const { data: course } = await svc
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (!course || course.created_by !== user.id) redirect("/courses");

  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("student_id, paid")
    .eq("course_id", courseId);

  const studentIds = (enrollments ?? []).map(e => e.student_id);

  // Get progress for each enrolled student
  const { data: allProgress } = studentIds.length > 0
    ? await supabase
        .from("lesson_progress")
        .select("student_id, lesson_id, completed")
        .in("student_id", studentIds)
    : { data: [] };

  const progressByStudent = new Map<string, { completed: number; total: number }>();
  for (const p of allProgress ?? []) {
    const entry = progressByStudent.get(p.student_id) ?? { completed: 0, total: 0 };
    entry.total++;
    if (p.completed) entry.completed++;
    progressByStudent.set(p.student_id, entry);
  }

  // Get student profiles
  const { data: studentProfiles } = studentIds.length > 0
    ? await svc
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", studentIds)
    : { data: [] };

  const profileMap = new Map(
    (studentProfiles ?? []).map((p: any) => [p.id, p]),
  );

  const totalLessons = (lessons ?? []).filter((l: any) => l.published).length;

  return (
    <>
      <div className="border-b border-border/30 bg-white" style={{ position: "fixed", top: "73px", left: 0, right: 0, zIndex: 40 }}>
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 px-4 sm:px-8 py-2.5 text-sm">
          <Link href="/admin/courses" className="font-semibold text-primary-500 hover:text-primary-600 transition-colors">Курсы</Link>
          <span className="text-muted/40">→</span>
          <span className="text-accent/70 font-medium truncate">{course.title}</span>
        </div>
      </div>

    <div className="pt-14">
      {course.image_url && (
        <div className="aspect-video rounded-2xl overflow-hidden mb-6 bg-zinc-100">
          <img src={course.image_url} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
        </div>
      )}

      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-accent">{course.title}</h1>
          {course.description && <p className="text-base font-semibold text-muted mt-1">{course.description}</p>}
          <div className="flex items-center gap-2 mt-2">
            <span className="badge badge-orange">{course.level}</span>
            {course.published ? (
              <span className="badge badge-green">Опубликован</span>
            ) : (
              <span className="badge badge-gray">Черновик</span>
            )}
          </div>
        </div>
        <CourseActions courseId={course.id} published={course.published} title={course.title} description={course.description} level={course.level} imageUrl={course.image_url} access_mode={course.access_mode ?? "public"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-accent mb-4">Уроки</h2>

          <LessonList lessons={lessons ?? []} />

          <NewLessonForm courseId={course.id} orderIndex={(lessons ?? []).length} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-accent mb-4">
            Студенты ({enrollments?.length ?? 0})
          </h2>
          <div className="space-y-2">
            {(!enrollments || enrollments.length === 0) && (
              <p className="text-muted text-sm">Пока нет студентов</p>
            )}
            {(enrollments ?? []).map((enrollment) => {
              const profile = profileMap.get(enrollment.student_id) as { full_name: string | null; email: string; avatar_url: string | null } | undefined;
              const prog = progressByStudent.get(enrollment.student_id);
              return (
                <div
                  key={enrollment.student_id}
                  className="border border-border rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-border shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center text-sm text-primary-500 font-bold shrink-0">
                        {(profile?.full_name || profile?.email || "?")[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{profile?.full_name || profile?.email}</p>
                      <p className="text-xs text-muted">{profile?.email}</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${
                      enrollment.paid
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {enrollment.paid ? "Оплачено" : "Не оплачено"}
                  </span>
                  {prog && totalLessons > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-muted mb-1">
                        <span>Прогресс:</span>
                        <span>{prog.completed}/{totalLessons}</span>
                      </div>
                      <OrangeProgress completed={prog.completed} total={totalLessons} size="sm" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
