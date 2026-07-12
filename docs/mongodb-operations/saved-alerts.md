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
    "createdAt": "<unix_timestamp_seconds>",
    "updatedAt": "<unix_timestamp_seconds>",
    "lastTriggeredAt": "<unix_timestamp_seconds_optional>"
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
  "createdAt": "<unix_timestamp_seconds>",
  "updatedAt": "<unix_timestamp_seconds>",
  "lastTriggeredAt": "<unix_timestamp_seconds_optional>"
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
  "createdAt": "<unix_timestamp_seconds>",
  "updatedAt": "<unix_timestamp_seconds>"
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
    // addArrayFilter — for townId, flatTypeId, flatModelId
    {
      $or: [
        { "filters.<field>": value },
        { "filters.<field>": { $exists: false } },
        { "filters.<field>": { $size: 0 } },
      ],
    },
    // addValueInRangeFilter — for price, floorAreaSqm, leaseRemaining
    {
      $or: [
        { "filters.<field>.min": { $exists: false } },
        { "filters.<field>.min": { $lte: value } },
      ],
    },
    {
      $or: [
        { "filters.<field>.max": { $exists: false } },
        { "filters.<field>.max": { $gte: value } },
      ],
    },
    // addRangeOverlapFilter — for storey
    {
      $or: [
        { "filters.storey.min": { $exists: false } },
        { "filters.storey.min": { $lte: storey.max } },
      ],
    },
    {
      $or: [
        { "filters.storey.max": { $exists: false } },
        { "filters.storey.max": { $gte: storey.min } },
      ],
    },
  ],
});
```

Optional params: `townId`, `flatTypeId`, `flatModelId`, `price`, `floorAreaSqm`, `storey`, `leaseRemaining`.
Only provided filters are included in `$and`.

Each filter maps to one of three clause patterns:

- **`addArrayFilter`** (`townId`, `flatTypeId`, `flatModelId`): one `$or` clause matching the value, or the field being absent/empty.
- **`addValueInRangeFilter`** (`price`, `floorAreaSqm`, `leaseRemaining`): two `$or` clauses checking the alert's `min`/`max` bounds against the transaction value.
- **`addRangeOverlapFilter`** (`storey`): two `$or` clauses checking the alert's `min`/`max` bounds against the transaction's `min`/`max` range for overlap.

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
