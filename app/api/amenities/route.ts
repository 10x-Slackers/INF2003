import { NextRequest } from "next/server";
import {
  amenityListQuerySchema,
  createAmenitySchema,
} from "@/lib/validation/amenity";
import { badRequest, created, handleApiError, okPaginated } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/guards";
import { createAmenity, listAmenities } from "@/lib/amenities";

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = amenityListQuerySchema.safeParse(searchParams);
    if (!parsed.success) {
      return badRequest("Invalid query parameters", parsed.error.flatten());
    }

    const { page, pageSize, ...filters } = parsed.data;
    const { data, total } = await listAmenities({ ...filters, page, pageSize });
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

    const parsed = createAmenitySchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid amenity payload", parsed.error.flatten());
    }

    const amenity = await createAmenity(parsed.data);
    return created(amenity);
  } catch (err) {
    return handleApiError(err);
  }
}
