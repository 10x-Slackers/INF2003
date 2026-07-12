import { execute, query } from "@/lib/db";
import { withDbError } from "@/lib/utils";
import {
  createSavedPropertySchema,
  savedPropertyIdentitySchema,
  type CreateSavedProperty,
  type SavedPropertyDetail,
  type SavedPropertyIdentity,
  type SavedPropertyRow,
} from "./types";
import { idSchema } from "../common";

function toSavedPropertyDetail(row: SavedPropertyRow): SavedPropertyDetail {
  return {
    id: row.id,
    user_id: row.user_id,
    property_id: row.property_id,
    created_at: row.created_at,
    property:
      row.p_id === null
        ? null
        : {
            id: row.p_id,
            town_id: row.p_town_id!,
            block: row.p_block!,
            street_name: row.p_street_name!,
            lease_commence_year: row.p_lease_commence_year!,
            town_name: row.town_name!,
            latest_transaction:
              row.lt_id === null
                ? null
                : {
                    id: row.lt_id,
                    uploaded_by_user_id: row.lt_uploaded_by_user_id,
                    property_id: row.lt_property_id!,
                    flat_type_id: row.lt_flat_type_id!,
                    flat_model_id: row.lt_flat_model_id!,
                    storey_range_id: row.lt_storey_range_id!,
                    floor_area_sqm: row.lt_floor_area_sqm!,
                    flat_type: row.lt_flat_type_name!,
                    flat_model: row.lt_flat_model_name!,
                    min_storey: row.lt_min_storey!,
                    max_storey: row.lt_max_storey!,
                    resale_price: row.lt_resale_price!,
                    transaction_month: row.lt_transaction_month!,
                  },
          },
  };
}

export async function listSavedProperties(
  userId: string,
): Promise<SavedPropertyDetail[]> {
  return withDbError(async () => {
    const rows = await query<SavedPropertyRow>(
      `SELECT sp.id, sp.user_id, sp.property_id, sp.created_at,
              p.id AS p_id, p.town_id AS p_town_id, p.block AS p_block,
              p.street_name AS p_street_name,
              p.lease_commence_year AS p_lease_commence_year,
              t.name AS town_name,
              lt.id AS lt_id, lt.uploaded_by_user_id AS lt_uploaded_by_user_id,
              lt.property_id AS lt_property_id,
              lt.flat_type_id AS lt_flat_type_id,
              lt.flat_model_id AS lt_flat_model_id,
              lt.storey_range_id AS lt_storey_range_id,
              lt.floor_area_sqm AS lt_floor_area_sqm,
              lft.name AS lt_flat_type_name, lfm.name AS lt_flat_model_name,
              lsr.min_storey AS lt_min_storey, lsr.max_storey AS lt_max_storey,
              lt.resale_price AS lt_resale_price,
              lt.transaction_month AS lt_transaction_month
       FROM saved_properties sp
       LEFT JOIN properties p ON p.id = sp.property_id
       LEFT JOIN towns t ON t.id = p.town_id
       LEFT JOIN (
         SELECT rt.*, ROW_NUMBER() OVER (
           PARTITION BY rt.property_id
           ORDER BY rt.transaction_month DESC, rt.id DESC
         ) AS rn
         FROM resale_transactions rt
       ) lt ON lt.property_id = p.id AND lt.rn = 1
       LEFT JOIN flat_types lft ON lft.id = lt.flat_type_id
       LEFT JOIN flat_models lfm ON lfm.id = lt.flat_model_id
       LEFT JOIN storey_ranges lsr ON lsr.id = lt.storey_range_id
       WHERE sp.user_id = ?
       ORDER BY sp.created_at DESC`,
      [idSchema.parse(userId)],
    );
    return rows.map(toSavedPropertyDetail);
  });
}

export async function createSavedProperty(
  input: CreateSavedProperty,
): Promise<string> {
  return withDbError(async () => {
    const data = createSavedPropertySchema.parse(input);
    const result = await query<{ id: string }>(
      "INSERT INTO saved_properties (user_id, property_id) VALUES (?, ?) RETURNING id",
      [data.userId, data.propertyId],
    );
    return result[0].id;
  });
}

export async function isPropertySaved(
  input: SavedPropertyIdentity,
): Promise<boolean> {
  return withDbError(async () => {
    const data = savedPropertyIdentitySchema.parse(input);
    const rows = await query<{ id: string }>(
      "SELECT id FROM saved_properties WHERE user_id = ? AND property_id = ? LIMIT 1",
      [data.userId, data.propertyId],
    );
    return rows.length > 0;
  });
}

export async function deleteSavedPropertyByUserAndProperty(
  input: SavedPropertyIdentity,
): Promise<boolean> {
  return withDbError(async () => {
    const data = savedPropertyIdentitySchema.parse(input);
    const result = await execute(
      "DELETE FROM saved_properties WHERE user_id = ? AND property_id = ?",
      [data.userId, data.propertyId],
    );
    return result.affectedRows > 0;
  });
}
