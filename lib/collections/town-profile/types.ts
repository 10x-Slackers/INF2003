import { z } from "zod";

export const idSchema = z.uuid();

export const TownProfileSummarySchema = z
  .object({
    total_transaction: z.number().int().min(0),
    earliest_transaction: z.string().min(1),
    latest_transaction: z.string().min(1),
    avg_resale_price_by_flat_type: z.record(z.string(), z.number().min(0)),
  })
  .strict();

const coordinatePairSchema = z.tuple([z.number(), z.number()]);
const polygonSchema = z.array(z.array(coordinatePairSchema).min(4)).min(1);

export const UpsertTownProfileSchema = z
  .object({
    _id: z.uuid(),
    transaction_summary: TownProfileSummarySchema,
    coordinates: polygonSchema,
  })
  .strict();

export const TownProfileSchema = z.object({
  _id: z.uuid(),
  transaction_summary: TownProfileSummarySchema,
  coordinates: polygonSchema,
  updated_at: z.number().int().min(0),
});

export type TownProfile = z.infer<typeof TownProfileSchema>;
export type TownProfileUpsert = z.infer<typeof UpsertTownProfileSchema>;
