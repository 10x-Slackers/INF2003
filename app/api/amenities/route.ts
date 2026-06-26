import { NextRequest } from "next/server";
import { amenityListQuerySchema } from "@/lib/validation/amenity";
import { badRequest, handleApiError, okPaginated } from "@/lib/api-response";
import { listAmenities } from "@/lib/amenities";

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
