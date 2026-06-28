import { z } from "zod";
import { paginationSchema } from "@/lib/schema/pagination";

const propertyIdentitySchema = z.object({
  town_id: z.uuid(),
  block: z.string().trim().min(1).max(20),
  street_name: z.string().trim().min(1).max(255),
  lease_commence_year: z.coerce.number().int().min(1960).max(2100),
});

export const createPropertySchema = propertyIdentitySchema;

export const propertyLookupQuerySchema = propertyIdentitySchema;

export const propertyListQuerySchema = paginationSchema.extend({
  town_id: z.uuid().optional(),
  flat_type: z.string().trim().min(1).optional(),
  price_min: z.coerce.number().nonnegative().optional(),
  price_max: z.coerce.number().nonnegative().optional(),
});
