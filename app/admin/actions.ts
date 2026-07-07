"use server";

import bcrypt from "bcryptjs";
import { assertAdmin } from "@/lib/auth";
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
  const password_hash = await bcrypt.hash(input.password, 10);
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
