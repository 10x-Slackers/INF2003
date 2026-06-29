import { z } from "zod";
import { paginationSchema, idSchema } from "../common";

export const createAlertNotificationSchema = z.object({
  alert_uuid: z.uuid(),
  transaction_id: z.uuid(),
});

export const alertNotificationListQuerySchema = paginationSchema.extend({
  userId: idSchema,
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
export type AlertNotificationListQuery = z.infer<
  typeof alertNotificationListQuerySchema
>;
