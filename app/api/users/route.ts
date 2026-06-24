import { NextRequest } from "next/server";
import { createUserSchema, paginationSchema } from "@/lib/validation/user";
import { badRequest, created, okPaginated } from "@/lib/api-response";
import type { PublicUser } from "@/lib/types";

// GET: All Users
export async function GET(request: NextRequest) {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = paginationSchema.safeParse(searchParams);
  if (!parsed.success) {
    return badRequest("Invalid pagination parameters", parsed.error.flatten());
  }

  const { page, pageSize } = parsed.data;
  return okPaginated([], 0, page, pageSize);
}

// POST: Create New User
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Malformed JSON body");
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Invalid user payload", parsed.error.flatten());
  }

  const now = new Date().toISOString();
  const user: PublicUser = {
    id: crypto.randomUUID(),
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role ?? "USER",
    created_at: now,
    updated_at: now,
  };

  return created(user);
}
