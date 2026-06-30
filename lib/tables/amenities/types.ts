import { z } from "zod";
import { paginationSchema, idSchema } from "../common";

export const amenityListQuerySchema = paginationSchema.extend({
  town_id: idSchema.optional(),
  amenity_type_id: z.coerce.number().int().positive().optional(),
});

export type Amenity = {
  id: string;
  town_id: string;
  amenity_type_id: number;
  name: string;
  street_name: string | null;
  postal_code: string | null;
  longitude: number | null;
  latitude: number | null;
};

export type AmenityListQuery = z.infer<typeof amenityListQuerySchema>;
