import { getStatisticsById } from "@/lib/collections/statistics";
import { listFlatTypes } from "@/lib/tables/lookups";

export type HomeMetrics = {
  averagePrice: number;
  salesThisMonth: number;
  priceTrendPercent: number | null;
  period: string;
};

export async function getHomeMetrics(): Promise<HomeMetrics | null> {
  const flatTypes = await listFlatTypes();
  const FLAT_TYPE_4ROOM = "4 ROOM";
  const fourRoom = flatTypes.find((t) => t.name === FLAT_TYPE_4ROOM);
  if (!fourRoom) return null;

  const doc = await getStatisticsById(
    `AVG_PRICE_BY_FLAT_TYPE|monthly|flatType:${fourRoom.id}`,
  );
  if (!doc || doc.series.length === 0) return null;

  const latest = doc.series[doc.series.length - 1];
  const [year, month] = latest.period.split("-");
  const lastYearPeriod = `${Number(year) - 1}-${month}`;
  const lastYear = doc.series.find((p) => p.period === lastYearPeriod);

  return {
    averagePrice: latest.value,
    salesThisMonth: latest.sampleSize,
    priceTrendPercent: lastYear
      ? ((latest.value - lastYear.value) / lastYear.value) * 100
      : null,
    period: latest.period,
  };
}
