import { NextRequest } from "next/server";
import {
  createPropertySchema,
  propertyListQuerySchema,
} from "@/lib/validation/property";
import { badRequest, created, handleApiError, okPaginated } from "@/lib/api-response";
import { requireUser } from "@/lib/auth/guards";
import { createProperty, listProperties } from "@/lib/properties";

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = propertyListQuerySchema.safeParse(searchParams);
    if (!parsed.success) {
      return badRequest("Invalid query parameters", parsed.error.flatten());
    }

    const { page, pageSize, ...filters } = parsed.data;
    const { data, total } = await listProperties({ ...filters, page, pageSize });
    return okPaginated(data, total, page, pageSize);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireUser();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Malformed JSON body");
    }

    const parsed = createPropertySchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid property payload", parsed.error.flatten());
    }

    const property = await createProperty(parsed.data);
    return created(property);
  } catch (err) {
    return handleApiError(err);
  }
}
