import { NextRequest } from "next/server";
import { updateTownSchema } from "@/lib/validation/town";
import { badRequest, notFound } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Town by ID
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return notFound(`Town ${id} not found`);
}

// UPDATE
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Malformed JSON body");
  }

  const parsed = updateTownSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Invalid update payload", parsed.error.flatten());
  }

  return notFound(`Town ${id} not found`);
}

// DELETE
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return notFound(`Town ${id} not found`);
}
