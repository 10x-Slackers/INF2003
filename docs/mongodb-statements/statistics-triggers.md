# Statistics Trigger Collection Functions

Source: `lib/collections/statistics-trigger/functions.ts`

Output examples use placeholder strings to show shape and type, not real data.

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

Output:

```json
{
  "_id": "statistics",
  "dirtyTownIds": ["<uuid>"],
  "updatedAt": "<timestamp_ms>"
}
```

Default output when missing:

```json
{
  "_id": "statistics",
  "dirtyTownIds": [],
  "updatedAt": 0
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
