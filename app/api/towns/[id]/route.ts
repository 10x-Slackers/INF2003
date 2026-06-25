import { NextRequest } from "next/server";
import { updateTownSchema } from "@/lib/validation/town";
import { badRequest, handleApiError, notFound, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/guards";
import { deleteTown, getTownById, updateTown } from "@/lib/towns";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const town = await getTownById(id);
    if (!town) return notFound(`Town ${id} not found`);
    return ok(town);
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

    const parsed = updateTownSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid update payload", parsed.error.flatten());
    }

    const town = await updateTown(id, parsed.data);
    if (!town) return notFound(`Town ${id} not found`);
    return ok(town);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    const deleted = await deleteTown(id);
    if (!deleted) return notFound(`Town ${id} not found`);
    return ok({ id });
  } catch (err) {
    return handleApiError(err);
  }
}
