import { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth/guards";
import { isPropertySaved } from "@/lib/saved-properties";

interface RouteParams {
  params: Promise<{ propertyId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { propertyId } = await params;

    const saved = await isPropertySaved(user.id, propertyId);
    return ok({ saved });
  } catch (err) {
    return handleApiError(err);
  }
}
