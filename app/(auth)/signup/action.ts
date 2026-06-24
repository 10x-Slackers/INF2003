"use server";

import { actionError, type ActionState } from "@/lib/action-helpers";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db/mariadb";

type SignUpFields = {
  name: string;
  email: string;
  password: string;
};

export async function signUpEmail(
  _prevState: ActionState<SignUpFields>,
  data: FormData,
): Promise<ActionState<SignUpFields>> {
  const name = String(data.get("name") || "");
  const email = String(data.get("email") || "");
  const password = String(data.get("password") || "");

  if (!email || !password || !name) {
    return actionError("All fields are required", {
      email,
      name,
    });
  }

  const result = await bcrypt.hash(password, 12);
  try {
    await pool.execute(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email.toLowerCase(), result],
    );
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      return actionError("Email already exists", {
        email,
        name,
      });
    }
    return actionError("Sign up failed", {
      email,
      name,
    });
  }

  redirect(ROUTES.LOGIN);
}
