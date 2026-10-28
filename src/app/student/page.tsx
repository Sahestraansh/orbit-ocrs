import { RoleDashboard } from "@/components/role-dashboard";
import { requireRole } from "@/lib/auth";
import { loadCourseCatalog } from "@/lib/course-catalog";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StudentPage() {
  const identity = await requireRole("student");
  const supabase = await createClient();
  const [liveCourses, { data: registrations }, { data: profile }, { data: payments }, { data: notifications }] = await Promise.all([
    loadCourseCatalog(supabase),
    supabase.from("registrations").select("section_id,status").eq("student_id", identity.user.id).in("status", ["registered", "waitlisted"]),
    supabase.from("profiles").select("max_credits").eq("id", identity.user.id).maybeSingle(),
    supabase.from("payment_transactions").select("id,amount_minor,currency,status,description,created_at").eq("student_id", identity.user.id).order("created_at", { ascending: false }),
    supabase.from("notifications").select("id,title,body").eq("user_id", identity.user.id).order("created_at", { ascending: false }).limit(10),
  ]);

  return <RoleDashboard
    role="student"
    name={identity.displayName}
    initialCourses={liveCourses}
    initialRegisteredIds={(registrations ?? []).filter((item) => item.status === "registered").map((item) => item.section_id)}
    initialWaitlistedIds={(registrations ?? []).filter((item) => item.status === "waitlisted").map((item) => item.section_id)}
    creditLimit={profile?.max_credits ?? undefined}
    payments={(payments ?? []).map((payment) => ({ id: payment.id, amountMinor: Number(payment.amount_minor), currency: payment.currency, status: payment.status, description: payment.description, createdAt: payment.created_at }))}
    notifications={(notifications ?? []).map((notification) => ({ id: notification.id, title: notification.title, body: notification.body }))}
  />;
}
