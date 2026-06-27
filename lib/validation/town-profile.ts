import { z } from "zod";

export const townProfileSummarySchema = z
  .object({
    total_transaction: z.number().int().min(0),
    earliest_transaction: z.string().min(1),
    latest_transaction: z.string().min(1),
    avg_resale_price_by_flat_type: z.record(z.string(), z.number()),
  })
  .strict();

const coordinatePairSchema = z.tuple([z.number(), z.number()]);
const polygonSchema = z.array(z.array(coordinatePairSchema).min(4)).min(1);

export const upsertTownProfileSchema = z
  .object({
    _id: z.string().min(1),
    transaction_summary: townProfileSummarySchema,
    coordinates: polygonSchema,
  })
  .strict();
