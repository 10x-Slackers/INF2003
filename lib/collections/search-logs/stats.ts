import { db } from "@/lib/db";
import { withDbError } from "@/lib/utils";
import { listTowns } from "@/lib/tables/towns";
import { listFlatTypes, listFlatModels } from "@/lib/tables/lookups";
import type { SearchLog } from "./types";
import type { NamedCount, PriceRangeStat, SearchStats } from "./stats-types";

const searchHistory = db.collection<SearchLog>("searchHistory");

const RANGES = [
  { range: "Under $400k", min: 0, max: 400_000 },
  { range: "$400k - $600k", min: 400_000, max: 600_000 },
  { range: "$600k - $800k", min: 600_000, max: 800_000 },
  { range: "$800k - $1M", min: 800_000, max: 1_000_000 },
  { range: "Over $1M", min: 1_000_000, max: Infinity },
] as const;

export async function getTotalSearches(): Promise<number> {
  return withDbError(() => searchHistory.countDocuments());
}

export async function getTopTowns(limit = 10): Promise<NamedCount[]> {
  return withDbError(async () => {
    const [rows, towns] = await Promise.all([
      searchHistory
        .aggregate<{
          _id: string;
          count: number;
        }>([
          { $match: { "query.townId": { $exists: true, $ne: [] } } },
          { $unwind: "$query.townId" },
          { $group: { _id: "$query.townId", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: limit },
        ])
        .toArray(),
      listTowns(),
    ]);
    const townMap = new Map(towns.map((t) => [t.id, t.name]));
    return rows
      .map((r) => ({
        id: r._id,
        name: townMap.get(r._id) ?? "",
        count: r.count,
      }))
      .filter((r) => r.name);
  });
}

export async function getTopFlatTypes(limit = 10): Promise<NamedCount[]> {
  return withDbError(async () => {
    const [rows, flatTypes] = await Promise.all([
      searchHistory
        .aggregate<{
          _id: string;
          count: number;
        }>([
          { $match: { "query.flatTypeId": { $exists: true, $ne: [] } } },
          { $unwind: "$query.flatTypeId" },
          { $group: { _id: "$query.flatTypeId", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: limit },
        ])
        .toArray(),
      listFlatTypes(),
    ]);
    const ftMap = new Map(flatTypes.map((ft) => [String(ft.id), ft.name]));
    return rows
      .map((r) => ({ id: r._id, name: ftMap.get(r._id) ?? "", count: r.count }))
      .filter((r) => r.name);
  });
}

export async function getTopFlatModels(limit = 10): Promise<NamedCount[]> {
  return withDbError(async () => {
    const [rows, flatModels] = await Promise.all([
      searchHistory
        .aggregate<{
          _id: string;
          count: number;
        }>([
          { $match: { "query.flatModelId": { $exists: true, $ne: [] } } },
          { $unwind: "$query.flatModelId" },
          { $group: { _id: "$query.flatModelId", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: limit },
        ])
        .toArray(),
      listFlatModels(),
    ]);
    const fmMap = new Map(flatModels.map((fm) => [String(fm.id), fm.name]));
    return rows
      .map((r) => ({ id: r._id, name: fmMap.get(r._id) ?? "", count: r.count }))
      .filter((r) => r.name);
  });
}

export async function getPriceRangeStats(): Promise<PriceRangeStat[]> {
  return withDbError(async () => {
    const docs = await searchHistory
      .find(
        {
          $or: [
            { "query.price.min": { $exists: true } },
            { "query.price.max": { $exists: true } },
          ],
        },
        { projection: { "query.price": 1 } },
      )
      .toArray();

    const counts = new Array(RANGES.length).fill(0);
    for (const doc of docs) {
      const { min, max } = doc.query.price ?? {};
      const price = max ?? min ?? 0;
      for (let i = 0; i < RANGES.length; i++) {
        const r = RANGES[i];
        if (i === RANGES.length - 1) {
          if (price >= r.min) counts[i]++;
        } else if (price >= r.min && price < r.max) {
          counts[i]++;
        }
      }
    }
    return RANGES.map((r, i) => ({ ...r, count: counts[i] }));
  });
}

export async function getSearchStats(): Promise<SearchStats> {
  const [totalSearches, topTowns, topFlatTypes, topFlatModels, priceRanges] =
    await Promise.all([
      getTotalSearches(),
      getTopTowns(),
      getTopFlatTypes(),
      getTopFlatModels(),
      getPriceRangeStats(),
    ]);
  return { totalSearches, topTowns, topFlatTypes, topFlatModels, priceRanges };
}
