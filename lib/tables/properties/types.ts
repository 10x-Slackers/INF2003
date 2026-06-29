import { z } from "zod";
import type { Amenity } from "@/lib/tables/amenities/types";
import type { Town } from "@/lib/tables/towns/types";
import { paginationSchema, idSchema } from "../common";

export const propertyIdentitySchema = z.object({
  town_id: idSchema,
  block: z.string().trim().min(1).max(20),
  street_name: z.string().trim().min(1).max(255),
  lease_commence_year: z.coerce.number().int().min(1960).max(2100),
});
export const createPropertySchema = propertyIdentitySchema;
export const propertyLookupQuerySchema = propertyIdentitySchema;
export const propertyListQuerySchema = paginationSchema.extend({
  town_id: idSchema.optional(),
  flat_type_id: z.coerce.number().int().optional(),
  price_min: z.coerce.number().nonnegative().optional(),
  price_max: z.coerce.number().nonnegative().optional(),
});

export type Property = {
  id: string;
  town_id: string;
  block: string;
  street_name: string;
  lease_commence_year: number;
};

export type LatestTransactionSummary = {
  id: string;
  flat_type_id: number;
  flat_type: string;
  resale_price: number;
  transaction_month: string;
};

export type PropertyWithLatestTransaction = Property & {
  latest_transaction: LatestTransactionSummary | null;
};

export type PropertyDetail = Property & {
  town: Town | null;
  amenities: Amenity[];
};

export type CreateProperty = z.infer<typeof createPropertySchema>;
export type PropertyListQuery = z.infer<typeof propertyListQuerySchema>;
export type PropertyLookupQuery = z.infer<typeof propertyLookupQuerySchema>;
