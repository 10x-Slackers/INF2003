"use server";

import { assertSignedIn } from "@/lib/auth";
import {
  createSavedAlert,
  getSavedAlertById,
  deleteSavedAlert,
  listSavedAlerts,
  type SavedAlertFilters,
} from "@/lib/collections/saved-alerts";
import {
  listAlertNotificationsWithDetails,
  getAlertNotificationById,
  getUnreadCount,
  deleteAlertNotification,
  updateAlertNotification,
  markAllNotificationsRead,
} from "@/lib/tables/alert-notifications";
import { listTowns } from "@/lib/tables/towns";
import { listFlatTypes, listFlatModels } from "@/lib/tables/lookups";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";

async function getOwnedNotification(id: string, userId: string) {
  const n = await getAlertNotificationById(id);
  return n && n.user_id === userId ? n : null;
}

export async function createAlertAction(filters: SavedAlertFilters) {
  const session = await assertSignedIn();
  await createSavedAlert({ userId: session.user.id, filters });
  revalidatePath(ROUTES.ALERTS);
}

export async function listNotificationsAction(input: {
  page: number;
  pageSize: number;
}) {
  const session = await assertSignedIn();
  return listAlertNotificationsWithDetails({
    userId: session.user.id,
    page: input.page,
    pageSize: input.pageSize,
  });
}

export async function markNotificationReadAction(
  id: string,
): Promise<{ ok: boolean }> {
  const session = await assertSignedIn();
  const n = await getOwnedNotification(id, session.user.id);
  if (!n) return { ok: false };
  await updateAlertNotification({
    id,
    input: { read_at: new Date().toISOString().slice(0, 19).replace("T", " ") },
  });
  revalidatePath(ROUTES.ALERTS);
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<{
  ok: boolean;
}> {
  const session = await assertSignedIn();
  await markAllNotificationsRead(session.user.id);
  revalidatePath(ROUTES.ALERTS);
  return { ok: true };
}

export async function deleteNotificationAction(
  id: string,
): Promise<{ ok: boolean }> {
  const session = await assertSignedIn();
  const n = await getOwnedNotification(id, session.user.id);
  if (!n) return { ok: false };
  await deleteAlertNotification(id);
  revalidatePath(ROUTES.ALERTS);
  return { ok: true };
}

export async function listSavedAlertsAction() {
  const session = await assertSignedIn();
  const [alerts, towns, flatTypes, flatModels] = await Promise.all([
    listSavedAlerts(session.user.id),
    listTowns(),
    listFlatTypes(),
    listFlatModels(),
  ]);
  return { alerts, towns, flatTypes, flatModels };
}

export async function deleteSavedAlertAction(
  id: string,
): Promise<{ ok: boolean }> {
  const session = await assertSignedIn();
  const alert = await getSavedAlertById(id);
  if (!alert || alert.userId !== session.user.id) return { ok: false };
  await deleteSavedAlert(id);
  revalidatePath(ROUTES.ALERTS);
  return { ok: true };
}

export async function getUnreadCountAction(): Promise<number> {
  const session = await assertSignedIn();
  return getUnreadCount(session.user.id);
}
