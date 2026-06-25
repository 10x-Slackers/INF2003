import { listFlatModels } from "@/lib/lookups";
import { handleApiError, ok } from "@/lib/api-response";

export async function GET() {
  try {
    const flatModels = await listFlatModels();
    return ok(flatModels);
  } catch (err) {
    return handleApiError(err);
  }
}
