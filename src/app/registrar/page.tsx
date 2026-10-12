import { RoleDashboard } from "@/components/role-dashboard";
import { requireRole } from "@/lib/auth";
import { loadCourseCatalog } from "@/lib/course-catalog";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RegistrarPage() {
  const identity = await requireRole("registrar");
  const supabase = await createClient();
  const courses = await loadCourseCatalog(supabase);
  return <RoleDashboard role="registrar" name={identity.displayName} initialCourses={courses} />;
}
