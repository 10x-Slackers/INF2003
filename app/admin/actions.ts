"use server";

import { assertAdmin, hashPassword } from "@/lib/auth";
import { forceGenerateStatisticsExceptProperties } from "@/lib/services/statistics";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
  type PublicUser,
  type UserRole,
} from "@/lib/tables/users";

export async function fetchUsers(input: {
  page: number;
  pageSize: number;
  search?: string;
}): Promise<{ data: PublicUser[]; total: number }> {
  await assertAdmin();
  return listUsers(input);
}

export async function createUserAction(input: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}): Promise<void> {
  await assertAdmin();
  const password_hash = await hashPassword(input.password);
  await createUser({
    name: input.name,
    email: input.email,
    password_hash,
    role: input.role,
  });
}

export async function updateUserAction(input: {
  id: string;
  name?: string;
  email?: string;
  role?: UserRole;
}): Promise<void> {
  await assertAdmin();
  await updateUser({
    id: input.id,
    input: { name: input.name, email: input.email, role: input.role },
  });
}

export async function deleteUserAction(id: string): Promise<void> {
  await assertAdmin();
  await deleteUser(id);
}

export async function forceGenerateStatisticsAction(): Promise<{
  statistics: number;
  towns: number;
}> {
  await assertAdmin();
  return forceGenerateStatisticsExceptProperties();
}
