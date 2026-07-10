import {
  execute,
  query,
  queryOne,
  deleteById,
  paginatedQuery,
  buildUpdateFields,
  executeReturning,
} from "@/lib/db";
import { getPropertiesWithLatestTransaction } from "@/lib/tables/properties";
import { withDbError } from "@/lib/utils";
import {
  createSavedPropertySchema,
  savedPropertyIdentitySchema,
  savedPropertyListQuerySchema,
  updateSavedPropertyParamsSchema,
  type CreateSavedProperty,
  type SavedProperty,
  type SavedPropertyDetail,
  type SavedPropertyIdentity,
  type SavedPropertyListQuery,
  type UpdateSavedPropertyParams,
} from "./types";
import { idSchema } from "../common";

async function attachProperty(
  row: SavedProperty,
): Promise<SavedPropertyDetail> {
  const [property] = await getPropertiesWithLatestTransaction([
    row.property_id,
  ]);
  return { ...row, property: property ?? null };
}

async function attachProperties(
  rows: SavedProperty[],
): Promise<SavedPropertyDetail[]> {
  const properties = await getPropertiesWithLatestTransaction(
    rows.map((row) => row.property_id),
  );
  const byId = new Map(properties.map((property) => [property.id, property]));
  return rows.map((row) => ({
    ...row,
    property: byId.get(row.property_id) ?? null,
  }));
}

export async function listSavedProperties(
  input: SavedPropertyListQuery,
): Promise<{ data: SavedPropertyDetail[]; total: number }> {
  return withDbError(async () => {
    const data = savedPropertyListQuerySchema.parse(input);
    const result = await paginatedQuery<SavedProperty>(
      `SELECT id, user_id, property_id, created_at FROM saved_properties WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      "SELECT COUNT(*) AS total FROM saved_properties WHERE user_id = ?",
      [data.userId],
      data.page,
      data.pageSize,
    );
    return { data: await attachProperties(result.data), total: result.total };
  });
}

export async function getSavedPropertyById(
  id: string,
): Promise<SavedPropertyDetail | null> {
  return withDbError(async () => {
    const row = await queryOne<SavedProperty>(
      "SELECT id, user_id, property_id, created_at FROM saved_properties WHERE id = ? LIMIT 1",
      [idSchema.parse(id)],
    );
    return row ? attachProperty(row) : null;
  });
}

export async function createSavedProperty(
  input: CreateSavedProperty,
): Promise<string> {
  return withDbError(async () => {
    const data = createSavedPropertySchema.parse(input);
    const result = await executeReturning<{ id: string }>(
      "INSERT INTO saved_properties (user_id, property_id) VALUES (?, ?) RETURNING id",
      [data.userId, data.propertyId],
    );
    return result[0].id;
  });
}

export async function updateSavedProperty(
  input: UpdateSavedPropertyParams,
): Promise<SavedPropertyDetail | null> {
  return withDbError(async () => {
    const { id, input: data } = updateSavedPropertyParamsSchema.parse(input);
    const { setClause, params } = buildUpdateFields({
      user_id: data.userId,
      property_id: data.propertyId,
    });

    const result = await execute(
      `UPDATE saved_properties SET ${setClause} WHERE id = ?`,
      [...params, id],
    );
    return result.affectedRows === 0 ? null : getSavedPropertyById(id);
  });
}

export async function deleteSavedProperty(id: string): Promise<boolean> {
  return deleteById("saved_properties", id);
}

export async function isPropertySaved(
  input: SavedPropertyIdentity,
): Promise<boolean> {
  return withDbError(async () => {
    const data = savedPropertyIdentitySchema.parse(input);
    const rows = await query<{ id: string }>(
      "SELECT id FROM saved_properties WHERE user_id = ? AND property_id = ? LIMIT 1",
      [data.userId, data.propertyId],
    );
    return rows.length > 0;
  });
}

export async function deleteSavedPropertyByUserAndProperty(
  input: SavedPropertyIdentity,
): Promise<boolean> {
  return withDbError(async () => {
    const data = savedPropertyIdentitySchema.parse(input);
    const result = await execute(
      "DELETE FROM saved_properties WHERE user_id = ? AND property_id = ?",
      [data.userId, data.propertyId],
    );
    return result.affectedRows > 0;
  });
}
