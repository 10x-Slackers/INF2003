"use server";

import { assertSignedIn, hashPassword, verifyUserPassword } from "@/lib/auth";
import { updateUser } from "@/lib/tables/users";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";

export type UpdateProfileInput = {
  name: string;
  email: string;
  currentPassword: string;
  newPassword?: string;
};

export async function updateProfileAction(input: UpdateProfileInput) {
  const session = await assertSignedIn();

  const ok = await verifyUserPassword(session.user.id, input.currentPassword);
  if (!ok) throw new Error("Incorrect password");

  const password_hash = input.newPassword
    ? await hashPassword(input.newPassword)
    : undefined;

  await updateUser({
    id: session.user.id,
    input: {
      name: input.name,
      email: input.email,
      ...(password_hash ? { password_hash } : {}),
    },
  });
  revalidatePath(ROUTES.PROFILE);
}
