import {
  execute,
  query,
  queryOne,
  isEmptyUpdate,
  buildUpdateFields,
  deleteById,
  paginatedQuery,
} from "@/lib/db";
import { withDbError } from "@/lib/utils";
import {
  alertNotificationListQuerySchema,
  createAlertNotificationSchema,
  updateAlertNotificationParamsSchema,
  updateAlertNotificationSchema,
  type UpdateAlertNotificationParams,
  type AlertNotificationListQuery,
  type AlertNotification,
  type AlertNotificationWithDetails,
  type CreateAlertNotification,
} from "./types";
import { idSchema } from "../common";

const SELECT_COLUMNS =
  "id, user_id, alert_uuid, transaction_id, read_at, created_at";

async function fetchRow(id: string): Promise<AlertNotification | null> {
  return queryOne<AlertNotification>(
    `SELECT ${SELECT_COLUMNS} FROM alert_notifications WHERE id = ? LIMIT 1`,
    [id],
  );
}

export async function listAlertNotifications(
  input: AlertNotificationListQuery,
): Promise<{ data: AlertNotification[]; total: number }> {
  return withDbError(async () => {
    const data = alertNotificationListQuerySchema.parse(input);
    return paginatedQuery<AlertNotification>(
      `SELECT ${SELECT_COLUMNS} FROM alert_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      "SELECT COUNT(*) AS total FROM alert_notifications WHERE user_id = ?",
      [data.userId],
      data.page,
      data.pageSize,
    );
  });
}

export async function getAlertNotificationById(
  id: string,
): Promise<AlertNotification | null> {
  return withDbError(async () => {
    return fetchRow(idSchema.parse(id));
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return withDbError(async () => {
    const rows = await query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM alert_notifications
     WHERE user_id = ? AND read_at IS NULL`,
      [idSchema.parse(userId)],
    );
    return rows[0].total;
  });
}

export async function bulkCreateAlertNotifications(
  input: CreateAlertNotification[],
): Promise<void> {
  return withDbError(async () => {
    const data = createAlertNotificationSchema.array().parse(input);
    if (data.length === 0) return;

    await execute(
      `INSERT INTO alert_notifications (user_id, alert_uuid, transaction_id)
       VALUES ${data.map(() => "(?, ?, ?)").join(", ")}`,
      data.flatMap((item) => [
        item.userId,
        item.alert_uuid,
        item.transaction_id,
      ]),
    );
  });
}

export async function updateAlertNotification(
  input: UpdateAlertNotificationParams,
): Promise<AlertNotification | null> {
  return withDbError(async () => {
    const parsed = updateAlertNotificationParamsSchema.parse(input);
    if (isEmptyUpdate(parsed.input)) return fetchRow(parsed.id);

    const data = updateAlertNotificationSchema.parse(parsed.input);
    const { setClause, params } = buildUpdateFields({
      user_id: data.userId,
      alert_uuid: data.alert_uuid,
      transaction_id: data.transaction_id,
      read_at: data.read_at,
    });
    const result = await execute(
      `UPDATE alert_notifications SET ${setClause} WHERE id = ?`,
      [...params, parsed.id],
    );
    return result.affectedRows === 0 ? null : fetchRow(parsed.id);
  });
}

export async function listAlertNotificationsWithDetails(
  input: AlertNotificationListQuery,
): Promise<{ data: AlertNotificationWithDetails[]; total: number }> {
  return withDbError(async () => {
    const data = alertNotificationListQuerySchema.parse(input);
    return paginatedQuery<AlertNotificationWithDetails>(
      `SELECT n.id, n.user_id, n.alert_uuid, n.transaction_id, n.read_at, n.created_at,
            rt.resale_price, rt.floor_area_sqm, rt.transaction_month,
            p.town_id, t.name AS town_name, p.block, p.street_name,
            ft.name AS flat_type_name, fm.name AS flat_model_name,
            sr.min_storey, sr.max_storey
     FROM alert_notifications n
     JOIN resale_transactions rt ON rt.id = n.transaction_id
     JOIN properties p ON p.id = rt.property_id
     JOIN towns t ON t.id = p.town_id
     JOIN flat_types ft ON ft.id = rt.flat_type_id
     JOIN flat_models fm ON fm.id = rt.flat_model_id
     JOIN storey_ranges sr ON sr.id = rt.storey_range_id
     WHERE n.user_id = ?
     ORDER BY n.created_at DESC
     LIMIT ? OFFSET ?`,
      "SELECT COUNT(*) AS total FROM alert_notifications WHERE user_id = ?",
      [data.userId],
      data.page,
      data.pageSize,
    );
  });
}

export async function deleteAlertNotification(id: string): Promise<boolean> {
  return deleteById("alert_notifications", id);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  return withDbError(async () => {
    await execute(
      "UPDATE alert_notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL",
      [idSchema.parse(userId)],
    );
  });
}
