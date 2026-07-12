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
  AND rt.transaction_month >= ? AND rt.transaction_month < ? AND rt.property_id = ?
ORDER BY rt.transaction_month DESC
LIMIT ? OFFSET ?;
```

Params for the year range: `${year}-01-01` and `${year + 1}-01-01`.

Optional params: `town_id`, `flat_type_id`, `flat_model_id`, `storey_range_id`, `price_min`, `price_max`, `year`, `property_id`.
Params: `page`, `pageSize`.
Only provided filters are included in `WHERE`.

Returned columns: `id, uploaded_by_user_id, property_id, flat_type_id, flat_model_id, storey_range_id, floor_area_sqm, transaction_month, resale_price, town_id, town_name, block, street_name, lease_commence_year, flat_type_name, flat_model_name, min_storey, max_storey, uploaded_by_user_name`

```sql
SELECT COUNT(*) AS total
FROM resale_transactions rt
[JOIN properties p ON p.id = rt.property_id]
WHERE p.town_id = ? AND rt.flat_type_id = ? AND rt.flat_model_id = ?
  AND rt.storey_range_id = ? AND rt.resale_price >= ? AND rt.resale_price <= ?
  AND rt.transaction_month >= ? AND rt.transaction_month < ? AND rt.property_id = ?;
```

Params for the year range: `${year}-01-01` and `${year + 1}-01-01`.

The `JOIN properties` is only included when `town_id` is provided; otherwise the count runs on `resale_transactions` alone.

Optional params: `town_id`, `flat_type_id`, `flat_model_id`, `storey_range_id`, `price_min`, `price_max`, `year`, `property_id`.
Only provided filters are included in `WHERE`.

Returned columns: `total`

## `getTransactionStatistics(input)`

### Query template

```sql
SELECT {selectGroups}, {metric} AS value, COUNT(*) AS sample_size
FROM resale_transactions rt
{propertyJoin}
{where}
GROUP BY {groupBy}
ORDER BY {orderBy};
```

The `properties` join is only included when filtering/grouping by `town_id`.

### Metric expressions

| `metric`            | Expression                                                 |
| ------------------- | ---------------------------------------------------------- |
| `avg_price`         | `CAST(AVG(rt.resale_price) AS DOUBLE)`                     |
| `avg_price_per_sqm` | `CAST(AVG(rt.resale_price / rt.floor_area_sqm) AS DOUBLE)` |
| `sales_count`       | `COUNT(*)`                                                 |

### Group expressions

| `groupBy`      | Expression                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `period`       | `DATE_FORMAT(rt.transaction_month, '%Y-%m')` (monthly / last 6 months) or `DATE_FORMAT(rt.transaction_month, '%Y')` (yearly) |
| `town_id`      | `p.town_id`                                                                                                                  |
| `flat_type_id` | `rt.flat_type_id`                                                                                                            |
| `property_id`  | `rt.property_id`                                                                                                             |

### WHERE conditions (all optional)

| Param                           | Condition                                                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `date_from`                     | `rt.transaction_month >= ?`                                                                                    |
| `date_to`                       | `rt.transaction_month < ?`                                                                                     |
| `granularity` = `last 6 months` | `rt.transaction_month >= DATE_SUB((SELECT MAX(transaction_month) FROM resale_transactions), INTERVAL 5 MONTH)` |
| `town_id`                       | `p.town_id = ?`                                                                                                |
| `flat_type_id`                  | `rt.flat_type_id = ?`                                                                                          |
| `property_id`                   | `rt.property_id = ?`                                                                                           |

Params: `metric`, `granularity`, `groupBy` (array, min 1, unique).
Optional params: `date_from`, `date_to`, `town_id`, `flat_type_id`, `property_id`.
The selected group columns, metric expression, `GROUP BY`, `ORDER BY`, and optional `WHERE` filters are built from the input.

Returned columns: selected `groupBy` columns, `value`, `sample_size`.

## `getTownSalesCounts6Months()`

Delegates to `getTransactionStatistics({ metric: "sales_count", granularity: "last 6 months", groupBy: ["town_id"] })`.

```sql
SELECT p.town_id AS town_id,
       COUNT(*) AS value,
       COUNT(*) AS sample_size
FROM resale_transactions rt
JOIN properties p ON p.id = rt.property_id
JOIN storey_ranges sr ON sr.id = rt.storey_range_id
WHERE rt.transaction_month >= DATE_SUB((SELECT MAX(transaction_month) FROM resale_transactions), INTERVAL 5 MONTH)
GROUP BY p.town_id
ORDER BY town_id;
```

Returned columns: `town_id, value, sample_size`

## `createTransaction(input)`

```sql
INSERT INTO resale_transactions
  (uploaded_by_user_id, property_id, flat_type_id, flat_model_id,
   storey_range_id, floor_area_sqm, transaction_month, resale_price)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
RETURNING id;
```

Returned columns: `id`
