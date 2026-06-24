import { NextRequest } from "next/server";
import { updateUserSchema } from "@/lib/validation/user";
import { badRequest, notFound } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: User by ID
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return notFound(`User ${id} not found`);
}

// PATCH: Update User
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Malformed JSON body");
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Invalid update payload", parsed.error.flatten());
  }

  return notFound(`User ${id} not found`);
}

// DELETE
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return notFound(`User ${id} not found`);
}
