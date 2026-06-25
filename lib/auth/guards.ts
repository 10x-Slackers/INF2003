import { auth, type UserRole } from "@/lib/auth";
import { HttpError } from "@/lib/api-response";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new HttpError(401, "Authentication required");
  }
  return session.user;
}

export async function requireRole(...roles: UserRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new HttpError(403, "Forbidden");
  }
  return user;
}
