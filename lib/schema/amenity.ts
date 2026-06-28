import { z } from "zod";
import { paginationSchema } from "@/lib/schema/pagination";

export const amenityListQuerySchema = paginationSchema.extend({
  town_id: z.uuid().optional(),
  amenity_type_id: z.coerce.number().int().positive().optional(),
});
