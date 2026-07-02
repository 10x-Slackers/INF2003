import { execute, query } from "@/lib/db";
import { getPropertiesWithLatestTransaction } from "@/lib/tables/properties/functions";
import { handleDbError } from "@/lib/db-errors";
import {
  savedPropertyIdentitySchema,
  savedPropertyListQuerySchema,
  updateSavedPropertyParamsSchema,
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
  try {
    const data = savedPropertyListQuerySchema.parse(input);
    const [rows, countRows] = await Promise.all([
      query<SavedProperty>(
        `SELECT id, user_id, property_id, created_at FROM saved_properties
       WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [data.userId, data.pageSize, (data.page - 1) * data.pageSize],
      ),
      query<{ total: number }>(
        "SELECT COUNT(*) AS total FROM saved_properties WHERE user_id = ?",
        [data.userId],
      ),
    ]);

    return { data: await attachProperties(rows), total: countRows[0].total };
  } catch (error) {
    return handleDbError(error);
  }
}

export async function getSavedPropertyById(
  id: string,
): Promise<SavedPropertyDetail | null> {
  try {
    const rows = await query<SavedProperty>(
      "SELECT id, user_id, property_id, created_at FROM saved_properties WHERE id = ? LIMIT 1",
      [idSchema.parse(id)],
    );
    const row = rows[0];
    return row ? attachProperty(row) : null;
  } catch (error) {
    return handleDbError(error);
  }
}

export async function updateSavedProperty(
  input: UpdateSavedPropertyParams,
): Promise<SavedPropertyDetail | null> {
  try {
    const { id, input: data } = updateSavedPropertyParamsSchema.parse(input);
    const fields: string[] = [];
    const params: string[] = [];

    if (data.userId !== undefined) {
      fields.push("user_id = ?");
      params.push(data.userId);
    }
    if (data.propertyId !== undefined) {
      fields.push("property_id = ?");
      params.push(data.propertyId);
    }

    const result = await execute(
      `UPDATE saved_properties SET ${fields.join(", ")} WHERE id = ?`,
      [...params, id],
    );
    return result.affectedRows === 0 ? null : getSavedPropertyById(id);
  } catch (error) {
    return handleDbError(error);
  }
}

export async function isPropertySaved(
  input: SavedPropertyIdentity,
): Promise<boolean> {
  try {
    const data = savedPropertyIdentitySchema.parse(input);
    const rows = await query<{ id: string }>(
      "SELECT id FROM saved_properties WHERE user_id = ? AND property_id = ? LIMIT 1",
      [data.userId, data.propertyId],
    );
    return rows.length > 0;
  } catch (error) {
    return handleDbError(error);
  }
}
