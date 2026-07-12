import { z } from "zod";
import type { PropertyWithLatestTransaction } from "@/lib/tables/properties";
import { idSchema } from "../common";

export const createSavedPropertySchema = z.object({
  userId: idSchema,
  propertyId: z.uuid(),
});
export const savedPropertyIdentitySchema = z.object({
  userId: idSchema,
  propertyId: idSchema,
});

type SavedProperty = {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
};

export type SavedPropertyDetail = SavedProperty & {
  property: PropertyWithLatestTransaction | null;
};

export type SavedPropertyRow = SavedProperty & {
  p_id: string | null;
  p_town_id: string | null;
  p_block: string | null;
  p_street_name: string | null;
  p_lease_commence_year: number | null;
  town_name: string | null;
  lt_id: string | null;
  lt_uploaded_by_user_id: string | null;
  lt_property_id: string | null;
  lt_flat_type_id: number | null;
  lt_flat_model_id: number | null;
  lt_storey_range_id: number | null;
  lt_floor_area_sqm: number | null;
  lt_flat_type_name: string | null;
  lt_flat_model_name: string | null;
  lt_min_storey: number | null;
  lt_max_storey: number | null;
  lt_resale_price: number | null;
  lt_transaction_month: string | null;
};

export type CreateSavedProperty = z.infer<typeof createSavedPropertySchema>;
export type SavedPropertyIdentity = z.infer<typeof savedPropertyIdentitySchema>;
