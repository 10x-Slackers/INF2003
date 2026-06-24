import { z } from "zod";

export const roleSchema = z.enum(["ADMIN", "AGENT", "USER"]);

export const createUserSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(8).max(72),
  role: roleSchema.optional(),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    email: z.string().trim().toLowerCase().email().max(320).optional(),
    role: roleSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field (name, email, role) must be provided.",
  });

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
