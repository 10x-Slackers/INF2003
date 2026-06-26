import { execute, query } from "@/lib/db";
import { HttpError } from "@/lib/api-response";
import { isDuplicateKeyError, isMissingReferenceError } from "@/lib/db-errors";
import { getPropertiesWithLatestTransaction } from "@/lib/properties";
import type { SavedProperty, SavedPropertyDetail } from "@/lib/types";

async function attachProperty(row: SavedProperty): Promise<SavedPropertyDetail> {
  const [property] = await getPropertiesWithLatestTransaction([row.property_id]);
  return { ...row, property: property ?? null };
}

async function attachProperties(
  rows: SavedProperty[],
): Promise<SavedPropertyDetail[]> {
  const properties = await getPropertiesWithLatestTransaction(
    rows.map((row) => row.property_id),
  );
  const byId = new Map(properties.map((property) => [property.id, property]));
  return rows.map((row) => ({ ...row, property: byId.get(row.property_id) ?? null }));
}

export async function listSavedProperties(
  userId: string,
  page: number,
  pageSize: number,
): Promise<{ data: SavedPropertyDetail[]; total: number }> {
  const [rows, countRows] = await Promise.all([
    query<SavedProperty>(
      `SELECT id, user_id, property_id, created_at FROM saved_properties
       WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [userId, pageSize, (page - 1) * pageSize],
    ),
    query<{ total: number }>(
      "SELECT COUNT(*) AS total FROM saved_properties WHERE user_id = ?",
      [userId],
    ),
  ]);

  return { data: await attachProperties(rows), total: countRows[0].total };
}

export async function getSavedPropertyById(
  id: string,
): Promise<SavedPropertyDetail | null> {
  const rows = await query<SavedProperty>(
    "SELECT id, user_id, property_id, created_at FROM saved_properties WHERE id = ? LIMIT 1",
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  return attachProperty(row);
}

export async function createSavedProperty(
  userId: string,
  propertyId: string,
): Promise<SavedPropertyDetail> {
  let inserted: { id: string };
  try {
    [inserted] = await query<{ id: string }>(
      "INSERT INTO saved_properties (user_id, property_id) VALUES (?, ?) RETURNING id",
      [userId, propertyId],
    );
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new HttpError(409, "Property already saved");
    }
    if (isMissingReferenceError(err)) {
      throw new HttpError(400, "Invalid property_id");
    }
    throw err;
  }

  const saved = await getSavedPropertyById(inserted.id);
  if (!saved) {
    throw new HttpError(500, "Failed to read back saved property");
  }
  return saved;
}

export async function deleteSavedProperty(id: string): Promise<boolean> {
  const result = await execute("DELETE FROM saved_properties WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

export async function isPropertySaved(
  userId: string,
  propertyId: string,
): Promise<boolean> {
  const rows = await query<{ id: string }>(
    "SELECT id FROM saved_properties WHERE user_id = ? AND property_id = ? LIMIT 1",
    [userId, propertyId],
  );
  return rows.length > 0;
}
