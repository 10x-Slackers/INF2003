import { query } from "@/lib/db";
import { listAmenities } from "@/lib/tables/amenities/functions";
import { handleDbError } from "@/lib/utils";
import type { Amenity } from "@/lib/tables/amenities/types";
import type { Property } from "@/lib/tables/properties/types";
import {
  type Town,
  type TownAmenityListQuery,
  type TownRelationListQuery,
  townAmenityListQuerySchema,
  townRelationListQuerySchema,
} from "./types";
import { idSchema } from "../common";

export async function listTowns(): Promise<Town[]> {
  try {
    return await query<Town>(
      "SELECT id, region, name FROM towns ORDER BY name",
    );
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
  input: TownRelationListQuery,
): Promise<{ data: Property[]; total: number }> {
  try {
    const data = townRelationListQuerySchema.parse(input);
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
  input: TownAmenityListQuery,
): Promise<{ data: Amenity[]; total: number }> {
  try {
    const data = townAmenityListQuerySchema.parse(input);
    return listAmenities({
      town_id: data.townId,
      amenity_type_id: data.amenityTypeId,
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
    return await query<Amenity>(
      `SELECT id, town_id, amenity_type_id, name, street_name, postal_code, longitude, latitude
     FROM amenities WHERE town_id = ? ORDER BY name`,
      [idSchema.parse(townId)],
    );
  } catch (error) {
    return handleDbError(error);
  }
}
