import { z } from "zod";
import { paginationSchema, idSchema } from "../common";

export const createAlertNotificationSchema = z.object({
  userId: idSchema,
  alert_uuid: z.uuid(),
  transaction_id: z.uuid(),
});

export const alertNotificationListQuerySchema = paginationSchema.extend({
  userId: idSchema,
});

export const updateAlertNotificationSchema = z
  .object({
    userId: idSchema.optional(),
    alert_uuid: z.uuid().optional(),
    transaction_id: z.uuid().optional(),
    read_at: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });
export const updateAlertNotificationParamsSchema = z.object({
  id: idSchema,
  input: updateAlertNotificationSchema.or(z.object({}).strict()),
});

export type AlertNotification = {
  id: string;
  user_id: string;
  alert_uuid: string;
  transaction_id: string;
  read_at: string | null;
  created_at: string;
};

export type CreateAlertNotification = z.infer<
  typeof createAlertNotificationSchema
>;
export type UpdateAlertNotification = z.infer<
  typeof updateAlertNotificationSchema
>;
export type UpdateAlertNotificationParams = z.infer<
  typeof updateAlertNotificationParamsSchema
>;
export type AlertNotificationListQuery = z.infer<
  typeof alertNotificationListQuerySchema
>;

export type AlertNotificationWithDetails = AlertNotification & {
  resale_price: number;
  floor_area_sqm: number;
  transaction_month: string;
  town_id: string;
  town_name: string;
  block: string;
  street_name: string;
  flat_type_name: string;
  flat_model_name: string;
  min_storey: number;
  max_storey: number;
};
