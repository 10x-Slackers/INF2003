import { z } from "zod";
import { paginationSchema } from "@/lib/schema/pagination";

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
