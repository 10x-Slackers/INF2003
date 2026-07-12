import { cache } from "react";
import { query, queryOne } from "@/lib/db";
import { withDbError } from "@/lib/utils";
import { type Town, type TownAmenity } from "./types";
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
