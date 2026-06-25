import { NextRequest } from "next/server";
import { paginationSchema } from "@/lib/validation/pagination";
import { badRequest, handleApiError, okPaginated } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/guards";
import { listUsers } from "@/lib/users";

export async function GET(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = paginationSchema.safeParse(searchParams);
    if (!parsed.success) {
      return badRequest("Invalid pagination parameters", parsed.error.flatten());
    }

    const { page, pageSize } = parsed.data;
    const { data, total } = await listUsers(page, pageSize);
    return okPaginated(data, total, page, pageSize);
  } catch (err) {
    return handleApiError(err);
  }
}
