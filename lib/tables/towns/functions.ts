import { cache } from "react";
import { query, queryOne, paginatedQuery } from "@/lib/db";
import { listAmenities, type Amenity } from "@/lib/tables/amenities";
import { withDbError } from "@/lib/utils";
import type { Property } from "@/lib/tables/properties";
import {
  type Town,
  type TownAmenityListQuery,
  type TownRelationListQuery,
  townAmenityListQuerySchema,
  townRelationListQuerySchema,
} from "./types";
import { idSchema } from "../common";

export const listTowns = cache(async (): Promise<Town[]> => {
  return withDbError(async () => {
    return query<Town>("SELECT id, region, name FROM towns ORDER BY name");
  });
});

export async function getTownById(id: string): Promise<Town | null> {
  return withDbError(async () => {
    return queryOne<Town>(
      "SELECT id, region, name FROM towns WHERE id = ? LIMIT 1",
      [idSchema.parse(id)],
    );
  });
}

export async function listPropertiesByTown(
  input: TownRelationListQuery,
): Promise<{ data: Property[]; total: number }> {
  const data = townRelationListQuerySchema.parse(input);
  return paginatedQuery<Property>(
    `SELECT id, town_id, block, street_name, lease_commence_year FROM properties WHERE town_id = ? ORDER BY block, street_name LIMIT ? OFFSET ?`,
    "SELECT COUNT(*) AS total FROM properties WHERE town_id = ?",
    [data.townId],
    data.page,
    data.pageSize,
  );
}

export async function listAmenitiesByTown(
  input: TownAmenityListQuery,
): Promise<{ data: Amenity[]; total: number }> {
  const data = townAmenityListQuerySchema.parse(input);
  return listAmenities({
    town_id: data.townId,
    amenity_type_id: data.amenityTypeId,
    page: data.page,
    pageSize: data.pageSize,
  });
}

export async function listAllAmenitiesByTown(
  townId: string,
): Promise<Amenity[]> {
  return withDbError(async () => {
    return query<Amenity>(
      `SELECT id, town_id, amenity_type_id, name, street_name, postal_code, longitude, latitude
     FROM amenities WHERE town_id = ? ORDER BY name`,
      [idSchema.parse(townId)],
    );
  });
}
