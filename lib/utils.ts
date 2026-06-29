import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { MongoError } from "mongodb";

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

export function handleDbError(error: unknown): never {
  if (error instanceof MongoError) {
    throw new DbError(error.message);
  }
  if (typeof (error as { code?: unknown })?.code === "string") {
    throw new DbError((error as Error).message);
  }
  throw error;
}
