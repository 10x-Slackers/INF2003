"use server";

import {
  fieldError,
  actionError,
  type ActionState,
} from "@/lib/action-helpers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { execute } from "@/lib/db/mariadb";
import z from "zod";

const signUpSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpFields = z.infer<typeof signUpSchema>;

export async function signUpEmail(
  _prevState: ActionState<SignUpFields>,
  data: FormData,
): Promise<ActionState<SignUpFields>> {
  const fields: SignUpFields = {
    name: String(data.get("name") || ""),
    email: String(data.get("email") || ""),
    password: String(data.get("password") || ""),
    confirmPassword: String(data.get("confirmPassword") || ""),
  };

  const parsed = signUpSchema.safeParse(fields);
  if (!parsed.success) {
    const errors = z.flattenError(parsed.error);
    return fieldError<SignUpFields>(errors.fieldErrors, {
      name: fields.name,
      email: fields.email,
    });
  }
  const { name, email, password } = parsed.data;

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await execute(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email.toLowerCase(), passwordHash],
    );
  } catch {
    return actionError("Sign up failed", {
      email,
      name,
    });
  }

  redirect("/login");
}
