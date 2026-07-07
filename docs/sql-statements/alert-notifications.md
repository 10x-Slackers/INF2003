# Alert Notification Functions

Source: `lib/tables/alert-notifications/functions.ts`

## `getAlertNotificationById(id)`

```sql
SELECT id, user_id, alert_uuid, transaction_id, read_at, created_at
FROM alert_notifications
WHERE id = ?
LIMIT 1;
```

Returned columns: `id, user_id, alert_uuid, transaction_id, read_at, created_at`

## `listAlertNotifications(input)`

```sql
SELECT id, user_id, alert_uuid, transaction_id, read_at, created_at
FROM alert_notifications
WHERE user_id = ?
ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

params: `page`, `pageSize`.

Returned columns: `id, user_id, alert_uuid, transaction_id, read_at, created_at`

```sql
SELECT COUNT(*) AS total
FROM alert_notifications
WHERE user_id = ?;
```

Returned columns: `total`

## `getUnreadCount(userId)`

```sql
SELECT COUNT(*) AS total
FROM alert_notifications
WHERE user_id = ? AND read_at IS NULL;
```

Returned columns: `total`

## `createAlertNotification(input)`

```sql
INSERT INTO alert_notifications (user_id, alert_uuid, transaction_id)
VALUES (?, ?, ?)
RETURNING id;
```

Returned columns: `id`

## `updateAlertNotification(input)`

```sql
UPDATE alert_notifications
SET user_id = ?, alert_uuid = ?, transaction_id = ?, read_at = ?
WHERE id = ?;
```

Optional params: `userId`, `alert_uuid`, `transaction_id`, `read_at`.

## `markAlertNotificationRead(id)`

```sql
UPDATE alert_notifications
SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
WHERE id = ?;
```

## `deleteAlertNotification(id)`

```sql
DELETE FROM alert_notifications WHERE id = ?;
```
