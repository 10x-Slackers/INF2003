import { z } from "zod";

export { idSchema } from "@/lib/tables/common";

export const TownProfileSummarySchema = z
  .object({
    totalTransaction: z.number().int().min(0),
    transactionsLast6Months: z.number().int().min(0),
    transactionCountByFlatType: z.record(z.string(), z.number().int().min(0)),
  })
  .strict();

const coordinatePairSchema = z.tuple([z.number(), z.number()]);
const polygonSchema = z.array(z.array(coordinatePairSchema).min(4)).min(1);

export const TownProfileSchema = z
  .object({
    _id: z.uuid(),
    transactionSummary: TownProfileSummarySchema,
    coordinates: polygonSchema,
    updatedAt: z.number().int().min(0),
  })
  .strict();

export type TownProfile = z.infer<typeof TownProfileSchema>;
