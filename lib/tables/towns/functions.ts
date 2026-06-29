import { query } from "@/lib/db";
import { listAmenities } from "@/lib/tables/amenities/functions";
import { handleDbError } from "@/lib/utils";
import type { Amenity } from "@/lib/tables/amenities/types";
import type { Property } from "@/lib/tables/properties/types";
import {
  type Region,
  type Town,
  townAmenityListQuerySchema,
  townListQuerySchema,
  townRelationListQuerySchema,
} from "./types";
import { idSchema } from "../common";

export async function listTowns(
  region: Region | undefined,
  page: number,
  pageSize: number,
): Promise<{ data: Town[]; total: number }> {
  try {
    const data = townListQuerySchema.parse({ region, page, pageSize });
    const where = data.region ? "WHERE region = ?" : "";
    const params = data.region ? [data.region] : [];

    const [rows, countRows] = await Promise.all([
      query<Town>(
        `SELECT id, region, name FROM towns ${where} ORDER BY name LIMIT ? OFFSET ?`,
        [...params, data.pageSize, (data.page - 1) * data.pageSize],
      ),
      query<{ total: number }>(
        `SELECT COUNT(*) AS total FROM towns ${where}`,
        params,
      ),
    ]);

    return { data: rows, total: countRows[0].total };
  } catch (error) {
    return handleDbError(error);
  }
}

export async function getTownById(id: string): Promise<Town | null> {
  try {
    const rows = await query<Town>(
      "SELECT id, region, name FROM towns WHERE id = ? LIMIT 1",
      [idSchema.parse(id)],
    );
    return rows[0] ?? null;
  } catch (error) {
    return handleDbError(error);
  }
}

export async function listPropertiesByTown(
  townId: string,
  page: number,
  pageSize: number,
): Promise<{ data: Property[]; total: number }> {
  try {
    const data = townRelationListQuerySchema.parse({ townId, page, pageSize });
    const [rows, countRows] = await Promise.all([
      query<Property>(
        `SELECT id, town_id, block, street_name, lease_commence_year
       FROM properties WHERE town_id = ?
       ORDER BY block, street_name LIMIT ? OFFSET ?`,
        [data.townId, data.pageSize, (data.page - 1) * data.pageSize],
      ),
      query<{ total: number }>(
        "SELECT COUNT(*) AS total FROM properties WHERE town_id = ?",
        [data.townId],
      ),
    ]);

    return { data: rows, total: countRows[0].total };
  } catch (error) {
    return handleDbError(error);
  }
}

export async function listAmenitiesByTown(
  townId: string,
  amenityTypeId: number | undefined,
  page: number,
  pageSize: number,
): Promise<{ data: Amenity[]; total: number }> {
  try {
    const data = townAmenityListQuerySchema.parse({
      amenity_type_id: amenityTypeId,
      page,
      pageSize,
    });
    return listAmenities({
      town_id: idSchema.parse(townId),
      amenity_type_id: data.amenity_type_id,
      page: data.page,
      pageSize: data.pageSize,
    });
  } catch (error) {
    return handleDbError(error);
  }
}

export async function listAllAmenitiesByTown(
  townId: string,
): Promise<Amenity[]> {
  try {
    return query<Amenity>(
      `SELECT id, town_id, amenity_type_id, name, street_name, postal_code, longitude, latitude
     FROM amenities WHERE town_id = ? ORDER BY name`,
      [idSchema.parse(townId)],
    );
  } catch (error) {
    return handleDbError(error);
  }
}
