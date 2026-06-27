import { db, execute, query } from "@/lib/db";
import { HttpError } from "@/lib/http-error";
import { isMissingReferenceError } from "@/lib/db-errors";
import type {
  Alert,
  AlertNotification,
  AlertNotificationDetail,
  ResaleTransaction,
} from "@/lib/types";

const SELECT_COLUMNS =
  "id, user_id, alert_uuid, transaction_id, read_at, created_at";

function alerts() {
  return db.collection<Alert>("alerts");
}

async function fetchRow(id: string): Promise<AlertNotification | null> {
  const rows = await query<AlertNotification>(
    `SELECT ${SELECT_COLUMNS} FROM alert_notifications WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

async function attachTransactions(
  rows: AlertNotification[],
): Promise<AlertNotificationDetail[]> {
  if (rows.length === 0) return [];
  const ids = [...new Set(rows.map((row) => row.transaction_id))];
  const placeholders = ids.map(() => "?").join(", ");
  const transactions = await query<ResaleTransaction>(
    `SELECT id, uploaded_by_user_id, property_id, flat_type_id, flat_model_id,
            storey_range_id, floor_area_sqm, transaction_month, resale_price
     FROM resale_transactions WHERE id IN (${placeholders})`,
    ids,
  );
  const byId = new Map(transactions.map((t) => [t.id, t]));
  return rows.map((row) => ({
    ...row,
    transaction: byId.get(row.transaction_id) ?? null,
  }));
}

export async function listAlertNotifications(
  userId: string,
  page: number,
  pageSize: number,
): Promise<{ data: AlertNotificationDetail[]; total: number }> {
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

  return { data: await attachTransactions(rows), total: countRows[0].total };
}

export async function getAlertNotificationById(
  id: string,
): Promise<AlertNotificationDetail | null> {
  const row = await fetchRow(id);
  if (!row) return null;
  const [detail] = await attachTransactions([row]);
  return detail;
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
  const alert = await alerts().findOne({ _id: alertUuid });
  if (!alert) {
    throw new HttpError(404, "Alert not found");
  }

  // Recipient is derived from the alert document, never trusted from the caller.
  let inserted: { id: string };
  try {
    [inserted] = await query<{ id: string }>(
      `INSERT INTO alert_notifications (user_id, alert_uuid, transaction_id)
       VALUES (?, ?, ?) RETURNING id`,
      [alert.user_id, alertUuid, transactionId],
    );
  } catch (err) {
    if (isMissingReferenceError(err)) {
      throw new HttpError(400, "Invalid transaction_id or user_id");
    }
    throw err;
  }

  // Cross-database write: stamp the alert as triggered in MongoDB. If this fails,
  // roll back the MariaDB row so the two stores stay consistent.
  try {
    await alerts().updateOne(
      { _id: alertUuid },
      { $set: { last_triggered_at: Math.floor(Date.now() / 1000) } },
    );
  } catch (err) {
    await execute("DELETE FROM alert_notifications WHERE id = ?", [
      inserted.id,
    ]);
    throw err;
  }

  const created = await fetchRow(inserted.id);
  if (!created) {
    throw new HttpError(500, "Failed to read back created alert notification");
  }
  return created;
}

export async function markAlertNotificationRead(
  id: string,
): Promise<AlertNotification | null> {
  const existing = await fetchRow(id);
  if (!existing) return null;

  // COALESCE keeps the original read time if it was already marked read.
  await execute(
    `UPDATE alert_notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
     WHERE id = ?`,
    [id],
  );
  return fetchRow(id);
}

export async function deleteAlertNotification(id: string): Promise<boolean> {
  const row = await fetchRow(id);
  if (!row) return false;

  // Delete only this notification. The MongoDB alert document is a standing
  // definition that can produce many notifications, so it must outlive any
  // single one (deleting the alert itself is a separate operation).
  await execute("DELETE FROM alert_notifications WHERE id = ?", [id]);
  return true;
}
