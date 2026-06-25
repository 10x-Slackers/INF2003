import { NextRequest } from "next/server";
import { paginationSchema } from "@/lib/validation/pagination";
import { badRequest, handleApiError, okPaginated } from "@/lib/api-response";
import { listPropertiesByTown } from "@/lib/towns";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = paginationSchema.safeParse(searchParams);
    if (!parsed.success) {
      return badRequest("Invalid pagination parameters", parsed.error.flatten());
    }

    const { page, pageSize } = parsed.data;
    const { data, total } = await listPropertiesByTown(id, page, pageSize);
    return okPaginated(data, total, page, pageSize);
  } catch (err) {
    return handleApiError(err);
  }
}
