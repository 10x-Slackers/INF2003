import { NextRequest } from "next/server";
import { createTownSchema, townListQuerySchema } from "@/lib/validation/town";
import { badRequest, created, okPaginated } from "@/lib/api-response";
import type { Town } from "@/lib/types";

// GET: All Towns
export async function GET(request: NextRequest) {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = townListQuerySchema.safeParse(searchParams);
  if (!parsed.success) {
    return badRequest("Invalid query parameters", parsed.error.flatten());
  }

  const { page, pageSize } = parsed.data;
  return okPaginated([], 0, page, pageSize);
}

// POST: Create New Town
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Malformed JSON body");
  }

  const parsed = createTownSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Invalid town payload", parsed.error.flatten());
  }

  const town: Town = {
    id: crypto.randomUUID(),
    name: parsed.data.name,
    region: parsed.data.region,
  };

  return created(town);
}
