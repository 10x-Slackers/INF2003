import { NextRequest } from "next/server";
import { townListQuerySchema } from "@/lib/validation/town";
import { badRequest, handleApiError, okPaginated } from "@/lib/api-response";
import { listTowns } from "@/lib/towns";

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = townListQuerySchema.safeParse(searchParams);
    if (!parsed.success) {
      return badRequest("Invalid query parameters", parsed.error.flatten());
    }

    const { page, pageSize, region } = parsed.data;
    const { data, total } = await listTowns(region, page, pageSize);
    return okPaginated(data, total, page, pageSize);
  } catch (err) {
    return handleApiError(err);
  }
}
