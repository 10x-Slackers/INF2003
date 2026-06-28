import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { MongoError } from "mongodb";
import type { QueryError } from "mysql2";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const now = () => Math.floor(Date.now() / 1000);

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export class DbError extends Error {
  constructor() {
    super("Database Error.");
    this.name = "DbError";
  }
}

function isMariaDbError(error: unknown): error is QueryError {
  return (
    typeof error === "object" &&
    error !== null &&
    ("code" in error || "errno" in error || "sqlMessage" in error)
  );
}

export function handleDbError(error: unknown): never {
  if (error instanceof MongoError || isMariaDbError(error)) {
    throw new DbError();
  }
  throw error;
}
