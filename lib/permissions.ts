import type { UserRole } from "@/lib/auth";

const signedInRoles: UserRole[] = ["USER", "AGENT", "ADMIN"];
const agentAdminRoles: UserRole[] = ["AGENT", "ADMIN"];
const adminRoles: UserRole[] = ["ADMIN"];
const agentRoles: UserRole[] = ["AGENT"];

function hasRole(
  role: UserRole | null | undefined,
  allowedRoles: readonly UserRole[],
): boolean {
  return role !== null && role !== undefined && allowedRoles.includes(role);
}

export function isAdmin(role: UserRole | null | undefined): boolean {
  return hasRole(role, adminRoles);
}

export function isAgent(role: UserRole | null | undefined): boolean {
  return hasRole(role, agentRoles);
}

export function isAgentOrAdmin(role: UserRole | null | undefined): boolean {
  return hasRole(role, agentAdminRoles);
}

export function isSignedIn(role: UserRole | null | undefined): boolean {
  return hasRole(role, signedInRoles);
}
