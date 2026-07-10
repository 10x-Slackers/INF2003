import {
  execute,
  queryOne,
  isEmptyUpdate,
  buildUpdateFields,
  deleteById,
  paginatedQuery,
} from "@/lib/db";
import { withDbError } from "@/lib/utils";
import {
  type CreateUser,
  type PublicUser,
  type UpdateUserParams,
  type User,
  type UserListQuery,
  createUserSchema,
  updateUserParamsSchema,
  updateUserSchema,
  userListQuerySchema,
} from "./types";
import { idSchema } from "../common";

const PUBLIC_USER_COLUMNS = "id, name, email, role, created_at, updated_at";

export async function listUsers(
  input: UserListQuery,
): Promise<{ data: PublicUser[]; total: number }> {
  const data = userListQuerySchema.parse(input);
  const whereClause = data.search ? "WHERE (name LIKE ? OR email LIKE ?)" : "";
  const whereParams = data.search
    ? [`%${data.search}%`, `%${data.search}%`]
    : [];
  return paginatedQuery<PublicUser>(
    `SELECT ${PUBLIC_USER_COLUMNS} FROM users ${whereClause} ORDER BY created_at LIMIT ? OFFSET ?`,
    `SELECT COUNT(*) AS total FROM users ${whereClause}`,
    whereParams,
    data.page,
    data.pageSize,
  );
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  return withDbError(async () => {
    return queryOne<PublicUser>(
      `SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = ? LIMIT 1`,
      [idSchema.parse(id)],
    );
  });
}

export async function getUserWithPasswordById(
  id: string,
): Promise<User | null> {
  return withDbError(async () => {
    return queryOne<User>(
      "SELECT id, name, email, password_hash, role, created_at, updated_at FROM users WHERE id = ? LIMIT 1",
      [idSchema.parse(id)],
    );
  });
}

export async function createUser(input: CreateUser): Promise<void> {
  return withDbError(async () => {
    const data = createUserSchema.parse(input);
    // creating user do not have to return id, as user are required to sign in after signing up
    await execute(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [data.name, data.email, data.password_hash, data.role ?? "USER"],
    );
  });
}

export async function updateUser(
  input: UpdateUserParams,
): Promise<PublicUser | null> {
  return withDbError(async () => {
    const parsed = updateUserParamsSchema.parse(input);
    if (isEmptyUpdate(parsed.input)) return getUserById(parsed.id);

    const data = updateUserSchema.parse(parsed.input);
    const { setClause, params } = buildUpdateFields(data);
    const result = await execute(`UPDATE users SET ${setClause} WHERE id = ?`, [
      ...params,
      parsed.id,
    ]);
    if (result.affectedRows === 0) return null;
    return getUserById(parsed.id);
  });
}

export async function deleteUser(id: string): Promise<boolean> {
  return deleteById("users", id);
}
