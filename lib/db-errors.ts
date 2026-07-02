import { MongoError } from "mongodb";
import type { QueryError } from "mysql2";

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
  if (error instanceof MongoError) {
    throw new DbError(error.message);
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
