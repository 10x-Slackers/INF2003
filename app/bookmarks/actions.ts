"use server";

import { assertSignedIn } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";
import {
  createSavedProperty,
  deleteSavedPropertyByUserAndProperty,
  isPropertySaved,
} from "@/lib/tables/saved-properties";

export async function toggleBookmarkAction(
  propertyId: string,
): Promise<{ saved: boolean }> {
  const session = await assertSignedIn();
  const saved = await isPropertySaved({
    userId: session.user.id,
    propertyId,
  });
  if (saved) {
    await deleteSavedPropertyByUserAndProperty({
      userId: session.user.id,
      propertyId,
    });
  } else {
    await createSavedProperty({ userId: session.user.id, propertyId });
  }
  revalidatePath(ROUTES.PROPERTY_DETAIL(propertyId));
  revalidatePath(ROUTES.BOOKMARKS);
  return { saved: !saved };
}

export async function removeBookmarkAction(propertyId: string): Promise<{
  ok: boolean;
}> {
  const session = await assertSignedIn();
  await deleteSavedPropertyByUserAndProperty({
    userId: session.user.id,
    propertyId,
  });
  revalidatePath(ROUTES.PROPERTY_DETAIL(propertyId));
  revalidatePath(ROUTES.BOOKMARKS);
  return { ok: true };
}
