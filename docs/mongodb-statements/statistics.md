# Statistics Collection Functions

Source: `lib/collections/statistics/functions.ts`

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

Returned fields: `_id, metric, granularity, timeRange, dimensions, series, computedAt`

## `getStatisticsById(id)`

```js
db.statistics.findOne({ _id: id });
```

Returned fields: `_id, metric, granularity, timeRange, dimensions, series, computedAt` or `null`

## `upsertStatistics(input)`

```js
db.statistics.updateOne({ _id }, { $set: fields }, { upsert: true });
```

Optional params: `_id`.
If `_id` is not provided, it is generated before the update.

Returned fields: `_id, metric, granularity, timeRange, dimensions, series, computedAt`

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

Optional params: `_id`

Returned fields: `matchedCount, modifiedCount, upsertedCount`

## `deleteStatistics(id)`

```js
db.statistics.deleteOne({ _id: id });
```

Returned value: `boolean`

## `getStatisticsByMetricAndDimensions(input)`

```js
db.statistics.findOne({
  metric,
  dimensions,
});
```

Optional params: `metric`, `dimensions`

Returned fields: `_id, metric, granularity, timeRange, dimensions, series, computedAt` or `null`
