import { z } from "zod";
import { paginationSchema, idSchema } from "../common";

export const regionSchema = z.enum([
  "NORTH REGION",
  "NORTH-EAST REGION",
  "EAST REGION",
  "WEST REGION",
  "CENTRAL REGION",
]);
export const townListQuerySchema = paginationSchema.extend({
  region: regionSchema.optional(),
});
export const townAmenityListQuerySchema = paginationSchema.extend({
  amenity_type_id: z.coerce.number().int().positive().optional(),
});
export const townRelationListQuerySchema = paginationSchema.extend({
  townId: idSchema,
});

export type Region = z.infer<typeof regionSchema>;

export type Town = {
  id: string;
  region: Region;
  name: string;
};

export type TownListQuery = z.infer<typeof townListQuerySchema>;
export type TownAmenityListQuery = z.infer<typeof townAmenityListQuerySchema>;
export type TownRelationListQuery = z.infer<typeof townRelationListQuerySchema>;
