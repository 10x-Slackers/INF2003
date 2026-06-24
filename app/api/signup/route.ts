import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email.toLowerCase()],
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 409 },
      );
    }
    await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email.toLowerCase(), passwordHash],
    );

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
