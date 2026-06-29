import { execute, query } from "@/lib/db";
import { handleMariaDBError } from "@/lib/utils";
import type { PublicUser, UpdateUserPayload } from "@/lib/types";

const PUBLIC_USER_COLUMNS = "id, name, email, role, created_at, updated_at";

export async function listUsers(
  page: number,
  pageSize: number,
): Promise<{ data: PublicUser[]; total: number }> {
  const [rows, countRows] = await Promise.all([
    query<PublicUser>(
      `SELECT ${PUBLIC_USER_COLUMNS} FROM users ORDER BY created_at LIMIT ? OFFSET ?`,
      [pageSize, (page - 1) * pageSize],
    ),
    query<{ total: number }>("SELECT COUNT(*) AS total FROM users"),
  ]);

  return { data: rows, total: countRows[0].total };
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  const rows = await query<PublicUser>(
    `SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<PublicUser | null> {
  const existing = await getUserById(id);
  if (!existing) return null;

  const fields: string[] = [];
  const params: string[] = [];
  if (payload.name !== undefined) {
    fields.push("name = ?");
    params.push(payload.name);
  }
  if (payload.email !== undefined) {
    fields.push("email = ?");
    params.push(payload.email);
  }
  if (payload.role !== undefined) {
    fields.push("role = ?");
    params.push(payload.role);
  }

  if (fields.length === 0) return existing;

  try {
    await execute(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, [
      ...params,
      id,
    ]);
  } catch (err) {
    handleMariaDBError(err);
  }

  return getUserById(id);
}

export async function deleteUser(id: string): Promise<boolean> {
  const result = await execute("DELETE FROM users WHERE id = ?", [id]);
  return result.affectedRows > 0;
}
