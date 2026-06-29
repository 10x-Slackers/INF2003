import { z } from "zod";
import type { PropertyWithLatestTransaction } from "@/lib/tables/properties/types";
import { paginationSchema, idSchema } from "../common";

export const createSavedPropertySchema = z.object({
  property_id: z.uuid(),
});
export const savedPropertyListQuerySchema = paginationSchema.extend({
  userId: idSchema,
});
export const savedPropertyIdentitySchema = z.object({
  userId: idSchema,
  propertyId: idSchema,
});

export type SavedProperty = {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
};

export type SavedPropertyDetail = SavedProperty & {
  property: PropertyWithLatestTransaction | null;
};

export type CreateSavedProperty = z.infer<typeof createSavedPropertySchema>;
export type SavedPropertyListQuery = z.infer<
  typeof savedPropertyListQuerySchema
>;
