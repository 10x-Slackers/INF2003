import { execute, query } from "@/lib/db";
import { handleDbError } from "@/lib/utils";
import {
  type PublicUser,
  type UpdateUser,
  updateUserSchema,
  userListQuerySchema,
} from "./types";
import { idSchema } from "../common";

const PUBLIC_USER_COLUMNS = "id, name, email, role, created_at, updated_at";

const isEmptyUpdate = (input: UpdateUser) =>
  Object.values(input).every((value) => value === undefined);

export async function listUsers(
  page: number,
  pageSize: number,
): Promise<{ data: PublicUser[]; total: number }> {
  try {
    const data = userListQuerySchema.parse({ page, pageSize });
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

export async function updateUser(
  id: string,
  input: UpdateUser,
): Promise<PublicUser | null> {
  try {
    const parsedId = idSchema.parse(id);
    if (isEmptyUpdate(input)) return getUserById(parsedId);

    const data = updateUserSchema.parse(input);
    const existing = await getUserById(parsedId);
    if (!existing) return null;

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

    await execute(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, [
      ...params,
      parsedId,
    ]);
    return getUserById(parsedId);
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
