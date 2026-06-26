import { NextRequest } from "next/server";
import { handleApiError, notFound, ok } from "@/lib/api-response";
import { getTownById } from "@/lib/towns";

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
