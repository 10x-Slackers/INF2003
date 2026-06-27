import { execute, query } from "@/lib/db";
import { HttpError } from "@/lib/http-error";
import { isMissingReferenceError } from "@/lib/db-errors";
import type {
  CreateTransactionPayload,
  ResaleTransaction,
  UpdateTransactionPayload,
} from "@/lib/types";

export async function listTransactions(filters: {
  town_id?: string;
  flat_type_id?: number;
  storey_range_id?: number;
  price_min?: number;
  price_max?: number;
  year?: number;
  property_id?: string;
  page: number;
  pageSize: number;
}): Promise<{ data: ResaleTransaction[]; total: number }> {
  const { page, pageSize } = filters;
  const conditions: string[] = [];
  const params: unknown[] = [];
  const needsPropertyJoin = filters.town_id !== undefined;

  if (filters.town_id !== undefined) {
    conditions.push("p.town_id = ?");
    params.push(filters.town_id);
  }
  if (filters.flat_type_id !== undefined) {
    conditions.push("rt.flat_type_id = ?");
    params.push(filters.flat_type_id);
  }
  if (filters.storey_range_id !== undefined) {
    conditions.push("rt.storey_range_id = ?");
    params.push(filters.storey_range_id);
  }
  if (filters.price_min !== undefined) {
    conditions.push("rt.resale_price >= ?");
    params.push(filters.price_min);
  }
  if (filters.price_max !== undefined) {
    conditions.push("rt.resale_price <= ?");
    params.push(filters.price_max);
  }
  if (filters.year !== undefined) {
    conditions.push("YEAR(rt.transaction_month) = ?");
    params.push(filters.year);
  }
  if (filters.property_id !== undefined) {
    conditions.push("rt.property_id = ?");
    params.push(filters.property_id);
  }

  const join = needsPropertyJoin ? "JOIN properties p ON p.id = rt.property_id" : "";
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows, countRows] = await Promise.all([
    query<ResaleTransaction>(
      `SELECT rt.id, rt.uploaded_by_user_id, rt.property_id, rt.flat_type_id,
              rt.flat_model_id, rt.storey_range_id, rt.floor_area_sqm,
              rt.transaction_month, rt.resale_price
       FROM resale_transactions rt
       ${join}
       ${where}
       ORDER BY rt.transaction_month DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize],
    ),
    query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM resale_transactions rt ${join} ${where}`,
      params,
    ),
  ]);

  return { data: rows, total: countRows[0].total };
}

export async function getTransactionById(
  id: string,
): Promise<ResaleTransaction | null> {
  const rows = await query<ResaleTransaction>(
    `SELECT id, uploaded_by_user_id, property_id, flat_type_id, flat_model_id,
            storey_range_id, floor_area_sqm, transaction_month, resale_price
     FROM resale_transactions WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function createTransaction(
  payload: CreateTransactionPayload,
  uploadedByUserId: string,
): Promise<ResaleTransaction> {
  let inserted: { id: string };
  try {
    [inserted] = await query<{ id: string }>(
      `INSERT INTO resale_transactions
         (uploaded_by_user_id, property_id, flat_type_id, flat_model_id,
          storey_range_id, floor_area_sqm, transaction_month, resale_price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [
        uploadedByUserId,
        payload.property_id,
        payload.flat_type_id,
        payload.flat_model_id,
        payload.storey_range_id,
        payload.floor_area_sqm,
        payload.transaction_month,
        payload.resale_price,
      ],
    );
  } catch (err) {
    if (isMissingReferenceError(err)) {
      throw new HttpError(
        400,
        "Invalid reference: property_id, flat_type_id, flat_model_id, or storey_range_id does not exist",
      );
    }
    throw err;
  }

  const transaction = await getTransactionById(inserted.id);
  if (!transaction) {
    throw new HttpError(500, "Failed to read back created transaction");
  }
  return transaction;
}

export async function updateTransaction(
  id: string,
  payload: UpdateTransactionPayload,
): Promise<ResaleTransaction | null> {
  const existing = await getTransactionById(id);
  if (!existing) return null;

  const fields: string[] = [];
  const params: (string | number)[] = [];
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      params.push(value);
    }
  }

  if (fields.length === 0) return existing;

  try {
    await execute(`UPDATE resale_transactions SET ${fields.join(", ")} WHERE id = ?`, [
      ...params,
      id,
    ]);
  } catch (err) {
    if (isMissingReferenceError(err)) {
      throw new HttpError(400, "Invalid reference in update payload");
    }
    throw err;
  }

  return getTransactionById(id);
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const result = await execute("DELETE FROM resale_transactions WHERE id = ?", [id]);
  return result.affectedRows > 0;
}
