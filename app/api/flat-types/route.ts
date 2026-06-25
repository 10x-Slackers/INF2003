import { listFlatTypes } from "@/lib/lookups";
import { handleApiError, ok } from "@/lib/api-response";

export async function GET() {
  try {
    const flatTypes = await listFlatTypes();
    return ok(flatTypes);
  } catch (err) {
    return handleApiError(err);
  }
}
