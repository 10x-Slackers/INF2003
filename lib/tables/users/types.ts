import { z } from "zod";
import { paginationSchema } from "../common";

export const roleSchema = z.enum(["ADMIN", "AGENT", "USER"]);
export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    email: z.email().trim().toLowerCase().max(320).optional(),
    role: roleSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field (name, email, role) must be provided.",
  });
export const userListQuerySchema = paginationSchema;

export type UserRole = z.infer<typeof roleSchema>;

export type User = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type PublicUser = Omit<User, "password_hash">;
export type UpdateUser = z.infer<typeof updateUserSchema>;
