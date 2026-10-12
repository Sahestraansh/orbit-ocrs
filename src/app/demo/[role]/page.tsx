import { notFound } from "next/navigation";
import { RoleDashboard } from "@/components/role-dashboard";
import { loadCourseCatalog } from "@/lib/course-catalog";
import { isAppRole } from "@/lib/permissions";
import { createLocalAdminClient, isLocalAuthMode } from "@/lib/supabase/admin";
import type { Course } from "@/lib/types";

export default async function DemoRolePage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  if (!isAppRole(role)) notFound();
  const names = { student: "Sahestraansh Tyagi", faculty: "Dr. Arjun Menon", registrar: "Rohan Kapoor", system_admin: "Anika Bose" };
  let courses: Course[] = [];
  if (isLocalAuthMode()) {
    try {
      courses = await loadCourseCatalog(createLocalAdminClient());
    } catch {
      courses = [];
    }
  }
  const initialRegisteredIds = role === "student" ? courses.slice(0, 2).map((course) => course.id) : undefined;
  return <RoleDashboard role={role} name={names[role]} isDemo initialCourses={courses} initialRegisteredIds={initialRegisteredIds} />;
}
