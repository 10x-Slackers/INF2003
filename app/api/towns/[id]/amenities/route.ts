import { NextRequest } from "next/server";
import { amenityListQuerySchema } from "@/lib/validation/town";
import { badRequest, handleApiError, okPaginated } from "@/lib/api-response";
import { listAmenitiesByTown } from "@/lib/towns";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = amenityListQuerySchema.safeParse(searchParams);
    if (!parsed.success) {
      return badRequest("Invalid query parameters", parsed.error.flatten());
    }

    const { page, pageSize, amenity_type_id } = parsed.data;
    const { data, total } = await listAmenitiesByTown(
      id,
      amenity_type_id,
      page,
      pageSize,
    );
    return okPaginated(data, total, page, pageSize);
  } catch (err) {
    return handleApiError(err);
  }
}
