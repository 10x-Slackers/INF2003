import { listStoreyRanges } from "@/lib/lookups";
import { handleApiError, ok } from "@/lib/api-response";

export async function GET() {
  try {
    const storeyRanges = await listStoreyRanges();
    return ok(storeyRanges);
  } catch (err) {
    return handleApiError(err);
  }
}
