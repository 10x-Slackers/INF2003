import { z } from "zod";

export const idSchema = z.uuid();

export const TownProfileSummarySchema = z
  .object({
    totalTransaction: z.number().int().min(0),
    earliestTransaction: z.string().min(1),
    latestTransaction: z.string().min(1),
    avgResalePriceByFlatType: z.record(z.string(), z.number().min(0)),
  })
  .strict();

const coordinatePairSchema = z.tuple([z.number(), z.number()]);
const polygonSchema = z.array(z.array(coordinatePairSchema).min(4)).min(1);

export const UpsertTownProfileSchema = z
  .object({
    _id: z.uuid(),
    transactionSummary: TownProfileSummarySchema,
    coordinates: polygonSchema,
  })
  .strict();

export const TownProfileSchema = z
  .object({
    _id: z.uuid(),
    transactionSummary: TownProfileSummarySchema,
    coordinates: polygonSchema,
    updatedAt: z.number().int().min(0),
  })
  .strict();

export type TownProfile = z.infer<typeof TownProfileSchema>;
export type TownProfileUpsert = z.infer<typeof UpsertTownProfileSchema>;
