"use server";

import { assertAgent } from "@/lib/auth";
import {
  createProperty,
  listProperties,
  type CreateProperty,
  type PropertyListQuery,
  type PropertyWithLatestTransaction,
} from "@/lib/tables/properties";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";
import { fetchPropertyFilters } from "@/app/filters";

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

export { fetchPropertyFilters };
