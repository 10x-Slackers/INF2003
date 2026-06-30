import { z } from "zod";

export const idSchema = z.uuid();

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

const nullableNumberRangeSchema = z
  .object({
    min: z.number().min(0).nullable().optional(),
    max: z.number().min(0).nullable().optional(),
  })
  .strict()
  .refine(({ min, max }) => min == null || max == null || min <= max, {
    message: "min cannot be greater than max",
  });

const nullableStoreyRangeSchema = z
  .object({
    min: z.number().int().nullable().optional(),
    max: z.number().int().nullable().optional(),
  })
  .strict()
  .refine(({ min, max }) => min == null || max == null || min <= max, {
    message: "min cannot be greater than max",
  });

const nullableIntRangeSchema = z
  .object({
    min: z.number().int().nullable().optional(),
    max: z.number().int().nullable().optional(),
  })
  .strict()
  .refine(({ min, max }) => min == null || max == null || min <= max, {
    message: "min cannot be greater than max",
  });

const filterShape = {
  townId: z.array(z.uuid()).optional(),
  flatTypeId: z.array(z.string()).optional(),
  price: numberRangeSchema.optional(),
  floorAreaSqm: numberRangeSchema.optional(),
  storey: nullableStoreyRangeSchema.optional(),
  leaseRemaining: nullableNumberRangeSchema.optional(),
};

const hasFields = (value: object) => Object.keys(value).length > 0;

export const querySearchLogSchema = z
  .object({
    ...filterShape,
    transactionYear: nullableIntRangeSchema.optional(),
  })
  .strict()
  .refine(hasFields, { message: "At least one search filter is required" });

export const createSearchLogSchema = z
  .object({
    userId: z.uuid(),
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
  userId: string;
  query: SearchLogQuery;
  searchedAt: number;
};
