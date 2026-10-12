import type { SupabaseClient } from "@supabase/supabase-js";
import type { Course } from "@/lib/types";

type CatalogRow = {
  id: string;
  section_code: string;
  instructor_name: string;
  capacity: number;
  enrolled_count: number;
  waitlist_enabled: boolean;
  room: string | null;
  meeting_pattern: string | null;
  courses: {
    code: string;
    title: string;
    description: string;
    credits: number;
    department: string;
    level: number;
  } | null;
  terms: { code: string; name: string } | null;
  profiles: { full_name: string } | null;
};

export async function loadCourseCatalog(supabase: SupabaseClient, options: { instructorId?: string } = {}): Promise<Course[]> {
  let query = supabase
    .from("course_sections")
    .select("id, section_code, instructor_name, capacity, enrolled_count, waitlist_enabled, room, meeting_pattern, courses(code,title,description,credits,department,level), terms(code,name), profiles!course_sections_instructor_id_fkey(full_name)")
    .eq("status", "published")
    .order("section_code");

  if (options.instructorId) query = query.eq("instructor_id", options.instructorId);
  const { data, error } = await query;
  if (error) throw new Error(`Unable to load the course catalogue: ${error.message}`);

  return ((data ?? []) as unknown as CatalogRow[])
    .filter((section) => section.courses)
    .map((section) => ({
      id: section.id,
      code: section.courses?.code ?? "COURSE",
      title: section.courses?.title ?? "Untitled course",
      description: section.courses?.description ?? "",
      instructor: section.profiles?.full_name || section.instructor_name || "Staff",
      credits: section.courses?.credits ?? 0,
      schedule: section.meeting_pattern ?? "Schedule to be announced",
      room: section.room ?? "TBA",
      seatsAvailable: Math.max(0, section.capacity - section.enrolled_count),
      capacity: section.capacity,
      department: section.courses?.department ?? "General",
      level: String(section.courses?.level ?? ""),
      sectionCode: section.section_code,
      termCode: section.terms?.code,
      termName: section.terms?.name,
      status: section.enrolled_count >= section.capacity ? (section.waitlist_enabled ? "waitlist" : "closed") : "open",
    }));
}
