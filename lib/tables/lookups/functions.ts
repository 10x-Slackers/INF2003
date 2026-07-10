import { cache } from "react";
import { query } from "@/lib/db";
import { handleDbError } from "@/lib/utils";
import type { AmenityType, FlatModel, FlatType, StoreyRange } from "./types";

export const listFlatTypes = cache(async (): Promise<FlatType[]> => {
  try {
    return await query<FlatType>(
      "SELECT id, name FROM flat_types ORDER BY name",
    );
  } catch (error) {
    return handleDbError(error);
  }
});

export const listFlatModels = cache(async (): Promise<FlatModel[]> => {
  try {
    return await query<FlatModel>(
      "SELECT id, name FROM flat_models ORDER BY name",
    );
  } catch (error) {
    return handleDbError(error);
  }
});

export const listStoreyRanges = cache(async (): Promise<StoreyRange[]> => {
  try {
    return await query<StoreyRange>(
      "SELECT id, min_storey, max_storey FROM storey_ranges ORDER BY min_storey",
    );
  } catch (error) {
    return handleDbError(error);
  }
});

export const listAmenityTypes = cache(async (): Promise<AmenityType[]> => {
  try {
    return await query<AmenityType>(
      "SELECT id, name FROM amenity_types ORDER BY name",
    );
  } catch (error) {
    return handleDbError(error);
  }
});

export async function getStoreyRange(
  storeyRangeId: number,
): Promise<{ min: number; max: number }> {
  try {
    const [range] = await query<{ min_storey: number; max_storey: number }>(
      "SELECT min_storey, max_storey FROM storey_ranges WHERE id = ? LIMIT 1",
      [storeyRangeId],
    );
    if (!range) {
      throw new Error(`Storey range with id ${storeyRangeId} not found`);
    }
    return { min: range.min_storey, max: range.max_storey };
  } catch (error) {
    return handleDbError(error);
  }
}
