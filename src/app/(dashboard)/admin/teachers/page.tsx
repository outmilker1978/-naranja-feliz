export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { AllUsersList } from "./profile-list";

export default async function TeacherAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = createServiceClient();
  const { data: callerProfile } = await svc.from("profiles").select("role").eq("id", user.id).single();
  const metaRole = user.user_metadata?.role;
  if (!(callerProfile?.role === "teacher" || callerProfile?.role === "admin" || metaRole === "teacher" || metaRole === "admin")) {
    redirect("/courses");
  }

  const { data: raw } = await svc.rpc("get_all_profiles");
  const allProfiles = (raw as any[]) ?? [];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-accent mb-2">Учительская</h1>
      <p className="text-sm text-muted mb-6">Управление пользователями: назначай учителей/админов, подтверждай уровни, продлевай подписку.</p>

      <AllUsersList profiles={allProfiles} currentUserId={user.id} />
    </div>
  );
}
