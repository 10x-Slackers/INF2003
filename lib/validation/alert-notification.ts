import { z } from "zod";

export const createAlertNotificationSchema = z.object({
  alert_uuid: z.uuid(),
  transaction_id: z.uuid(),
});
