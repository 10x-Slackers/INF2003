import { NextRequest } from "next/server";
import { createTownSchema, townListQuerySchema } from "@/lib/validation/town";
import { badRequest, created, handleApiError, okPaginated } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/guards";
import { createTown, listTowns } from "@/lib/towns";

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = townListQuerySchema.safeParse(searchParams);
    if (!parsed.success) {
      return badRequest("Invalid query parameters", parsed.error.flatten());
    }

    const { page, pageSize, region } = parsed.data;
    const { data, total } = await listTowns(region, page, pageSize);
    return okPaginated(data, total, page, pageSize);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");

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

    const town = await createTown(parsed.data);
    return created(town);
  } catch (err) {
    return handleApiError(err);
  }
}
