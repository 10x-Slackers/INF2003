import { clsx, type ClassValue } from "clsx";
import { MongoError } from "mongodb";
import { twMerge } from "tailwind-merge";
import type { QueryError } from "mysql2";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export type DbError = {
  message: string;
};

function isMariaDbError(error: unknown): error is QueryError {
  return (
    typeof error === "object" &&
    error !== null &&
    ("code" in error || "errno" in error || "sqlMessage" in error)
  );
}

export function handleDbError(error: unknown): DbError | Error {
  if (error instanceof MongoError || isMariaDbError(error)) {
    return {
      message: "Database error occurred",
    };
  }
  if (error instanceof Error) {
    return error;
  }
  return {
    message: "An unknown error occurred",
  };
}
