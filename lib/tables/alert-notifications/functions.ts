import { execute, query } from "@/lib/db";
import { handleDbError } from "@/lib/utils";
import {
  alertNotificationListQuerySchema,
  createAlertNotificationSchema,
  type AlertNotification,
  type CreateAlertNotification,
} from "./types";
import { idSchema } from "../common";

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
  try {
    const data = alertNotificationListQuerySchema.parse({
      userId,
      page,
      pageSize,
    });
    const [rows, countRows] = await Promise.all([
      query<AlertNotification>(
        `SELECT ${SELECT_COLUMNS} FROM alert_notifications
       WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [data.userId, data.pageSize, (data.page - 1) * data.pageSize],
      ),
      query<{ total: number }>(
        "SELECT COUNT(*) AS total FROM alert_notifications WHERE user_id = ?",
        [data.userId],
      ),
    ]);

    return { data: rows, total: countRows[0].total };
  } catch (error) {
    return handleDbError(error);
  }
}

export async function getAlertNotificationById(
  id: string,
): Promise<AlertNotification | null> {
  try {
    return fetchRow(idSchema.parse(id));
  } catch (error) {
    return handleDbError(error);
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const rows = await query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM alert_notifications
     WHERE user_id = ? AND read_at IS NULL`,
      [idSchema.parse(userId)],
    );
    return rows[0].total;
  } catch (error) {
    return handleDbError(error);
  }
}

export async function createAlertNotification(
  input: CreateAlertNotification,
): Promise<AlertNotification> {
  try {
    createAlertNotificationSchema.parse(input);
    throw new Error(
      "createAlertNotification: not implemented (MongoDB pending)",
    );
  } catch (error) {
    return handleDbError(error);
  }
}

export async function markAlertNotificationRead(
  id: string,
): Promise<AlertNotification | null> {
  try {
    const parsedId = idSchema.parse(id);
    await execute(
      `UPDATE alert_notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
     WHERE id = ?`,
      [parsedId],
    );
    return fetchRow(parsedId);
  } catch (error) {
    return handleDbError(error);
  }
}

export async function deleteAlertNotification(id: string): Promise<boolean> {
  try {
    const parsedId = idSchema.parse(id);
    const result = await execute(
      "DELETE FROM alert_notifications WHERE id = ?",
      [parsedId],
    );
    return result.affectedRows > 0;
  } catch (error) {
    return handleDbError(error);
  }
}
