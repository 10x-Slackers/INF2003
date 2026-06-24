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
  confirmPassword: string;
};

export async function signUpEmail(
  _prevState: ActionState<SignUpFields>,
  data: FormData,
): Promise<ActionState<SignUpFields>> {
  const name = String(data.get("name") || "");
  const email = String(data.get("email") || "");
  const password = String(data.get("password") || "");
  const confirmPassword = String(data.get("confirmPassword") || "");

  if (!email || !password || !name || !confirmPassword) {
    return actionError("All fields are required", {
      email,
      name,
    });
  }
  if (password !== confirmPassword) {
    return actionError("Passwords do not match", {
      email,
      name,
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return actionError("Invalid email address", {
      email,
      name,
    });
  }

  if (password.length < 8) {
    return actionError("Password must be at least 8 characters", {
      email,
      name,
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.execute(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email.toLowerCase(), passwordHash],
    );
  } catch {
    return actionError("Sign up failed", {
      email,
      name,
    });
  }

  redirect(ROUTES.LOGIN);
}
