import { listFlatModels, listFlatTypes } from "@/lib/tables/lookups";
import { listTowns } from "@/lib/tables/towns";

export async function fetchPropertyFilters() {
  try {
    const [towns, flatTypes, flatModels] = await Promise.all([
      listTowns(),
      listFlatTypes(),
      listFlatModels(),
    ]);
    return { towns, flatTypes, flatModels };
  } catch {
    return { towns: [], flatTypes: [], flatModels: [] };
  }
}
