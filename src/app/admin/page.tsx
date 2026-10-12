import { RoleDashboard } from "@/components/role-dashboard";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const identity = await requireRole("system_admin");
  return <RoleDashboard role="system_admin" name={identity.displayName} />;
}
