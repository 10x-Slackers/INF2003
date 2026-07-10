"use server";

import { assertAgent } from "@/lib/auth";
import {
  createProperty,
  listProperties,
  type CreateProperty,
  type PropertyListQuery,
  type PropertyWithLatestTransaction,
} from "@/lib/tables/properties";
import { listFlatModels, listFlatTypes } from "@/lib/tables/lookups";
import { listTowns } from "@/lib/tables/towns";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";

export async function createPropertyAction(input: CreateProperty) {
  await assertAgent();
  const id = await createProperty(input);
  revalidatePath(ROUTES.PROPERTIES);
  return id;
}

export async function fetchProperties(
  input: PropertyListQuery,
): Promise<{ data: PropertyWithLatestTransaction[]; total: number }> {
  return listProperties(input);
}

export async function fetchPropertyFilters() {
  const [towns, flatTypes, flatModels] = await Promise.all([
    listTowns(),
    listFlatTypes(),
    listFlatModels(),
  ]);
  return { towns, flatTypes, flatModels };
}
