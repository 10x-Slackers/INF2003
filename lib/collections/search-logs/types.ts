import { z } from "zod";
import { idSchema } from "@/lib/tables/common";

export { idSchema };

const numberRangeSchema = z
  .object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
  })
  .strict()
  .refine(
    ({ min, max }) => min === undefined || max === undefined || min <= max,
    {
      message: "min cannot be greater than max",
    },
  );

const filterShape = {
  townId: z.array(z.uuid()).optional(),
  flatTypeId: z.array(z.string()).optional(),
  flatModelId: z.array(z.string()).optional(),
  price: numberRangeSchema.optional(),
};

const hasFields = (value: object) => Object.keys(value).length > 0;

export const querySearchLogSchema = z
  .object({
    ...filterShape,
    leaseCommenceYear: z.number().int().min(1960).max(2100).optional(),
  })
  .strict()
  .refine(hasFields, { message: "At least one search filter is required" });

export const createSearchLogSchema = z
  .object({
    userId: z.uuid().optional(),
    query: querySearchLogSchema,
  })
  .strict();

export const searchLogListQuerySchema = z
  .object({
    userId: idSchema.optional(),
    limit: z.coerce.number().int().min(0).optional(),
  })
  .strict();

type SearchLogQuery = z.infer<typeof querySearchLogSchema>;
export type SearchLogCreate = z.infer<typeof createSearchLogSchema>;
export type SearchLogListQuery = z.infer<typeof searchLogListQuerySchema>;
export type SearchLog = {
  _id: string;
  userId: string | null;
  query: SearchLogQuery;
  searchedAt: number;
};
