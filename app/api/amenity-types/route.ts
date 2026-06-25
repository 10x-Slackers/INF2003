import { listAmenityTypes } from "@/lib/lookups";
import { handleApiError, ok } from "@/lib/api-response";

export async function GET() {
  try {
    const amenityTypes = await listAmenityTypes();
    return ok(amenityTypes);
  } catch (err) {
    return handleApiError(err);
  }
}
