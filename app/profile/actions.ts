"use server";

import { assertSignedIn, hashPassword, verifyUserPassword } from "@/lib/auth";
import { updateUser } from "@/lib/tables/users";

export type UpdateProfileInput = {
  name: string;
  email: string;
  currentPassword: string;
  newPassword?: string;
};

export type UpdateProfileResult = { error?: "Incorrect password" };

export async function updateProfileAction(
  input: UpdateProfileInput,
): Promise<UpdateProfileResult> {
  const session = await assertSignedIn();

  const ok = await verifyUserPassword(session.user.id, input.currentPassword);
  if (!ok) return { error: "Incorrect password" };

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
  return {};
}
