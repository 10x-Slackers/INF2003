"use server";

import { assertSignedIn } from "@/lib/auth";
import {
  createSavedAlert,
  type SavedAlertFilters,
} from "@/lib/collections/saved-alerts";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";

export async function createAlertAction(filters: SavedAlertFilters) {
  const session = await assertSignedIn();
  await createSavedAlert({ userId: session.user.id, filters });
  revalidatePath(ROUTES.ALERTS);
}
