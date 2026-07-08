import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const revalidate = 60;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const checkOnly = searchParams.get("checkAccess") === "1";

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const svc = createServiceClient();
    const { data: callerProfile } = await svc.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const metaRole = user.user_metadata?.role;
    const isElevated = callerProfile?.role === "teacher" || callerProfile?.role === "admin" || metaRole === "teacher" || metaRole === "admin";
    if (!isElevated) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (checkOnly) return NextResponse.json({ ok: true });

    const [countsRes, chartRes, storageRes] = await Promise.allSettled([
      Promise.all([
        svc.from("profiles").select("*", { count: "exact", head: true }),
        svc.from("courses").select("*", { count: "exact", head: true }),
        svc.from("lessons").select("*", { count: "exact", head: true }),
        svc.from("lesson_blocks").select("*", { count: "exact", head: true }),
        svc.from("enrollments").select("*", { count: "exact", head: true }),
        svc.from("block_submissions").select("*", { count: "exact", head: true }),
        svc.rpc("get_db_stats").maybeSingle(),
      ]),
      Promise.all([
        svc.rpc("get_users_by_role"),
        svc.rpc("get_courses_by_level"),
        svc.rpc("get_students_by_language_level"),
        svc.rpc("get_progress_stats"),
      ]),
      svc.storage.from("lesson-files").list(),
    ]);

    let dbSizeBytes = 0;
    let dbSizePretty = "неизвестно";
    let userCount = 0, courseCount = 0, lessonCount = 0, blockCount = 0, enrollmentCount = 0, submissionCount = 0;

    if (countsRes.status === "fulfilled") {
      const [users, courses, lessons, blocks, enrollments, submissions, dbStats] = countsRes.value;
      userCount = users.count ?? 0;
      courseCount = courses.count ?? 0;
      lessonCount = lessons.count ?? 0;
      blockCount = blocks.count ?? 0;
      enrollmentCount = enrollments.count ?? 0;
      submissionCount = submissions.count ?? 0;
      const ds = dbStats.data as any;
      dbSizeBytes = ds?.size_bytes ?? 0;
      dbSizePretty = ds?.size_pretty ?? "неизвестно";
    }

    let usersByRole: any = null;
    let coursesByLevel: any = null;
    let studentsByLevel: any = null;
    let progressStats: any = null;

    if (chartRes.status === "fulfilled") {
      const [r1, r2, r3, r4] = chartRes.value;
      usersByRole = r1.data;
      coursesByLevel = r2.data;
      studentsByLevel = r3.data;
      progressStats = r4.data;
    }

    let storageBytes = 0;
    let fileCount = 0;
    if (storageRes.status === "fulfilled" && storageRes.value.data) {
      for (const item of storageRes.value.data) {
        if (item.metadata?.size) {
          storageBytes += Number(item.metadata.size);
          fileCount++;
        }
      }
    }

    const res = NextResponse.json({
      dbSizeBytes,
      dbSizePretty,
      dbLimit: 500,
      dbLimitUnit: "MB",
      dbPercent: Math.round((dbSizeBytes / (500 * 1024 * 1024)) * 100),
      storageBytes,
      storagePretty: formatBytes(storageBytes),
      storageLimit: 1024,
      storageLimitUnit: "MB",
      storagePercent: Math.round((storageBytes / (1024 * 1024 * 1024)) * 100),
      fileCount,
      users: userCount,
      courses: courseCount,
      lessons: lessonCount,
      blocks: blockCount,
      enrollments: enrollmentCount,
      submissions: submissionCount,
      usersByRole: (usersByRole as any[]) ?? [],
      coursesByLevel: (coursesByLevel as any[]) ?? [],
      studentsByLevel: (studentsByLevel as any[]) ?? [],
      progressStats: (progressStats as any[]) ?? [],
    });
    res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return res;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}
