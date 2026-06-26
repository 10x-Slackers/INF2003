import { z } from "zod";

export const createAlertNotificationSchema = z.object({
  alert_uuid: z.string().uuid(),
  transaction_id: z.string().uuid(),
});
