import { RoleDashboard } from "@/components/role-dashboard";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const identity = await requireRole("system_admin");
  const supabase = await createClient();
  const [profilesResult, rolesResult, auditResult] = await Promise.all([
    supabase.from("profiles").select("id,full_name,email,active").order("full_name"),
    supabase.from("user_roles").select("user_id,role"),
    supabase.from("audit_logs").select("id,occurred_at,actor_id,action,resource_type,resource_id,outcome").order("occurred_at", { ascending: false }).limit(50),
  ]);

  const profiles = profilesResult.data ?? [];
  const rolesByUser = new Map((rolesResult.data ?? []).map((assignment) => [assignment.user_id, assignment.role]));
  const profileNames = new Map(profiles.map((profile) => [profile.id, profile.full_name || profile.email]));
  const accounts = profiles.map((profile) => ({
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    role: rolesByUser.get(profile.id) ?? null,
    active: profile.active,
  }));
  const auditRecords = (auditResult.data ?? []).map((record) => ({
    id: String(record.id),
    occurredAt: record.occurred_at,
    actor: record.actor_id ? profileNames.get(record.actor_id) ?? "Account unavailable" : "System / external",
    action: record.action,
    resource: `${record.resource_type}${record.resource_id ? ` · ${record.resource_id}` : ""}`,
    outcome: record.outcome,
  }));
  const adminDataMessage = profilesResult.error || rolesResult.error || auditResult.error
    ? "Some account or audit data could not be loaded. Check the database permissions and try again."
    : undefined;

  return <RoleDashboard
    role="system_admin"
    name={identity.displayName}
    adminAccounts={accounts}
    auditRecords={auditRecords}
    databaseConnected={!profilesResult.error}
    adminDataMessage={adminDataMessage}
  />;
}
