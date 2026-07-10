import { queryOne, addCondition, paginatedQuery } from "@/lib/db";
import { withDbError } from "@/lib/utils";
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
  const data = amenityListQuerySchema.parse(filters);
  const conditions: string[] = [];
  const params: unknown[] = [];
  addCondition(conditions, params, data.town_id, "town_id", "=");
  addCondition(
    conditions,
    params,
    data.amenity_type_id,
    "amenity_type_id",
    "=",
  );
  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return paginatedQuery<Amenity>(
    `SELECT ${AMENITY_COLUMNS} FROM amenities ${where} ORDER BY name LIMIT ? OFFSET ?`,
    `SELECT COUNT(*) AS total FROM amenities ${where}`,
    params,
    data.page,
    data.pageSize,
  );
}

export async function getAmenityById(id: string): Promise<Amenity | null> {
  return withDbError(async () => {
    return queryOne<Amenity>(
      `SELECT ${AMENITY_COLUMNS} FROM amenities WHERE id = ? LIMIT 1`,
      [idSchema.parse(id)],
    );
  });
}
