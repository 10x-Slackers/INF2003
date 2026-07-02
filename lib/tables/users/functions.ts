import { execute, query } from "@/lib/db";
import { handleDbError } from "@/lib/db-errors";
import {
  type CreateUser,
  type PublicUser,
  type UpdateUser,
  type UpdateUserParams,
  type UserListQuery,
  createUserSchema,
  updateUserParamsSchema,
  updateUserSchema,
  userListQuerySchema,
} from "./types";
import { idSchema } from "../common";

const PUBLIC_USER_COLUMNS = "id, name, email, role, created_at, updated_at";

const isEmptyUpdate = (input: UpdateUser) =>
  Object.values(input).every((value) => value === undefined);

export async function listUsers(
  input: UserListQuery,
): Promise<{ data: PublicUser[]; total: number }> {
  try {
    const data = userListQuerySchema.parse(input);
    const [rows, countRows] = await Promise.all([
      query<PublicUser>(
        `SELECT ${PUBLIC_USER_COLUMNS} FROM users ORDER BY created_at LIMIT ? OFFSET ?`,
        [data.pageSize, (data.page - 1) * data.pageSize],
      ),
      query<{ total: number }>("SELECT COUNT(*) AS total FROM users"),
    ]);

    return { data: rows, total: countRows[0].total };
  } catch (error) {
    return handleDbError(error);
  }
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  try {
    const rows = await query<PublicUser>(
      `SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = ? LIMIT 1`,
      [idSchema.parse(id)],
    );
    return rows[0] ?? null;
  } catch (error) {
    return handleDbError(error);
  }
}

export async function createUser(input: CreateUser): Promise<void> {
  try {
    const data = createUserSchema.parse(input);
    // creating user do not have to return id, as user are required to sign in after signing up
    await execute(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [data.name, data.email, data.password_hash, data.role ?? "USER"],
    );
  } catch (error) {
    return handleDbError(error);
  }
}

export async function updateUser(
  input: UpdateUserParams,
): Promise<PublicUser | null> {
  try {
    const parsed = updateUserParamsSchema.parse(input);
    if (isEmptyUpdate(parsed.input)) return getUserById(parsed.id);

    const data = updateUserSchema.parse(parsed.input);

    const fields: string[] = [];
    const params: string[] = [];

    if (data.name !== undefined) {
      fields.push("name = ?");
      params.push(data.name);
    }
    if (data.email !== undefined) {
      fields.push("email = ?");
      params.push(data.email);
    }
    if (data.role !== undefined) {
      fields.push("role = ?");
      params.push(data.role);
    }

    const result = await execute(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      [...params, parsed.id],
    );
    if (result.affectedRows === 0) return null;
    return getUserById(parsed.id);
  } catch (error) {
    return handleDbError(error);
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    const result = await execute("DELETE FROM users WHERE id = ?", [
      idSchema.parse(id),
    ]);
    return result.affectedRows > 0;
  } catch (error) {
    return handleDbError(error);
  }
}
