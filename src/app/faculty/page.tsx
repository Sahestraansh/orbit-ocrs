import { RoleDashboard } from "@/components/role-dashboard";
import { requireRole } from "@/lib/auth";
import { loadCourseCatalog } from "@/lib/course-catalog";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FacultyPage() {
  const identity = await requireRole("faculty");
  const supabase = await createClient();
  const courses = await loadCourseCatalog(supabase, { instructorId: identity.user.id });
  return <RoleDashboard role="faculty" name={identity.displayName} initialCourses={courses} />;
}
