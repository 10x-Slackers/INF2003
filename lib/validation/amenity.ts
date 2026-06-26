import { z } from "zod";

export const amenityListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  town_id: z.string().uuid().optional(),
  amenity_type_id: z.coerce.number().int().positive().optional(),
});
