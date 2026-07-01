import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
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
  constructor(message: string) {
    super(message);
    this.name = "DbError";
  }
}

export class DuplicateEntryError extends DbError {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateEntryError";
  }
}

export class ForeignKeyConstraintError extends DbError {
  constructor(message: string) {
    super(message);
    this.name = "ForeignKeyConstraintError";
  }
}

export function handleDbError(error: unknown): never {
  // Avoid importing the mongodb package in shared client/server utilities.
  // Mongo errors are detected by shape so browser bundles don't pull in Node-only modules.
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    "name" in error &&
    String((error as { name: unknown }).name).includes("Mongo")
  ) {
    throw new DbError(String((error as { message: unknown }).message));
  }
  if (typeof (error as { code?: unknown })?.code === "string") {
    const err = error as QueryError;
    const code = err.code;
    const message = err.message;
    if (code === "ER_DUP_ENTRY") {
      throw new DuplicateEntryError("Duplicate entry found");
    }
    if (
      code === "ER_ROW_IS_REFERENCED_2" ||
      code === "ER_NO_REFERENCED_ROW_2"
    ) {
      throw new ForeignKeyConstraintError(
        "Foreign key constraint violation: " + message,
      );
    }
    throw new DbError("Database error: " + message);
  }
  throw error;
}
