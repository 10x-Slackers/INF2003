import { query } from "@/lib/db";
import type { Amenity } from "@/lib/types";

const AMENITY_COLUMNS =
  "id, town_id, amenity_type_id, name, street_name, postal_code, longitude, latitude";

export async function listAmenities(filters: {
  town_id?: string;
  amenity_type_id?: number;
  page: number;
  pageSize: number;
}): Promise<{ data: Amenity[]; total: number }> {
  const { page, pageSize } = filters;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.town_id !== undefined) {
    conditions.push("town_id = ?");
    params.push(filters.town_id);
  }
  if (filters.amenity_type_id !== undefined) {
    conditions.push("amenity_type_id = ?");
    params.push(filters.amenity_type_id);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows, countRows] = await Promise.all([
    query<Amenity>(
      `SELECT ${AMENITY_COLUMNS} FROM amenities ${where} ORDER BY name LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize],
    ),
    query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM amenities ${where}`,
      params,
    ),
  ]);

  return { data: rows, total: countRows[0].total };
}

export async function getAmenityById(id: string): Promise<Amenity | null> {
  const rows = await query<Amenity>(
    `SELECT ${AMENITY_COLUMNS} FROM amenities WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}
