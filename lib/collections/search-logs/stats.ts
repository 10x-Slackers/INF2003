import { db, withMongoError } from "@/lib/db/mongodb";
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
  return withMongoError(() => searchHistory.countDocuments());
}

type LookupItem = { id: number | string; name: string };

async function getTopByField(
  field: string,
  lookupFn: () => Promise<LookupItem[]>,
  limit = 10,
): Promise<NamedCount[]> {
  return withMongoError(async () => {
    const [rows, items] = await Promise.all([
      searchHistory
        .aggregate<{
          _id: string;
          count: number;
        }>([
          { $match: { [field]: { $exists: true, $ne: [] } } },
          { $unwind: `$${field}` },
          { $group: { _id: `$${field}`, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: limit },
        ])
        .toArray(),
      lookupFn(),
    ]);
    const itemMap = new Map(items.map((item) => [String(item.id), item.name]));
    return rows
      .map((r) => ({
        id: r._id,
        name: itemMap.get(r._id) ?? "",
        count: r.count,
      }))
      .filter((r) => r.name);
  });
}

export async function getTopTowns(limit = 10): Promise<NamedCount[]> {
  return getTopByField("query.townId", listTowns, limit);
}

export async function getTopFlatTypes(limit = 10): Promise<NamedCount[]> {
  return getTopByField("query.flatTypeId", listFlatTypes, limit);
}

export async function getTopFlatModels(limit = 10): Promise<NamedCount[]> {
  return getTopByField("query.flatModelId", listFlatModels, limit);
}

export async function getPriceRangeStats(): Promise<PriceRangeStat[]> {
  return withMongoError(async () => {
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
