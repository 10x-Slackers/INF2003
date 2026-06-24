import { z } from "zod";

export const regionSchema = z.enum([
  "NORTH REGION",
  "NORTH-EAST REGION",
  "EAST REGION",
  "WEST REGION",
  "CENTRAL REGION",
]);

export const createTownSchema = z.object({
  name: z.string().trim().min(1).max(100),
  region: regionSchema,
});

export const updateTownSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    region: regionSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field (name, region) must be provided.",
  });

export const townListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  region: regionSchema.optional(),
});
