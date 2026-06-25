import { execute, query } from "@/lib/db";
import { HttpError } from "@/lib/api-response";
import type {
  Amenity,
  CreateTownPayload,
  Property,
  Region,
  Town,
  UpdateTownPayload,
} from "@/lib/types";

type DbError = { code?: string; errno?: number };

function isDuplicateKeyError(err: unknown): boolean {
  return (err as DbError)?.code === "ER_DUP_ENTRY";
}

function isForeignKeyConstraintError(err: unknown): boolean {
  return (err as DbError)?.code === "ER_ROW_IS_REFERENCED_2";
}

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
  const conditions = ["town_id = ?"];
  const params: unknown[] = [townId];
  if (amenityTypeId !== undefined) {
    conditions.push("amenity_type_id = ?");
    params.push(amenityTypeId);
  }
  const where = `WHERE ${conditions.join(" AND ")}`;

  const [rows, countRows] = await Promise.all([
    query<Amenity>(
      `SELECT id, town_id, amenity_type_id, name, street_name, postal_code, longitude, latitude
       FROM amenities ${where}
       ORDER BY name LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize],
    ),
    query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM amenities ${where}`,
      params,
    ),
  ]);

  return { data: rows, total: countRows[0].total };
}

export async function listAllAmenitiesByTown(townId: string): Promise<Amenity[]> {
  return query<Amenity>(
    `SELECT id, town_id, amenity_type_id, name, street_name, postal_code, longitude, latitude
     FROM amenities WHERE town_id = ? ORDER BY name`,
    [townId],
  );
}

export async function createTown(payload: CreateTownPayload): Promise<Town> {
  try {
    await execute("INSERT INTO towns (region, name) VALUES (?, ?)", [
      payload.region,
      payload.name,
    ]);
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new HttpError(409, "A town with this name already exists");
    }
    throw err;
  }

  const town = await getTownByName(payload.name);
  if (!town) {
    throw new HttpError(500, "Failed to read back created town");
  }
  return town;
}

async function getTownByName(name: string): Promise<Town | null> {
  const rows = await query<Town>(
    "SELECT id, region, name FROM towns WHERE name = ? LIMIT 1",
    [name],
  );
  return rows[0] ?? null;
}

export async function updateTown(
  id: string,
  payload: UpdateTownPayload,
): Promise<Town | null> {
  const existing = await getTownById(id);
  if (!existing) return null;

  const fields: string[] = [];
  const params: string[] = [];
  if (payload.name !== undefined) {
    fields.push("name = ?");
    params.push(payload.name);
  }
  if (payload.region !== undefined) {
    fields.push("region = ?");
    params.push(payload.region);
  }

  try {
    await execute(`UPDATE towns SET ${fields.join(", ")} WHERE id = ?`, [
      ...params,
      id,
    ]);
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new HttpError(409, "A town with this name already exists");
    }
    throw err;
  }

  return getTownById(id);
}

export async function deleteTown(id: string): Promise<boolean> {
  try {
    const result = await execute("DELETE FROM towns WHERE id = ?", [id]);
    return result.affectedRows > 0;
  } catch (err) {
    if (isForeignKeyConstraintError(err)) {
      throw new HttpError(
        409,
        "Town has properties or amenities and cannot be deleted",
      );
    }
    throw err;
  }
}
