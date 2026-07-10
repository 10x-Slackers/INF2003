# Saved Alert Collection Functions

Source: `lib/collections/saved-alerts/functions.ts`

Output examples use placeholder strings to show shape and type, not real data.

## `listSavedAlerts(userId)`

```js
db.alerts
  .find(userId ? { userId } : {})
  .sort({ createdAt: -1 })
  .toArray();
```

Optional params: `userId`.

Output:

```json
[
  {
    "_id": "<uuid>",
    "userId": "<uuid>",
    "filters": {
      "townId": ["<uuid>"],
      "price": {
        "min": "<number>",
        "max": "<number>"
      }
    },
    "isActive": "<boolean>",
    "createdAt": "<timestamp_ms>",
    "updatedAt": "<timestamp_ms>",
    "lastTriggeredAt": "<timestamp_ms_optional>"
  }
]
```

## `getSavedAlertById(id)`

```js
db.alerts.findOne({ _id: id });
```

Output:

```json
{
  "_id": "<uuid>",
  "userId": "<uuid>",
  "filters": {
    "townId": ["<uuid>"],
    "price": {
      "min": "<number>",
      "max": "<number>"
    }
  },
  "isActive": "<boolean>",
  "createdAt": "<timestamp_ms>",
  "updatedAt": "<timestamp_ms>",
  "lastTriggeredAt": "<timestamp_ms_optional>"
}
```

Returns `null` when no document matches.

## `createSavedAlert(input)`

```js
db.alerts.insertOne({
  _id,
  userId,
  filters,
  isActive,
  createdAt,
  updatedAt,
});
```

Optional params: `isActive`.

Output:

```json
{
  "_id": "<uuid>",
  "userId": "<uuid>",
  "filters": {
    "townId": ["<uuid>"],
    "price": {
      "min": "<number>",
      "max": "<number>"
    }
  },
  "isActive": "<boolean>",
  "createdAt": "<timestamp_ms>",
  "updatedAt": "<timestamp_ms>"
}
```

## `deleteSavedAlert(id)`

```js
db.alerts.deleteOne({ _id: id });
```

Output: boolean, either `true` or `false`.

## `findAlertsByTransaction(filters)`

```js
db.alerts.find({
  isActive: true,
  $and: [
    {
      $or: [
        { "filters.townId": townId },
        { "filters.townId": { $exists: false } },
        { "filters.townId": { $size: 0 } },
      ],
    },
    {
      $or: [
        { "filters.price.min": { $exists: false } },
        { "filters.price.min": { $lte: price } },
      ],
    },
    {
      $or: [
        { "filters.price.max": { $exists: false } },
        { "filters.price.max": { $gte: price } },
      ],
    },
  ],
});
```

Optional params: `townId`, `flatTypeId`, `flatModelId`, `price`, `floorAreaSqm`, `storey`, `leaseRemaining`.
Only provided filters are included in `$and`.

Output:

```json
[
  {
    "userId": "<uuid>",
    "alertId": "<uuid>"
  }
]
```

## `triggerSavedAlerts(alertIds)`

```js
db.alerts.updateMany({ _id: { $in: alertIds } }, { $set: { lastTriggeredAt } });
```
