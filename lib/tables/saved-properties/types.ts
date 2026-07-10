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
export type SavedPropertyIdentity = z.infer<typeof savedPropertyIdentitySchema>;
