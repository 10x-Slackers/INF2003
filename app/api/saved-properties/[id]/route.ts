import { NextRequest } from "next/server";
import { forbidden, handleApiError, notFound, ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth/guards";
import { deleteSavedProperty, getSavedPropertyById } from "@/lib/saved-properties";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await requireUser();
    const { id } = await params;

    const saved = await getSavedPropertyById(id);
    if (!saved) return notFound(`Saved property ${id} not found`);

    if (currentUser.id !== saved.user_id) {
      return forbidden();
    }

    return ok(saved);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await requireUser();
    const { id } = await params;

    const saved = await getSavedPropertyById(id);
    if (!saved) return notFound(`Saved property ${id} not found`);

    if (currentUser.id !== saved.user_id) {
      return forbidden();
    }

    await deleteSavedProperty(id);
    return ok({ id });
  } catch (err) {
    return handleApiError(err);
  }
}
