import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { isAppRole } from "@/lib/permissions";
import type { AppRole } from "@/lib/types";

export async function getCurrentIdentity() {
  if (!hasSupabaseConfig()) return null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = roleRow?.role;
  return {
    user,
    role: isAppRole(role) ? role : null,
    displayName: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "University user",
  };
}

export async function requireRole(expected: AppRole) {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/?auth=required");
  if (!identity.role) redirect("/access-pending");
  if (identity.role !== expected) redirect("/forbidden");
  return identity;
}
