import { query } from "@/lib/db";
import { handleDbError } from "@/lib/utils";
import type { AmenityType, FlatModel, FlatType, StoreyRange } from "./types";

export async function listFlatTypes(): Promise<FlatType[]> {
  try {
    return await query<FlatType>(
      "SELECT id, name FROM flat_types ORDER BY name",
    );
  } catch (error) {
    return handleDbError(error);
  }
}

export async function listFlatModels(): Promise<FlatModel[]> {
  try {
    return await query<FlatModel>(
      "SELECT id, name FROM flat_models ORDER BY name",
    );
  } catch (error) {
    return handleDbError(error);
  }
}

export async function listStoreyRanges(): Promise<StoreyRange[]> {
  try {
    return await query<StoreyRange>(
      "SELECT id, min_storey, max_storey FROM storey_ranges ORDER BY min_storey",
    );
  } catch (error) {
    return handleDbError(error);
  }
}

export async function listAmenityTypes(): Promise<AmenityType[]> {
  try {
    return await query<AmenityType>(
      "SELECT id, name FROM amenity_types ORDER BY name",
    );
  } catch (error) {
    return handleDbError(error);
  }
}
