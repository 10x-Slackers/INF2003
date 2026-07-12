import { cache } from "react";
import { query, queryOne, paginatedQuery } from "@/lib/db";
import { withDbError } from "@/lib/utils";
import type { Property } from "@/lib/tables/properties";
import {
  type Town,
  type TownRelationListQuery,
  type TownAmenity,
  townRelationListQuerySchema,
} from "./types";
import { idSchema } from "../common";

export const listTowns = cache(async (): Promise<Town[]> => {
  return withDbError(async () => {
    return query<Town>("SELECT id, region, name FROM towns ORDER BY name");
  });
});

export const getTownById = cache(async (id: string): Promise<Town | null> => {
  return withDbError(async () => {
    return queryOne<Town>(
      "SELECT id, region, name FROM towns WHERE id = ? LIMIT 1",
      [idSchema.parse(id)],
    );
  });
});

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

export async function listAllAmenitiesByTown(
  townId: string,
): Promise<TownAmenity[]> {
  return withDbError(async () => {
    return query<TownAmenity>(
      `SELECT a.id, a.town_id, a.amenity_type_id, a.name, a.street_name, a.postal_code, a.longitude, a.latitude, at.name AS amenity_type_name
     FROM amenities a JOIN amenity_types at ON at.id = a.amenity_type_id
     WHERE a.town_id = ? ORDER BY at.name, a.name`,
      [idSchema.parse(townId)],
    );
  });
}
