import { NextRequest } from "next/server";
import { updateAmenitySchema } from "@/lib/validation/amenity";
import { badRequest, handleApiError, notFound, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/guards";
import { deleteAmenity, getAmenityById, updateAmenity } from "@/lib/amenities";

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

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Malformed JSON body");
    }

    const parsed = updateAmenitySchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid update payload", parsed.error.flatten());
    }

    const amenity = await updateAmenity(id, parsed.data);
    if (!amenity) return notFound(`Amenity ${id} not found`);
    return ok(amenity);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    const deleted = await deleteAmenity(id);
    if (!deleted) return notFound(`Amenity ${id} not found`);
    return ok({ id });
  } catch (err) {
    return handleApiError(err);
  }
}
