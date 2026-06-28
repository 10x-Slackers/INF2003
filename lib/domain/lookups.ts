import { query } from "@/lib/db";
import type {
  AmenityType,
  FlatModel,
  FlatType,
  StoreyRange,
} from "@/lib/types";

export async function listFlatTypes(): Promise<FlatType[]> {
  return query<FlatType>("SELECT id, name FROM flat_types ORDER BY name");
}

export async function listFlatModels(): Promise<FlatModel[]> {
  return query<FlatModel>("SELECT id, name FROM flat_models ORDER BY name");
}

export async function listStoreyRanges(): Promise<StoreyRange[]> {
  return query<StoreyRange>(
    "SELECT id, min_storey, max_storey FROM storey_ranges ORDER BY min_storey",
  );
}

export async function listAmenityTypes(): Promise<AmenityType[]> {
  return query<AmenityType>("SELECT id, name FROM amenity_types ORDER BY name");
}
