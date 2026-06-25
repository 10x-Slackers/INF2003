import { z } from "zod";

export const createSavedPropertySchema = z.object({
  property_id: z.string().uuid(),
});
