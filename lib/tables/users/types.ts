import { z } from "zod";
import { idSchema, paginationSchema } from "../common";

export const roleSchema = z.enum(["ADMIN", "AGENT", "USER"]);
export const createUserSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.email().trim().toLowerCase().max(320),
  password_hash: z.string().min(1).max(255),
  role: roleSchema.optional(),
});
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
export const updateUserParamsSchema = z.object({
  id: idSchema,
  input: updateUserSchema.or(z.object({}).strict()),
});

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
export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UpdateUserParams = z.infer<typeof updateUserParamsSchema>;
