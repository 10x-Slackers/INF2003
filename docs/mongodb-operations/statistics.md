# Statistics Collection Functions

Source: `lib/collections/statistics/functions.ts`

Output examples use placeholder strings to show shape and type, not real data.
Dimension fields can be `null`; object examples show the non-null shape.

## `listStatistics(input)`

```js
db.statistics
  .find({})
  .sort({ computedAt: -1 })
  .skip(page * pageSize)
  .limit(pageSize)
  .toArray();
```

Params: `page`, `pageSize`.

Output:

```json
[
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
      "propertyId": "<string_or_null>",
      "leaseRemaining": {
        "year": "<number_or_null>"
      },
      "storey": {
        "min": "<number_or_null>",
        "max": "<number_or_null>",
        "label": "<string_or_null>"
      }
    },
    "series": [
      {
        "period": "<period>",
        "value": "<number>",
        "sampleSize": "<number>"
      }
    ],
    "computedAt": "<timestamp_ms>"
  }
]
```

## `getStatisticsById(id)`

```js
db.statistics.findOne({ _id: id });
```

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
    "propertyId": "<string_or_null>",
    "leaseRemaining": {
      "year": "<number_or_null>"
    },
    "storey": {
      "min": "<number_or_null>",
      "max": "<number_or_null>",
      "label": "<string_or_null>"
    }
  },
  "series": [
    {
      "period": "<period>",
      "value": "<number>",
      "sampleSize": "<number>"
    }
  ],
  "computedAt": "<timestamp_ms>"
}
```

Returns `null` when no document matches.

## `upsertStatistics(input)`

```js
db.statistics.updateOne({ _id }, { $set: fields }, { upsert: true });
```

Optional params: `_id`.
If `_id` is not provided, it is generated before the update.

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
    "propertyId": "<string_or_null>",
    "leaseRemaining": {
      "year": "<number_or_null>"
    },
    "storey": {
      "min": "<number_or_null>",
      "max": "<number_or_null>",
      "label": "<string_or_null>"
    }
  },
  "series": [
    {
      "period": "<period>",
      "value": "<number>",
      "sampleSize": "<number>"
    }
  ],
  "computedAt": "<timestamp_ms>"
}
```

## `bulkUpsertStatistics(input)`

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

Optional params: `_id`.

Output:

```json
{
  "matchedCount": "<number>",
  "modifiedCount": "<number>",
  "upsertedCount": "<number>"
}
```

## `deleteStatistics(id)`

```js
db.statistics.deleteOne({ _id: id });
```

Output: boolean, either `true` or `false`.

## `getStatisticsByMetricAndDimensions(input)`

```js
db.statistics.findOne({
  ...providedFields,
});
```

Optional params: `metric`, `dimensions`.

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
    "propertyId": "<string_or_null>",
    "leaseRemaining": {
      "year": "<number_or_null>"
    },
    "storey": {
      "min": "<number_or_null>",
      "max": "<number_or_null>",
      "label": "<string_or_null>"
    }
  },
  "series": [
    {
      "period": "<period>",
      "value": "<number>",
      "sampleSize": "<number>"
    }
  ],
  "computedAt": "<timestamp_ms>"
}
```

Returns `null` when no document matches.
