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
export const createTownSchema = z.object({
  region: regionSchema,
  name: z.string().trim().min(1).max(100),
});
export const townRelationListQuerySchema = paginationSchema.extend({
  townId: idSchema,
});
export const townAmenityListQuerySchema = townRelationListQuerySchema.extend({
  amenityTypeId: z.coerce.number().int().positive().optional(),
});

export type Region = z.infer<typeof regionSchema>;
export type TownListQuery = z.infer<typeof townListQuerySchema>;
export type TownRelationListQuery = z.infer<typeof townRelationListQuerySchema>;
export type TownAmenityListQuery = z.infer<typeof townAmenityListQuerySchema>;

export type Town = {
  id: string;
  region: Region;
  name: string;
};
