import { query } from "@/lib/db";
import { listAmenities } from "@/lib/domain/amenities";
import type { Amenity, Property, Region, Town } from "@/lib/types";

export async function listTowns(
  region: Region | undefined,
  page: number,
  pageSize: number,
): Promise<{ data: Town[]; total: number }> {
  const where = region ? "WHERE region = ?" : "";
  const params = region ? [region] : [];

  const [rows, countRows] = await Promise.all([
    query<Town>(
      `SELECT id, region, name FROM towns ${where} ORDER BY name LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize],
    ),
    query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM towns ${where}`,
      params,
    ),
  ]);

  return { data: rows, total: countRows[0].total };
}

export async function getTownById(id: string): Promise<Town | null> {
  const rows = await query<Town>(
    "SELECT id, region, name FROM towns WHERE id = ? LIMIT 1",
    [id],
  );
  return rows[0] ?? null;
}

export async function listPropertiesByTown(
  townId: string,
  page: number,
  pageSize: number,
): Promise<{ data: Property[]; total: number }> {
  const [rows, countRows] = await Promise.all([
    query<Property>(
      `SELECT id, town_id, block, street_name, lease_commence_year
       FROM properties WHERE town_id = ?
       ORDER BY block, street_name LIMIT ? OFFSET ?`,
      [townId, pageSize, (page - 1) * pageSize],
    ),
    query<{ total: number }>(
      "SELECT COUNT(*) AS total FROM properties WHERE town_id = ?",
      [townId],
    ),
  ]);

  return { data: rows, total: countRows[0].total };
}

export async function listAmenitiesByTown(
  townId: string,
  amenityTypeId: number | undefined,
  page: number,
  pageSize: number,
): Promise<{ data: Amenity[]; total: number }> {
  return listAmenities({
    town_id: townId,
    amenity_type_id: amenityTypeId,
    page,
    pageSize,
  });
}

// Unpaginated: every amenity in the town (used to build property detail).
export async function listAllAmenitiesByTown(
  townId: string,
): Promise<Amenity[]> {
  return query<Amenity>(
    `SELECT id, town_id, amenity_type_id, name, street_name, postal_code, longitude, latitude
     FROM amenities WHERE town_id = ? ORDER BY name`,
    [townId],
  );
}
