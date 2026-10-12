import "server-only";

import { createClient } from "@supabase/supabase-js";

function assertLocalDemoEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const mode = process.env.NEXT_PUBLIC_AUTH_MODE;
  const serviceKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey || mode !== "local") {
    throw new Error("Local demonstration authentication is not enabled.");
  }

  const hostname = new URL(url).hostname;
  if (hostname !== "127.0.0.1" && hostname !== "localhost") {
    throw new Error("Local demonstration accounts can only be created against a localhost Supabase instance.");
  }

  return { url, serviceKey };
}

export function createLocalAdminClient() {
  const { url, serviceKey } = assertLocalDemoEnvironment();
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function isLocalAuthMode() {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "local") return false;
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    return url.hostname === "127.0.0.1" || url.hostname === "localhost";
  } catch {
    return false;
  }
}
