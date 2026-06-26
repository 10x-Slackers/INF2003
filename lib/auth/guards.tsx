import { redirect } from "next/navigation";
import { auth, type UserRole } from "@/lib/auth";

export async function requireRole(
  roles: readonly UserRole[],
  redirectTo: string,
) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  if (!roles.includes(session.user.role)) {
    return null;
  }

  return session;
}
