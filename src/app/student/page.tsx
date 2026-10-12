import { RoleDashboard } from "@/components/role-dashboard";
import { requireRole } from "@/lib/auth";
import { loadCourseCatalog } from "@/lib/course-catalog";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StudentPage() {
  const identity = await requireRole("student");
  const supabase = await createClient();
  const [liveCourses, { data: registrations }] = await Promise.all([
    loadCourseCatalog(supabase),
    supabase.from("registrations").select("section_id").eq("student_id", identity.user.id).eq("status", "registered"),
  ]);

  return <RoleDashboard role="student" name={identity.displayName} initialCourses={liveCourses} initialRegisteredIds={(registrations ?? []).map((item) => item.section_id)} />;
}
