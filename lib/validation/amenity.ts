import { z } from "zod";

export const createAmenitySchema = z.object({
  town_id: z.string().uuid(),
  amenity_type_id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(255),
  street_name: z.string().trim().min(1).max(255).optional(),
  postal_code: z.string().trim().min(1).max(10).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
});

export const updateAmenitySchema = z
  .object({
    town_id: z.string().uuid().optional(),
    amenity_type_id: z.coerce.number().int().positive().optional(),
    name: z.string().trim().min(1).max(255).optional(),
    street_name: z.string().trim().min(1).max(255).optional(),
    postal_code: z.string().trim().min(1).max(10).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

export const amenityListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  town_id: z.string().uuid().optional(),
  amenity_type_id: z.coerce.number().int().positive().optional(),
});
