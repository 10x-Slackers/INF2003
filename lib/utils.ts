import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
  if (error instanceof Error && error.name === "MongoError") {
    throw new DbError(error.message);
  }
  if (typeof (error as { code?: unknown })?.code === "string") {
    const err = error as { code: string; message: string };
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

/** Wrap an async DB operation with the standard try/catch + handleDbError. */
export async function withDbError<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    return handleDbError(error);
  }
}
