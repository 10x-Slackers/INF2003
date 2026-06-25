import { NextRequest } from "next/server";
import { createSavedPropertySchema } from "@/lib/validation/saved-property";
import { paginationSchema } from "@/lib/validation/pagination";
import { badRequest, created, handleApiError, okPaginated } from "@/lib/api-response";
import { requireUser } from "@/lib/auth/guards";
import { createSavedProperty, listSavedProperties } from "@/lib/saved-properties";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = paginationSchema.safeParse(searchParams);
    if (!parsed.success) {
      return badRequest("Invalid pagination parameters", parsed.error.flatten());
    }

    const { page, pageSize } = parsed.data;
    const { data, total } = await listSavedProperties(user.id, page, pageSize);
    return okPaginated(data, total, page, pageSize);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Malformed JSON body");
    }

    const parsed = createSavedPropertySchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid payload", parsed.error.flatten());
    }

    const saved = await createSavedProperty(user.id, parsed.data.property_id);
    return created(saved);
  } catch (err) {
    return handleApiError(err);
  }
}
