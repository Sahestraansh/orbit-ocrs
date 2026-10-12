import type { AppRole } from "@/lib/types";

export type Permission =
  | "catalog:read"
  | "registration:manage:self"
  | "roster:read:assigned"
  | "catalog:manage"
  | "registration:override"
  | "reports:read"
  | "users:manage"
  | "audit:read";

const permissions: Record<AppRole, ReadonlySet<Permission>> = {
  student: new Set(["catalog:read", "registration:manage:self"]),
  faculty: new Set(["catalog:read", "roster:read:assigned"]),
  registrar: new Set(["catalog:read", "catalog:manage", "registration:override", "reports:read"]),
  system_admin: new Set(["catalog:read", "users:manage", "audit:read"]),
};

export function can(role: AppRole, permission: Permission) {
  return permissions[role].has(permission);
}

export function isAppRole(value: unknown): value is AppRole {
  return value === "student" || value === "faculty" || value === "registrar" || value === "system_admin";
}
