"use client";

import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import type { UserRole } from "@/lib/auth";

export function RoleGate({
  roles,
  children,
}: {
  roles?: UserRole[];
  children: ReactNode;
}) {
  const { data: session } = useSession();

  if (roles?.length && !roles.includes(session?.user.role as UserRole)) {
    return null;
  }

  return children;
}
