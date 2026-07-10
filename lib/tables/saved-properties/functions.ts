import { execute, query, executeReturning } from "@/lib/db";
import { getPropertiesWithLatestTransaction } from "@/lib/tables/properties";
import { withDbError } from "@/lib/utils";
import {
  createSavedPropertySchema,
  savedPropertyIdentitySchema,
  type CreateSavedProperty,
  type SavedProperty,
  type SavedPropertyDetail,
  type SavedPropertyIdentity,
} from "./types";
import { idSchema } from "../common";

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
  userId: string,
): Promise<SavedPropertyDetail[]> {
  return withDbError(async () => {
    const rows = await query<SavedProperty>(
      "SELECT id, user_id, property_id, created_at FROM saved_properties WHERE user_id = ? ORDER BY created_at DESC",
      [idSchema.parse(userId)],
    );
    return attachProperties(rows);
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
