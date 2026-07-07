import { getTransactionStatistics } from "@/lib/tables/transactions";
import { handleDbError } from "@/lib/utils";

export type HomeMetrics = {
  averagePrice: number;
  salesThisMonth: number;
  priceTrendPercent: number | null;
  period: string;
};

export async function getHomeMetrics(): Promise<HomeMetrics | null> {
  try {
    const rows = await getTransactionStatistics({
      metric: "avg_price",
      groupBy: ["period"],
      granularity: "monthly",
    });
    if (rows.length === 0) return null;

    const latest = rows[rows.length - 1];
    const [year, month] = latest.period!.split("-");
    const lastYearPeriod = `${Number(year) - 1}-${month}`;
    const lastYear = rows.find((row) => row.period === lastYearPeriod);

    return {
      averagePrice: latest.value,
      salesThisMonth: latest.sample_size,
      priceTrendPercent: lastYear
        ? ((latest.value - lastYear.value) / lastYear.value) * 100
        : null,
      period: latest.period!,
    };
  } catch (error) {
    return handleDbError(error);
  }
}
