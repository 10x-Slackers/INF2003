import { NextRequest } from "next/server";
import { propertyLookupQuerySchema } from "@/lib/validation/property";
import { badRequest, handleApiError, ok } from "@/lib/api-response";
import { lookupProperty } from "@/lib/properties";

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = propertyLookupQuerySchema.safeParse(searchParams);
    if (!parsed.success) {
      return badRequest("Invalid lookup parameters", parsed.error.flatten());
    }

    const result = await lookupProperty(parsed.data);
    return ok(result);
  } catch (err) {
    return handleApiError(err);
  }
}
