import { z } from "zod";
import { paginationSchema, idSchema } from "../common";

export const regionSchema = z.enum([
  "NORTH REGION",
  "NORTH-EAST REGION",
  "EAST REGION",
  "WEST REGION",
  "CENTRAL REGION",
]);
export const townRelationListQuerySchema = paginationSchema.extend({
  townId: idSchema,
});

export type Region = z.infer<typeof regionSchema>;
export type TownRelationListQuery = z.infer<typeof townRelationListQuerySchema>;

export type Town = {
  id: string;
  region: Region;
  name: string;
};

export type TownAmenity = {
  id: string;
  town_id: string;
  amenity_type_id: number;
  name: string;
  street_name: string | null;
  postal_code: string | null;
  longitude: number | null;
  latitude: number | null;
  amenity_type_name: string;
};
