export {
  deleteStatistics,
  getStatisticsById,
  getStatisticsByMetricAndDimensions,
  listStatistics,
  upsertStatistics,
} from "./functions";

export type {
  Statistics,
  StatisticsDimensions,
  StatisticsGranularity,
  StatisticsSearch,
  StatisticsSeriesPoint,
  StatisticsTimeRange,
  StatisticsUpsert,
} from "./types";
