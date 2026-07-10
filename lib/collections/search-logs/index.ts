export {
  createSearchLog,
  deleteSearchLog,
  getSearchLogById,
  listSearchLogs,
} from "./functions";

export {
  createSearchLogSchema,
  idSchema,
  querySearchLogSchema,
  type SearchLog,
  type SearchLogCreate,
  type SearchLogListQuery,
  searchLogListQuerySchema,
} from "./types";

export {
  getPriceRangeStats,
  getSearchStats,
  getTopFlatModels,
  getTopFlatTypes,
  getTopTowns,
  getTotalSearches,
} from "./stats";

export {
  type NamedCount,
  type PriceRangeStat,
  type SearchStats,
} from "./stats-types";
