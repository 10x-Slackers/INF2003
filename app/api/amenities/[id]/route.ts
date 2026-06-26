import { NextRequest } from "next/server";
import { handleApiError, notFound, ok } from "@/lib/api-response";
import { getAmenityById } from "@/lib/amenities";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const amenity = await getAmenityById(id);
    if (!amenity) return notFound(`Amenity ${id} not found`);
    return ok(amenity);
  } catch (err) {
    return handleApiError(err);
  }
}
