import { execute, query } from "@/lib/db";
import { HttpError } from "@/lib/api-response";
import type { Amenity, CreateAmenityPayload, UpdateAmenityPayload } from "@/lib/types";

type DbError = { code?: string };

function isForeignKeyViolation(err: unknown): boolean {
  return (err as DbError)?.code === "ER_NO_REFERENCED_ROW_2";
}

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

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows, countRows] = await Promise.all([
    query<Amenity>(
      `SELECT ${AMENITY_COLUMNS} FROM amenities ${where} ORDER BY name LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize],
    ),
    query<{ total: number }>(`SELECT COUNT(*) AS total FROM amenities ${where}`, params),
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

export async function createAmenity(payload: CreateAmenityPayload): Promise<Amenity> {
  let inserted: { id: string };
  try {
    [inserted] = await query<{ id: string }>(
      `INSERT INTO amenities (town_id, amenity_type_id, name, street_name, postal_code, longitude, latitude)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [
        payload.town_id,
        payload.amenity_type_id,
        payload.name,
        payload.street_name ?? null,
        payload.postal_code ?? null,
        payload.longitude ?? null,
        payload.latitude ?? null,
      ],
    );
  } catch (err) {
    if (isForeignKeyViolation(err)) {
      throw new HttpError(400, "Invalid town_id or amenity_type_id");
    }
    throw err;
  }

  const amenity = await getAmenityById(inserted.id);
  if (!amenity) {
    throw new HttpError(500, "Failed to read back created amenity");
  }
  return amenity;
}

export async function updateAmenity(
  id: string,
  payload: UpdateAmenityPayload,
): Promise<Amenity | null> {
  const existing = await getAmenityById(id);
  if (!existing) return null;

  const fields: string[] = [];
  const params: (string | number)[] = [];
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      params.push(value);
    }
  }

  try {
    await execute(`UPDATE amenities SET ${fields.join(", ")} WHERE id = ?`, [
      ...params,
      id,
    ]);
  } catch (err) {
    if (isForeignKeyViolation(err)) {
      throw new HttpError(400, "Invalid town_id or amenity_type_id");
    }
    throw err;
  }

  return getAmenityById(id);
}

export async function deleteAmenity(id: string): Promise<boolean> {
  const result = await execute("DELETE FROM amenities WHERE id = ?", [id]);
  return result.affectedRows > 0;
}
