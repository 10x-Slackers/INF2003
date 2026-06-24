import { NextRequest } from "next/server";
import { paginationSchema } from "@/lib/validation/user";
import { badRequest, okPaginated } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Properties within a Specific Town
export async function GET(request: NextRequest, { params }: RouteParams) {
  await params;

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = paginationSchema.safeParse(searchParams);
  if (!parsed.success) {
    return badRequest("Invalid pagination parameters", parsed.error.flatten());
  }

  const { page, pageSize } = parsed.data;
  return okPaginated([], 0, page, pageSize);
}
