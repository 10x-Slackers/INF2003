import { execute, query } from "@/lib/db";
import type { AlertNotification } from "@/lib/types";

const SELECT_COLUMNS =
  "id, user_id, alert_uuid, transaction_id, read_at, created_at";

async function fetchRow(id: string): Promise<AlertNotification | null> {
  const rows = await query<AlertNotification>(
    `SELECT ${SELECT_COLUMNS} FROM alert_notifications WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function listAlertNotifications(
  userId: string,
  page: number,
  pageSize: number,
): Promise<{ data: AlertNotification[]; total: number }> {
  const [rows, countRows] = await Promise.all([
    query<AlertNotification>(
      `SELECT ${SELECT_COLUMNS} FROM alert_notifications
       WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [userId, pageSize, (page - 1) * pageSize],
    ),
    query<{ total: number }>(
      "SELECT COUNT(*) AS total FROM alert_notifications WHERE user_id = ?",
      [userId],
    ),
  ]);

  return { data: rows, total: countRows[0].total };
}

export async function getAlertNotificationById(
  id: string,
): Promise<AlertNotification | null> {
  return fetchRow(id);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const rows = await query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM alert_notifications
     WHERE user_id = ? AND read_at IS NULL`,
    [userId],
  );
  return rows[0].total;
}

export async function createAlertNotification(
  alertUuid: string,
  transactionId: string,
): Promise<AlertNotification> {
  // TODO: not implemented, needs the MongoDB 'alerts' collection.
  throw new Error("createAlertNotification: not implemented (MongoDB pending)");
}

export async function markAlertNotificationRead(
  id: string,
): Promise<AlertNotification | null> {
  // COALESCE keeps the original read time if it was already marked read.
  await execute(
    `UPDATE alert_notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
     WHERE id = ?`,
    [id],
  );
  return fetchRow(id); // null if the id didn't exist
}

export async function deleteAlertNotification(id: string): Promise<boolean> {
  const row = await fetchRow(id);
  if (!row) return false;

  // Delete only this notification.
  await execute("DELETE FROM alert_notifications WHERE id = ?", [id]);
  return true;
}
