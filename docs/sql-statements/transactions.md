# Transaction Functions

Source: `lib/tables/transactions/functions.ts`

## `listTransactions(filters)`

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

Optional params: `town_id`, `flat_type_id`, `flat_model_id`, `storey_range_id`, `price_min`, `price_max`, `year`, `property_id`
Params:`page`, `pageSize`.

Returned columns: `id, uploaded_by_user_id, property_id, flat_type_id, flat_model_id, storey_range_id, floor_area_sqm, transaction_month, resale_price, town_id, town_name, block, street_name, lease_commence_year, flat_type_name, flat_model_name, min_storey, max_storey, uploaded_by_user_name`

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

Returned columns: `total`

## `getTransactionStatistics(input)`

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

Optional params: `date_from`, `date_to`, `town_id`, `flat_type_id`, `property_id`, `storey_range_id`.

Returned columns: `transaction_year, transaction_month, value, sample_size`

## `getTransactionById(id)`

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

Returned columns: `id, uploaded_by_user_id, property_id, flat_type_id, flat_model_id, storey_range_id, floor_area_sqm, transaction_month, resale_price`

## `createTransaction(input)`

```sql
INSERT INTO resale_transactions
  (uploaded_by_user_id, property_id, flat_type_id, flat_model_id,
   storey_range_id, floor_area_sqm, transaction_month, resale_price)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
RETURNING id;
```

Returned columns: `id`

## `updateTransaction(input)`

```sql
UPDATE resale_transactions
SET flat_type_id = ?, flat_model_id = ?, storey_range_id = ?,
    floor_area_sqm = ?, transaction_month = ?, resale_price = ?
WHERE id = ?;
```

Optional params: `flat_type_id`, `flat_model_id`, `storey_range_id`, `floor_area_sqm`, `transaction_month`, `resale_price`.

## `deleteTransaction(id)`

```sql
DELETE FROM resale_transactions WHERE id = ?;
```
