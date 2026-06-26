import type { UserRole } from "@/lib/auth";

export const signedInRoles = ["USER", "AGENT", "ADMIN"] satisfies UserRole[];
export const transactionCreatorRoles = ["AGENT", "ADMIN"] satisfies UserRole[];
export const adminRoles = ["ADMIN"] satisfies UserRole[];

export function hasRole(
  role: UserRole | null | undefined,
  roles: readonly UserRole[],
) {
  return Boolean(role && roles.includes(role));
}

export function canCreateTransaction(role: UserRole | null | undefined) {
  return hasRole(role, transactionCreatorRoles);
}

export function canAccessAdmin(role: UserRole | null | undefined) {
  return hasRole(role, adminRoles);
}

export function canManageTransaction(
  role: UserRole | null | undefined,
  actorId: string | undefined,
  ownerId: string | undefined,
) {
  return canAccessAdmin(role) || (role === "AGENT" && actorId === ownerId);
}
