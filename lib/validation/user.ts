import { z } from "zod";

export const roleSchema = z.enum(["ADMIN", "AGENT", "USER"]);

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    email: z.string().trim().toLowerCase().email().max(320).optional(),
    role: roleSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field (name, email, role) must be provided.",
  });
