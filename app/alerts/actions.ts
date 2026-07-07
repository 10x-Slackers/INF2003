"use server";

import { assertSignedIn } from "@/lib/auth";
import { createSavedAlert } from "@/lib/collections/saved-alerts/functions";
import type { SavedAlertFilters } from "@/lib/collections/saved-alerts/types";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";

export async function createAlertAction(filters: SavedAlertFilters) {
  const session = await assertSignedIn();
  await createSavedAlert({ userId: session!.user!.id, filters });
  revalidatePath(ROUTES.ALERTS);
}
