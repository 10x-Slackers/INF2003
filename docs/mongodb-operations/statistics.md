# Statistics Collection Functions

Source: `lib/collections/statistics/functions.ts`

Output examples use placeholder strings to show shape and type, not real data.
Dimension fields can be `null`; object examples show the non-null shape.

## Stored metrics and document shape

The collection stores these four computed resale-transaction series only. Every metric is generated at both `monthly` and `yearly` granularities.

| Metric enum                           | `series[].value`                      | Populated dimensions       |
| ------------------------------------- | ------------------------------------- | -------------------------- |
| `AVG_PRICE_BY_FLAT_TYPE`              | Average resale price                  | `flatTypeId`               |
| `AVG_PRICE_BY_PROPERTY_AND_FLAT_TYPE` | Average resale price                  | `propertyId`, `flatTypeId` |
| `AVG_PRICE_PER_SQM_BY_FLAT_TYPE`      | Average resale price per square metre | `flatTypeId`               |
| `AVG_PRICE_BY_TOWN_AND_FLAT_TYPE`     | Average resale price                  | `townId`, `flatTypeId`     |

## `saveStats(input)`

```js
db.statistics.bulkWrite([
  {
    updateOne: {
      filter: { _id },
      update: { $set: fields },
      upsert: true,
    },
  },
]);
```

Input: `StatisticsUpsert[]` (must be non-empty; empty arrays are no-ops).

No return value.

## `getStatisticsByMetricAndDimensions(input)`

```js
db.statistics.findOne({
  ...providedFields,
});
```

Optional params: `metric`, `granularity`, `dimensions`.

Output:

```json
{
  "_id": "<string>",
  "metric": "<metric>",
  "granularity": "<monthly_or_yearly>",
  "timeRange": {
    "start": "<period_start>",
    "end": "<period_end>"
  },
  "dimensions": {
    "townId": "<uuid_or_null>",
    "flatTypeId": "<string_or_null>",
    "propertyId": "<string_or_null>"
  },
  "series": [
    {
      "period": "<period>",
      "value": "<number>",
      "sampleSize": "<number>"
    }
  ],
  "computedAt": "<unix_timestamp_seconds>"
}
```

Returns `null` when no document matches.
