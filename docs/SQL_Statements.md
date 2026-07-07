# SQL Statements

## Auth Functions

Sources: `lib/auth/signup.ts`, `lib/auth/index.ts`

### `signup(request)`

```sql
INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?);
```

### `authorize(credentials)`

```sql
SELECT id, name, email, password_hash, role FROM users WHERE email = ? LIMIT 1;
```

## User Functions

Source: `lib/tables/users/functions.ts`

### `listUsers(input)`

```sql
SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY created_at LIMIT ? OFFSET ?;
```

Optional params: `page`, `pageSize`.

```sql
SELECT COUNT(*) AS total FROM users;
```

### `getUserById(id)`

```sql
SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ? LIMIT 1;
```

### `createUser(input)`

```sql
INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?);
```

Optional params: `role`; defaults to `USER` before the query runs.

### `updateUser(input)`

```sql
UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?;
```

Optional params: `name`, `email`, `role`. At least one update field is required; empty input returns the current row instead of running this query.

### `deleteUser(id)`

```sql
DELETE FROM users WHERE id = ?;
```

## Town Functions

Source: `lib/tables/towns/functions.ts`

### `listTowns(input)`

```sql
SELECT id, region, name
FROM towns
WHERE region = ?
ORDER BY name LIMIT ? OFFSET ?;
```

Optional params: `region`, `page`, `pageSize`.

```sql
SELECT COUNT(*) AS total FROM towns WHERE region = ?;
```

Optional params: `region`.

### `getTownById(id)`

```sql
SELECT id, region, name FROM towns WHERE id = ? LIMIT 1;
```

### `listPropertiesByTown(input)`

```sql
SELECT id, town_id, block, street_name, lease_commence_year
FROM properties
WHERE town_id = ?
ORDER BY block, street_name
LIMIT ? OFFSET ?;
```

Optional params: `page`, `pageSize`.

```sql
SELECT COUNT(*) AS total FROM properties WHERE town_id = ?;
```

### `listAllAmenitiesByTown(townId)`

```sql
SELECT id, town_id, amenity_type_id, name, street_name, postal_code, longitude, latitude
FROM amenities
WHERE town_id = ?
ORDER BY name;
```

## Amenity Functions

Source: `lib/tables/amenities/functions.ts`

### `listAmenities(filters)`

```sql
SELECT id, town_id, amenity_type_id, name, street_name, postal_code, longitude, latitude
FROM amenities
WHERE town_id = ? AND amenity_type_id = ?
ORDER BY name
LIMIT ? OFFSET ?;
```

Optional params: `town_id`, `amenity_type_id`, `page`, `pageSize`. If only one filter is supplied, only that condition is included.

```sql
SELECT COUNT(*) AS total
FROM amenities
WHERE town_id = ? AND amenity_type_id = ?;
```

Optional params: `town_id`, `amenity_type_id`. If only one filter is supplied, only that condition is included.

### `getAmenityById(id)`

```sql
SELECT id, town_id, amenity_type_id, name, street_name, postal_code, longitude, latitude
FROM amenities
WHERE id = ?
LIMIT 1;
```

## Lookup Functions

Source: `lib/tables/lookups/functions.ts`

### `listFlatTypes()`

```sql
SELECT id, name FROM flat_types ORDER BY name;
```

### `listFlatModels()`

```sql
SELECT id, name FROM flat_models ORDER BY name;
```

### `listStoreyRanges()`

```sql
SELECT id, min_storey, max_storey FROM storey_ranges ORDER BY min_storey;
```

### `listAmenityTypes()`

```sql
SELECT id, name FROM amenity_types ORDER BY name;
```

## Property Functions

Source: `lib/tables/properties/functions.ts`

### `getPropertiesWithLatestTransaction(propertyIds)`

```sql
SELECT p.id, p.town_id, p.block, p.street_name, p.lease_commence_year,
       lt.id AS lt_id, lt.uploaded_by_user_id AS lt_uploaded_by_user_id,
       lt.property_id AS lt_property_id, lt.flat_type_id AS lt_flat_type_id,
       lt.flat_model_id AS lt_flat_model_id, lt.storey_range_id AS lt_storey_range_id,
       lt.floor_area_sqm AS lt_floor_area_sqm,
       lft.name AS lt_flat_type_name, lfm.name AS lt_flat_model_name,
       lsr.min_storey AS lt_min_storey, lsr.max_storey AS lt_max_storey,
       lt.resale_price AS lt_resale_price,
       lt.transaction_month AS lt_transaction_month
FROM properties p
LEFT JOIN resale_transactions lt ON lt.id = (
  SELECT rt2.id
  FROM resale_transactions rt2
  WHERE rt2.property_id = p.id
  ORDER BY rt2.transaction_month DESC, rt2.id DESC
  LIMIT 1
)
LEFT JOIN flat_types lft ON lft.id = lt.flat_type_id
LEFT JOIN flat_models lfm ON lfm.id = lt.flat_model_id
LEFT JOIN storey_ranges lsr ON lsr.id = lt.storey_range_id
WHERE p.id IN (?);
```

### `listProperties(filters)`

```sql
SELECT p.id, p.town_id, p.block, p.street_name, p.lease_commence_year,
       lt.id AS lt_id, lt.uploaded_by_user_id AS lt_uploaded_by_user_id,
       lt.property_id AS lt_property_id, lt.flat_type_id AS lt_flat_type_id,
       lt.flat_model_id AS lt_flat_model_id, lt.storey_range_id AS lt_storey_range_id,
       lt.floor_area_sqm AS lt_floor_area_sqm,
       lft.name AS lt_flat_type_name, lfm.name AS lt_flat_model_name,
       lsr.min_storey AS lt_min_storey, lsr.max_storey AS lt_max_storey,
       lt.resale_price AS lt_resale_price,
       lt.transaction_month AS lt_transaction_month
FROM properties p
LEFT JOIN resale_transactions lt ON lt.id = (
  SELECT rt2.id
  FROM resale_transactions rt2
  WHERE rt2.property_id = p.id
  ORDER BY rt2.transaction_month DESC, rt2.id DESC
  LIMIT 1
)
LEFT JOIN flat_types lft ON lft.id = lt.flat_type_id
LEFT JOIN flat_models lfm ON lfm.id = lt.flat_model_id
LEFT JOIN storey_ranges lsr ON lsr.id = lt.storey_range_id
WHERE p.town_id = ? AND lt.flat_type_id = ? AND lt.flat_model_id = ?
  AND lt.resale_price >= ? AND lt.resale_price <= ?
ORDER BY p.block, p.street_name
LIMIT ? OFFSET ?;
```

Optional params: `town_id`, `flat_type_id`, `flat_model_id`, `price_min`, `price_max`, `page`, `pageSize`. Only supplied filters are included.

```sql
SELECT COUNT(*) AS total
FROM properties p
LEFT JOIN resale_transactions lt ON lt.id = (
  SELECT rt2.id
  FROM resale_transactions rt2
  WHERE rt2.property_id = p.id
  ORDER BY rt2.transaction_month DESC, rt2.id DESC
  LIMIT 1
)
LEFT JOIN flat_types lft ON lft.id = lt.flat_type_id
LEFT JOIN flat_models lfm ON lfm.id = lt.flat_model_id
LEFT JOIN storey_ranges lsr ON lsr.id = lt.storey_range_id
WHERE p.town_id = ? AND lt.flat_type_id = ? AND lt.flat_model_id = ?
  AND lt.resale_price >= ? AND lt.resale_price <= ?;
```

Optional params: `town_id`, `flat_type_id`, `flat_model_id`, `price_min`, `price_max`. The joins are included only when filtering by transaction fields.

### `getPropertyRowById(id)`

```sql
SELECT id, town_id, block, street_name, lease_commence_year
FROM properties
WHERE id = ?
LIMIT 1;
```

### `createProperty(input)`

```sql
INSERT INTO properties (town_id, block, street_name, lease_commence_year)
VALUES (?, ?, ?, ?)
RETURNING id;
```

### `updateProperty(input)`

```sql
UPDATE properties
SET town_id = ?, block = ?, street_name = ?, lease_commence_year = ?
WHERE id = ?;
```

Optional params: `town_id`, `block`, `street_name`, `lease_commence_year`. At least one update field is required; empty input returns the current row instead of running this query.

### `deleteProperty(id)`

```sql
DELETE FROM properties WHERE id = ?;
```

### `lookupProperty(input)`

```sql
SELECT id
FROM properties
WHERE town_id = ? AND block = ? AND street_name = ? AND lease_commence_year = ?
LIMIT 1;
```

## Saved Property Functions

Source: `lib/tables/saved-properties/functions.ts`

### `listSavedProperties(input)`

```sql
SELECT id, user_id, property_id, created_at
FROM saved_properties
WHERE user_id = ?
ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

Optional params: `page`, `pageSize`.

```sql
SELECT COUNT(*) AS total FROM saved_properties WHERE user_id = ?;
```

### `getSavedPropertyById(id)`

```sql
SELECT id, user_id, property_id, created_at FROM saved_properties WHERE id = ? LIMIT 1;
```

### `createSavedProperty(input)`

```sql
INSERT INTO saved_properties (user_id, property_id) VALUES (?, ?);
```

### `updateSavedProperty(input)`

```sql
UPDATE saved_properties SET user_id = ?, property_id = ? WHERE id = ?;
```

Optional params: `userId`, `propertyId`. At least one update field is required.

### `deleteSavedProperty(id)`

```sql
DELETE FROM saved_properties WHERE id = ?;
```

### `isPropertySaved(input)`

```sql
SELECT id FROM saved_properties WHERE user_id = ? AND property_id = ? LIMIT 1;
```

## Alert Notification Functions

Source: `lib/tables/alert-notifications/functions.ts`

### `fetchRow(id)`

```sql
SELECT id, user_id, alert_uuid, transaction_id, read_at, created_at
FROM alert_notifications
WHERE id = ?
LIMIT 1;
```

### `listAlertNotifications(input)`

```sql
SELECT id, user_id, alert_uuid, transaction_id, read_at, created_at
FROM alert_notifications
WHERE user_id = ?
ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

Optional params: `page`, `pageSize`.

```sql
SELECT COUNT(*) AS total
FROM alert_notifications
WHERE user_id = ?;
```

### `getUnreadCount(userId)`

```sql
SELECT COUNT(*) AS total
FROM alert_notifications
WHERE user_id = ? AND read_at IS NULL;
```

### `createAlertNotification(input)`

```sql
INSERT INTO alert_notifications (user_id, alert_uuid, transaction_id)
VALUES (?, ?, ?)
RETURNING id;
```

### `updateAlertNotification(input)`

```sql
UPDATE alert_notifications
SET user_id = ?, alert_uuid = ?, transaction_id = ?, read_at = ?
WHERE id = ?;
```

Optional params: `userId`, `alert_uuid`, `transaction_id`, `read_at`. At least one update field is required; empty input returns the current row instead of running this query.

### `markAlertNotificationRead(id)`

```sql
UPDATE alert_notifications
SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
WHERE id = ?;
```

### `deleteAlertNotification(id)`

```sql
DELETE FROM alert_notifications WHERE id = ?;
```

## Transaction Functions

Source: `lib/tables/transactions/functions.ts`

### `listTransactions(filters)`

```sql
SELECT rt.id AS id, rt.uploaded_by_user_id AS uploaded_by_user_id,
       rt.property_id AS property_id, rt.flat_type_id AS flat_type_id,
       rt.flat_model_id AS flat_model_id, rt.storey_range_id AS storey_range_id,
       rt.floor_area_sqm AS floor_area_sqm, rt.transaction_month AS transaction_month,
       rt.resale_price AS resale_price,
       p.town_id AS town_id, t.name AS town_name, p.block AS block,
       p.street_name AS street_name, p.lease_commence_year AS lease_commence_year,
       ft.name AS flat_type_name, fm.name AS flat_model_name,
       sr.min_storey AS min_storey, sr.max_storey AS max_storey,
       u.name AS uploaded_by_user_name
FROM resale_transactions rt
JOIN properties p ON p.id = rt.property_id
JOIN towns t ON t.id = p.town_id
JOIN flat_types ft ON ft.id = rt.flat_type_id
JOIN flat_models fm ON fm.id = rt.flat_model_id
JOIN storey_ranges sr ON sr.id = rt.storey_range_id
LEFT JOIN users u ON u.id = rt.uploaded_by_user_id
WHERE p.town_id = ? AND rt.flat_type_id = ? AND rt.flat_model_id = ?
  AND rt.storey_range_id = ? AND rt.resale_price >= ? AND rt.resale_price <= ?
  AND YEAR(rt.transaction_month) = ? AND rt.property_id = ?
ORDER BY rt.transaction_month DESC
LIMIT ? OFFSET ?;
```

Optional params: `town_id`, `flat_type_id`, `flat_model_id`, `storey_range_id`, `price_min`, `price_max`, `year`, `property_id`, `page`, `pageSize`. Only supplied filters are included.

```sql
SELECT COUNT(*) AS total
FROM resale_transactions rt
JOIN properties p ON p.id = rt.property_id
JOIN towns t ON t.id = p.town_id
JOIN flat_types ft ON ft.id = rt.flat_type_id
JOIN flat_models fm ON fm.id = rt.flat_model_id
JOIN storey_ranges sr ON sr.id = rt.storey_range_id
LEFT JOIN users u ON u.id = rt.uploaded_by_user_id
WHERE p.town_id = ? AND rt.flat_type_id = ? AND rt.flat_model_id = ?
  AND rt.storey_range_id = ? AND rt.resale_price >= ? AND rt.resale_price <= ?
  AND YEAR(rt.transaction_month) = ? AND rt.property_id = ?;
```

Optional params: `town_id`, `flat_type_id`, `flat_model_id`, `storey_range_id`, `price_min`, `price_max`, `year`, `property_id`.

### `getTransactionStatistics(input)`

```sql
SELECT YEAR(rt.transaction_month) AS transaction_year,
       MONTH(rt.transaction_month) AS transaction_month,
       AVG(rt.resale_price) AS value,
       COUNT(*) AS sample_size
FROM resale_transactions rt
JOIN properties p ON p.id = rt.property_id
JOIN storey_ranges sr ON sr.id = rt.storey_range_id
WHERE rt.transaction_month >= ? AND rt.transaction_month < ?
  AND rt.transaction_month >= DATE_SUB((SELECT MAX(transaction_month) FROM resale_transactions), INTERVAL 5 MONTH)
  AND p.town_id = ? AND rt.flat_type_id = ? AND rt.property_id = ?
  AND rt.storey_range_id = ?
GROUP BY YEAR(rt.transaction_month), MONTH(rt.transaction_month)
ORDER BY transaction_year, transaction_month;
```

Optional params: `date_from`, `date_to`, `town_id`, `flat_type_id`, `property_id`, `storey_range_id`. The 6-month filter limits the result to the latest 6 transaction months in the database.

### `getTransactionById(id)`

```sql
SELECT rt.id AS id, rt.uploaded_by_user_id AS uploaded_by_user_id,
       rt.property_id AS property_id, rt.flat_type_id AS flat_type_id,
       rt.flat_model_id AS flat_model_id, rt.storey_range_id AS storey_range_id,
       rt.floor_area_sqm AS floor_area_sqm, rt.transaction_month AS transaction_month,
       rt.resale_price AS resale_price
FROM resale_transactions rt
WHERE rt.id = ?
LIMIT 1;
```

### `createTransaction(input)`

```sql
INSERT INTO resale_transactions
  (uploaded_by_user_id, property_id, flat_type_id, flat_model_id,
   storey_range_id, floor_area_sqm, transaction_month, resale_price)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
RETURNING id;
```

### `updateTransaction(input)`

```sql
UPDATE resale_transactions
SET flat_type_id = ?, flat_model_id = ?, storey_range_id = ?,
    floor_area_sqm = ?, transaction_month = ?, resale_price = ?
WHERE id = ?;
```

Optional params: `flat_type_id`, `flat_model_id`, `storey_range_id`, `floor_area_sqm`, `transaction_month`, `resale_price`. At least one update field is required; empty input returns the current row instead of running this query.

### `deleteTransaction(id)`

```sql
DELETE FROM resale_transactions WHERE id = ?;
```
