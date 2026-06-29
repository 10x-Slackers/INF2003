import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { MongoError } from "mongodb";
import { ZodError } from "zod";
import { collection, resetCollections } from "./mocks/db";
import { DbError, handleDbError } from "@/lib/utils";
import {
  createSavedAlert,
  deleteSavedAlert,
  getSavedAlertById,
  listSavedAlerts,
  updateSavedAlert,
} from "../saved-alerts/functions";
import {
  createSearchLog,
  deleteSearchLog,
  getSearchLogById,
  listSearchLogs,
} from "../search-logs/functions";
import {
  deleteStatistics,
  getStatisticsById,
  getStatisticsByMetricAndDimensions,
  listStatistics,
  upsertStatistics,
} from "../statistics/functions";
import {
  getTownProfileById,
  listTownProfiles,
  upsertTownProfile,
} from "../town-profile/functions";

const userId = "018f6a9c-7b2d-4c0e-8f1a-9b2c3d4e5f60";
const townId = "118f6a9c-7b2d-4c0e-8f1a-9b2c3d4e5f61";
const docId = "218f6a9c-7b2d-4c0e-8f1a-9b2c3d4e5f62";

const savedAlertInput = {
  user_id: userId,
  filters: { town_id: [townId] },
};

const searchQuery = { town_id: [townId] };
const statisticsInput = {
  metric: "resale_price" as const,
  granularity: "monthly" as const,
  time_range: { start: "2024-01", end: "2024-12" },
  dimensions: {
    town_id: townId,
    flat_type_id: null,
    flat_model_id: null,
  },
  series: [{ period: "2024-01", value: 500000, sample_size: 2 }],
};
const townProfileInput = {
  _id: townId,
  transaction_summary: {
    total_transaction: 2,
    earliest_transaction: "2024-01",
    latest_transaction: "2024-12",
    avg_resale_price_by_flat_type: { "4 ROOM": 500000 },
  },
  coordinates: [
    [
      [103.1, 1.3] as [number, number],
      [103.2, 1.3] as [number, number],
      [103.2, 1.4] as [number, number],
      [103.1, 1.3] as [number, number],
    ],
  ],
};

beforeEach(() => resetCollections());

const dbError = () => new MongoError("mock db failure");
const assertDbRejects = (promise: Promise<unknown>) =>
  assert.rejects(promise, DbError);
const assertZodRejects = (promise: Promise<unknown>) =>
  assert.rejects(promise, ZodError);
const assertUnixTime = (value: unknown) => {
  assert.equal(typeof value, "number");
  assert.ok((value as number) > 0);
};
const updateSet = (args?: unknown[]) =>
  (args?.[1] as { $set: Record<string, unknown> }).$set;

describe("collection utilities", () => {
  it("throws DbError for database errors and regular errors as-is", () => {
    const logicError = new Error("logic failure");

    assert.throws(() => handleDbError(dbError()), DbError);
    assert.throws(
      () => handleDbError(logicError),
      (error) => {
        assert.equal(error, logicError);
        return true;
      },
    );
  });
});

describe("saved alerts collection functions", () => {
  it("runs list, get, create, update and delete operations", async () => {
    const alerts = collection("alerts");
    alerts.docs = [{ _id: docId }];
    alerts.findOneResult = { _id: docId };
    alerts.findOneAndUpdateResult = { _id: docId, is_active: false };

    assert.deepEqual(await listSavedAlerts(userId), [{ _id: docId }]);
    assert.deepEqual(alerts.findQuery, { user_id: userId });
    assert.deepEqual(alerts.sortValue, { created_at: -1 });

    assert.deepEqual(await getSavedAlertById(docId), { _id: docId });
    assert.deepEqual(alerts.findOneQuery, { _id: docId });

    const created = await createSavedAlert(savedAlertInput);
    assert.equal((created as { user_id: string }).user_id, userId);
    assert.equal((alerts.insertDoc as { user_id: string }).user_id, userId);

    assert.deepEqual(await updateSavedAlert(docId, { is_active: false }), {
      _id: docId,
      is_active: false,
    });
    assert.deepEqual(alerts.findOneAndUpdateArgs?.[0], { _id: docId });
    const alertSet = updateSet(alerts.findOneAndUpdateArgs);
    assert.deepEqual(alerts.findOneAndUpdateArgs?.[1], {
      $set: { is_active: false, updated_at: alertSet.updated_at },
    });
    assertUnixTime(alertSet.updated_at);

    assert.equal(await deleteSavedAlert(docId), true);
    assert.deepEqual(alerts.deleteOneQuery, { _id: docId });
  });

  it("handles saved alert edge cases", async () => {
    const alerts = collection("alerts");
    alerts.docs = [];
    alerts.deleteOneResult = { deletedCount: 0 };

    assert.deepEqual(await listSavedAlerts(), []);
    assert.deepEqual(alerts.findQuery, {});

    const created = await createSavedAlert(savedAlertInput);
    assert.equal(created.is_active, true);
    assertUnixTime(created.created_at);
    assert.equal(created.created_at, created.updated_at);

    assert.equal(await updateSavedAlert(docId, { is_active: true }), null);
    assert.equal(updateSet(alerts.findOneAndUpdateArgs).is_active, true);

    assert.equal(await deleteSavedAlert(docId), false);
  });

  it("throws DbError and Zod errors from list, get, create, update and delete failures", async () => {
    const alerts = collection("alerts");
    alerts.fail(dbError());
    await assertDbRejects(listSavedAlerts(userId));
    await assertDbRejects(getSavedAlertById(docId));
    await assertDbRejects(createSavedAlert(savedAlertInput));
    await assertDbRejects(updateSavedAlert(docId, { is_active: false }));
    await assertDbRejects(deleteSavedAlert(docId));

    await assertZodRejects(getSavedAlertById("invalid-id"));
    await assertZodRejects(
      createSavedAlert({ ...savedAlertInput, user_id: "bad" }),
    );
    await assertZodRejects(updateSavedAlert(docId, {}));
    await assertZodRejects(
      createSavedAlert({
        ...savedAlertInput,
        filters: { price: { min: 10, max: 1 } },
      }),
    );
    await assertZodRejects(deleteSavedAlert("invalid-id"));
  });
});

describe("search logs collection functions", () => {
  it("runs list, get, create and delete operations", async () => {
    const searchHistory = collection("search_history");
    searchHistory.docs = [{ _id: docId }];
    searchHistory.findOneResult = { _id: docId };

    assert.deepEqual(await listSearchLogs(userId), [{ _id: docId }]);
    assert.deepEqual(searchHistory.findQuery, { user_id: userId });
    assert.deepEqual(searchHistory.sortValue, { searched_at: -1 });
    assert.equal(searchHistory.limitValue, 50);

    assert.deepEqual(await getSearchLogById(docId), { _id: docId });
    assert.deepEqual(searchHistory.findOneQuery, { _id: docId });

    const created = await createSearchLog({
      user_id: userId,
      query: searchQuery,
    });
    assert.deepEqual(
      (created as { query: typeof searchQuery }).query,
      searchQuery,
    );
    assert.deepEqual(
      (searchHistory.insertDoc as { query: typeof searchQuery }).query,
      searchQuery,
    );

    assert.equal(await deleteSearchLog(docId), true);
    assert.deepEqual(searchHistory.deleteOneQuery, { _id: docId });
  });

  it("handles search log edge cases", async () => {
    const searchHistory = collection("search_history");
    searchHistory.docs = [];
    searchHistory.deleteOneResult = { deletedCount: 0 };

    assert.deepEqual(await listSearchLogs(), []);
    assert.deepEqual(searchHistory.findQuery, {});
    assert.equal(searchHistory.limitValue, 50);

    const created = await createSearchLog({
      user_id: userId,
      query: searchQuery,
    });
    assertUnixTime(created.searched_at);

    assert.equal(await deleteSearchLog(docId), false);
  });

  it("throws DbError and Zod errors from list, get, create and delete failures", async () => {
    const searchHistory = collection("search_history");
    searchHistory.fail(dbError());
    await assertDbRejects(listSearchLogs(userId));
    await assertDbRejects(getSearchLogById(docId));
    await assertDbRejects(
      createSearchLog({ user_id: userId, query: searchQuery }),
    );
    await assertDbRejects(deleteSearchLog(docId));

    await assertZodRejects(getSearchLogById("invalid-id"));
    await assertZodRejects(
      createSearchLog({ user_id: "bad", query: searchQuery }),
    );
    await assertZodRejects(
      createSearchLog({
        user_id: userId,
        query: { transaction_year: { from: 2025, to: 2024 } },
      }),
    );
    await assertZodRejects(deleteSearchLog("invalid-id"));
  });
});

describe("statistics collection functions", () => {
  it("runs list, get, upsert, delete and search operations", async () => {
    const statistics = collection("statistics");
    statistics.docs = [{ _id: docId }];
    statistics.findOneResult = { _id: docId };

    assert.deepEqual(await listStatistics(2, 10), [{ _id: docId }]);
    assert.deepEqual(statistics.findQuery, {});
    assert.deepEqual(statistics.sortValue, { computed_at: -1 });
    assert.equal(statistics.skipValue, 20);
    assert.equal(statistics.limitValue, 10);

    assert.deepEqual(await getStatisticsById(docId), { _id: docId });
    assert.deepEqual(statistics.findOneQuery, { _id: docId });

    const upserted = await upsertStatistics({ _id: docId, ...statisticsInput });
    assert.equal((upserted as { _id: string })._id, docId);
    assertUnixTime(upserted.computed_at);
    assert.deepEqual(statistics.updateOneArgs?.[0], { _id: docId });
    assert.deepEqual(statistics.updateOneArgs?.[2], { upsert: true });

    assert.equal(await deleteStatistics(docId), true);
    assert.deepEqual(statistics.deleteOneQuery, { _id: docId });

    assert.deepEqual(
      await getStatisticsByMetricAndDimensions({ metric: "resale_price" }),
      { _id: docId },
    );
    assert.deepEqual(statistics.findOneQuery, { metric: "resale_price" });
  });

  it("handles statistics edge cases", async () => {
    const statistics = collection("statistics");
    statistics.docs = [];
    statistics.updateOneResult = { matchedCount: 0 };
    statistics.deleteOneResult = { deletedCount: 0 };

    assert.deepEqual(await listStatistics(0, 10), []);
    assert.equal(statistics.skipValue, 0);
    assert.equal(statistics.limitValue, 10);

    const upserted = await upsertStatistics(statisticsInput);
    assert.match(upserted._id, /^[0-9a-f-]{36}$/);
    assert.deepEqual(statistics.updateOneArgs?.[0], { _id: upserted._id });

    assert.equal(await deleteStatistics(docId), false);

    await getStatisticsByMetricAndDimensions({
      metric: undefined,
      dimensions: statisticsInput.dimensions,
    });
    assert.deepEqual(statistics.findOneQuery, {
      dimensions: statisticsInput.dimensions,
    });
  });

  it("throws DbError and Zod errors from list, get, upsert, delete and search failures", async () => {
    const statistics = collection("statistics");
    statistics.fail(dbError());
    await assertDbRejects(listStatistics(0, 10));
    await assertDbRejects(getStatisticsById(docId));
    await assertDbRejects(upsertStatistics({ _id: docId, ...statisticsInput }));
    await assertDbRejects(deleteStatistics(docId));
    await assertDbRejects(
      getStatisticsByMetricAndDimensions({ metric: "resale_price" }),
    );

    await assertZodRejects(getStatisticsById("invalid-id"));
    await assertZodRejects(
      upsertStatistics({ ...statisticsInput, metric: "bad" as never }),
    );
    await assertZodRejects(
      upsertStatistics({ _id: "invalid-id", ...statisticsInput }),
    );
    await assertZodRejects(deleteStatistics("invalid-id"));
    await assertZodRejects(getStatisticsByMetricAndDimensions({}));
  });
});

describe("town profile collection functions", () => {
  it("runs list, get and upsert operations", async () => {
    const towns = collection("towns");
    towns.docs = [{ _id: townId }];
    towns.findOneResult = { _id: townId };

    assert.deepEqual(await listTownProfiles(), [{ _id: townId }]);
    assert.deepEqual(towns.findQuery, {});

    assert.deepEqual(await getTownProfileById(townId), { _id: townId });
    assert.deepEqual(towns.findOneQuery, { _id: townId });

    const upserted = await upsertTownProfile(townProfileInput);
    assert.equal((upserted as { _id: string })._id, townId);
    assert.deepEqual(towns.updateOneArgs?.[0], { _id: townId });
    const townSet = updateSet(towns.updateOneArgs);
    assert.deepEqual(towns.updateOneArgs?.[1], {
      $set: {
        transaction_summary: townProfileInput.transaction_summary,
        coordinates: townProfileInput.coordinates,
        updated_at: townSet.updated_at,
      },
    });
    assertUnixTime(townSet.updated_at);
    assert.deepEqual(towns.updateOneArgs?.[2], { upsert: true });
  });

  it("handles town profile edge cases", async () => {
    const towns = collection("towns");
    towns.docs = [];
    assert.deepEqual(await listTownProfiles(), []);
    assert.deepEqual(towns.findQuery, {});

    assert.equal(await getTownProfileById(townId), null);

    const upserted = await upsertTownProfile(townProfileInput);
    assertUnixTime(upserted.updated_at);
  });

  it("throws DbError and Zod errors from list, get and upsert failures", async () => {
    const towns = collection("towns");
    towns.fail(dbError());
    await assertDbRejects(listTownProfiles());
    await assertDbRejects(getTownProfileById(townId));
    await assertDbRejects(upsertTownProfile(townProfileInput));

    await assertZodRejects(getTownProfileById("invalid-id"));
    await assertZodRejects(
      upsertTownProfile({ ...townProfileInput, _id: "bad" }),
    );
  });
});
