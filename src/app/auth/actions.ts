"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createLocalAdminClient, isLocalAuthMode } from "@/lib/supabase/admin";
import { isAppRole } from "@/lib/permissions";

function textField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function loginError(message: string, mode: "signin" | "create" = "signin"): never {
  redirect(`/login?mode=${mode}&error=${encodeURIComponent(message)}`);
}

export async function signInWithUniversitySSO() {
  if (!hasSupabaseConfig()) redirect("/?setup=required#demo");

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const domain = process.env.UNIVERSITY_SSO_DOMAIN;
  if (!domain) redirect("/?setup=sso-domain");

  const { data, error } = await supabase.auth.signInWithSSO({
    domain,
    options: { redirectTo: `${siteUrl}/auth/callback` },
  });

  if (error || !data.url) redirect("/?auth=failed");
  redirect(data.url);
}

export async function signInLocally(formData: FormData) {
  if (!isLocalAuthMode()) loginError("Local sign-in is not enabled.");
  const email = textField(formData, "email").toLowerCase();
  const password = textField(formData, "password");
  if (!email || !password) loginError("Enter both your email and password.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) loginError("That email or password was not recognised.");
  redirect("/dashboard");
}

export async function createLocalDemoAccount(formData: FormData) {
  if (!isLocalAuthMode()) loginError("Local account creation is not enabled.", "create");
  const fullName = textField(formData, "fullName");
  const email = textField(formData, "email").toLowerCase();
  const password = textField(formData, "password");
  const roleValue = textField(formData, "role");

  if (fullName.length < 2) loginError("Enter your name.", "create");
  if (!email.includes("@")) loginError("Enter a valid email address.", "create");
  if (password.length < 8) loginError("Use a password with at least 8 characters.", "create");
  if (!isAppRole(roleValue)) loginError("Choose a valid demonstration role.", "create");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error || !data.user) loginError(error?.message ?? "The account could not be created.", "create");

  const admin = createLocalAdminClient();
  const { error: roleError } = await admin.from("user_roles").upsert({
    user_id: data.user.id,
    role: roleValue,
  });
  if (roleError) loginError("The account was created, but its role could not be assigned.", "create");

  redirect("/dashboard");
}

export async function signOut() {
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
