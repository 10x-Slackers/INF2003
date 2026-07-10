import { z } from "zod";
import type { Amenity } from "@/lib/tables/amenities";
import type { Town } from "@/lib/tables/towns";
import { paginationSchema, idSchema } from "../common";

export const propertyIdentitySchema = z.object({
  town_id: idSchema,
  block: z.string().trim().min(1).max(20),
  street_name: z.string().trim().min(1).max(255),
  lease_commence_year: z.coerce.number().int().min(1960).max(2100),
});
export const createPropertySchema = propertyIdentitySchema;
export const updatePropertySchema = propertyIdentitySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });
export const updatePropertyParamsSchema = z.object({
  id: idSchema,
  input: updatePropertySchema.or(z.object({}).strict()),
});
export const propertyListQuerySchema = paginationSchema.extend({
  town_ids: z.array(idSchema).optional(),
  street_name: z.string().trim().min(1).optional(),
  block: z.string().trim().min(1).optional(),
  lease_commence_year: z.coerce.number().int().min(1960).max(2100).optional(),
  flat_type_ids: z.array(z.coerce.number().int().positive()).optional(),
  flat_model_ids: z.array(z.coerce.number().int().positive()).optional(),
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
  uploaded_by_user_id: string | null;
  property_id: string;
  flat_type_id: number;
  flat_model_id: number;
  storey_range_id: number;
  floor_area_sqm: number;
  flat_type: string;
  flat_model: string;
  min_storey: number;
  max_storey: number;
  resale_price: number;
  transaction_month: string;
};

export type PropertyWithLatestTransaction = Property & {
  town_name: string;
  latest_transaction: LatestTransactionSummary | null;
};

export type PropertyDetail = Property & {
  town: Town | null;
  amenities: Amenity[];
};

export type CreateProperty = z.infer<typeof createPropertySchema>;
export type UpdateProperty = z.infer<typeof updatePropertySchema>;
export type UpdatePropertyParams = z.infer<typeof updatePropertyParamsSchema>;
export type PropertyListQuery = z.infer<typeof propertyListQuerySchema>;

export type PropertySearchResult = {
  id: string;
  block: string;
  street_name: string;
  town_id: string;
  town_name: string;
};
