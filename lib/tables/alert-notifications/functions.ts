import { execute, query } from "@/lib/db";
import { handleDbError } from "@/lib/utils";
import {
  alertNotificationListQuerySchema,
  createAlertNotificationSchema,
  updateAlertNotificationParamsSchema,
  updateAlertNotificationSchema,
  type UpdateAlertNotification,
  type UpdateAlertNotificationParams,
  type AlertNotificationListQuery,
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
  input: AlertNotificationListQuery,
): Promise<{ data: AlertNotification[]; total: number }> {
  try {
    const data = alertNotificationListQuerySchema.parse(input);
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
): Promise<void> {
  try {
    const data = createAlertNotificationSchema.parse(input);
    await execute(
      "INSERT INTO alert_notifications (user_id, alert_uuid, transaction_id) VALUES (?, ?, ?)",
      [data.userId, data.alert_uuid, data.transaction_id],
    );
  } catch (error) {
    return handleDbError(error);
  }
}

const isEmptyUpdate = (input: UpdateAlertNotification) =>
  Object.values(input).every((value) => value === undefined);

export async function updateAlertNotification(
  input: UpdateAlertNotificationParams,
): Promise<AlertNotification | null> {
  try {
    const parsed = updateAlertNotificationParamsSchema.parse(input);
    if (isEmptyUpdate(parsed.input)) return fetchRow(parsed.id);

    const data = updateAlertNotificationSchema.parse(parsed.input);
    const fields: string[] = [];
    const params: (string | null)[] = [];

    if (data.userId !== undefined) {
      fields.push("user_id = ?");
      params.push(data.userId);
    }
    if (data.alert_uuid !== undefined) {
      fields.push("alert_uuid = ?");
      params.push(data.alert_uuid);
    }
    if (data.transaction_id !== undefined) {
      fields.push("transaction_id = ?");
      params.push(data.transaction_id);
    }
    if (data.read_at !== undefined) {
      fields.push("read_at = ?");
      params.push(data.read_at);
    }

    const result = await execute(
      `UPDATE alert_notifications SET ${fields.join(", ")} WHERE id = ?`,
      [...params, parsed.id],
    );
    return result.affectedRows === 0 ? null : fetchRow(parsed.id);
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
