import { query } from "@/lib/db";
import { handleDbError } from "@/lib/utils";
import {
  amenityListQuerySchema,
  type Amenity,
  type AmenityListQuery,
} from "./types";
import { idSchema } from "../common";

const AMENITY_COLUMNS =
  "id, town_id, amenity_type_id, name, street_name, postal_code, longitude, latitude";

export async function listAmenities(
  filters: AmenityListQuery,
): Promise<{ data: Amenity[]; total: number }> {
  try {
    const data = amenityListQuerySchema.parse(filters);
    const { page, pageSize } = data;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (data.town_id !== undefined) {
      conditions.push("town_id = ?");
      params.push(data.town_id);
    }
    if (data.amenity_type_id !== undefined) {
      conditions.push("amenity_type_id = ?");
      params.push(data.amenity_type_id);
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
  } catch (error) {
    return handleDbError(error);
  }
}

export async function getAmenityById(id: string): Promise<Amenity | null> {
  try {
    const rows = await query<Amenity>(
      `SELECT ${AMENITY_COLUMNS} FROM amenities WHERE id = ? LIMIT 1`,
      [idSchema.parse(id)],
    );
    return rows[0] ?? null;
  } catch (error) {
    return handleDbError(error);
  }
}
