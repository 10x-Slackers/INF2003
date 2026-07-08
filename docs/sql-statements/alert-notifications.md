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

## `bulkCreateAlertNotifications(input)`

```sql
INSERT INTO alert_notifications (user_id, alert_uuid, transaction_id)
VALUES (?, ?, ?);
```

## `updateAlertNotification(input)`

```sql
UPDATE alert_notifications
SET user_id = ?, alert_uuid = ?, transaction_id = ?, read_at = ?
WHERE id = ?;
```

Optional params: `userId`, `alert_uuid`, `transaction_id`, `read_at`.

## `listAlertNotificationsWithDetails(input)`

```sql
SELECT n.id, n.user_id, n.alert_uuid, n.transaction_id, n.read_at, n.created_at,
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
LIMIT ? OFFSET ?;
```

params: `page`, `pageSize`.

Returned columns: `id, user_id, alert_uuid, transaction_id, read_at, created_at, resale_price, floor_area_sqm, transaction_month, town_id, town_name, block, street_name, flat_type_name, flat_model_name, min_storey, max_storey`

```sql
SELECT COUNT(*) AS total FROM alert_notifications WHERE user_id = ?;
```

Returned columns: `total`

## `deleteAlertNotification(id)`

```sql
DELETE FROM alert_notifications WHERE id = ?;
```

## `markAllNotificationsRead(userId)`

```sql
UPDATE alert_notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL;
```
