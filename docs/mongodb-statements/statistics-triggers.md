# Statistics Trigger Collection Functions

Source: `lib/collections/statistics-trigger/functions.ts`

## `markStatisticsTownDirty(townId)`

```js
db.statisticsTriggers.updateOne(
  { _id: "statistics" },
  {
    $addToSet: { dirtyTownIds: townId },
    $setOnInsert: { updatedAt: 0 },
  },
  { upsert: true },
);
```

## `getStatisticsTrigger()`

```js
db.statisticsTriggers.findOne({ _id: "statistics" });
```

Returned fields: `_id, dirtyTownIds, updatedAt`

Default when missing:

```js
{
  _id: "statistics",
  dirtyTownIds: [],
  updatedAt: 0,
}
```

## `flushStatisticsTrigger()`

```js
db.statisticsTriggers.updateOne(
  { _id: "statistics" },
  { $set: { dirtyTownIds: [], updatedAt } },
  { upsert: true },
);
```
