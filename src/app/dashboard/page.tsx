import { redirect } from "next/navigation";
import { getCurrentIdentity } from "@/lib/auth";
import { rolePaths } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardRouter() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/?auth=required");
  if (!identity.role) redirect("/access-pending");
  redirect(rolePaths[identity.role]);
}
