import { NextResponse } from "next/server";
import { z } from "zod";
import { signupSchema } from "@/lib/auth/schemas";
import { hashPassword } from "@/lib/auth";
import { execute } from "@/lib/db";

export async function signup(request: Request) {
  const parsed = signupSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { errors: zodErrors(z.flattenError(parsed.error).fieldErrors) },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await hashPassword(password);

  try {
    await execute(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email.toLowerCase(), passwordHash],
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Sign up failed" }, { status: 400 });
  }
}

function zodErrors(errors: Record<string, string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(errors).map(([key, value]) => [key, value?.[0]]),
  );
}
