import { z } from "zod";

export const createPropertySchema = z.object({
  town_id: z.string().uuid(),
  block: z.string().trim().min(1).max(20),
  street_name: z.string().trim().min(1).max(255),
  lease_commence_year: z.coerce.number().int().min(1960).max(2100),
});

export const propertyListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  town_id: z.string().uuid().optional(),
  flat_type: z.string().trim().min(1).optional(),
  price_min: z.coerce.number().nonnegative().optional(),
  price_max: z.coerce.number().nonnegative().optional(),
});

export const propertyLookupQuerySchema = z.object({
  town_id: z.string().uuid(),
  block: z.string().trim().min(1).max(20),
  street_name: z.string().trim().min(1).max(255),
  lease_commence_year: z.coerce.number().int().min(1960).max(2100),
});
