import { NextRequest } from "next/server";
import { handleApiError, notFound, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/guards";
import { deleteProperty, getPropertyById } from "@/lib/properties";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const property = await getPropertyById(id);
    if (!property) return notFound(`Property ${id} not found`);
    return ok(property);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    const deleted = await deleteProperty(id);
    if (!deleted) return notFound(`Property ${id} not found`);
    return ok({ id });
  } catch (err) {
    return handleApiError(err);
  }
}
