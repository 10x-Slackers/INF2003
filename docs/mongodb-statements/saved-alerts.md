# Saved Alert Collection Functions

Source: `lib/collections/saved-alerts/functions.ts`

## `listSavedAlerts(userId)`

```js
db.alerts
  .find(userId ? { userId } : {})
  .sort({ createdAt: -1 })
  .toArray();
```

Optional params: `userId`.

Returned fields: `_id, userId, filters, isActive, createdAt, updatedAt, lastTriggeredAt`

## `getSavedAlertById(id)`

```js
db.alerts.findOne({ _id: id });
```

Returned fields: `_id, userId, filters, isActive, createdAt, updatedAt, lastTriggeredAt` or `null`

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

Returned fields: `_id, userId, filters, isActive, createdAt, updatedAt`

## `deleteSavedAlert(id)`

```js
db.alerts.deleteOne({ _id: id });
```

Returned value: `boolean`

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

Returned fields after mapping: `userId, alertId`

## `triggerSavedAlerts(alertIds)`

```js
db.alerts.updateMany({ _id: { $in: alertIds } }, { $set: { lastTriggeredAt } });
```
