import { MetricCard, MetricCardSkeleton } from "@/components/metric-card";
import { getHomeMetrics } from "./home-metrics";

export async function HomeMetrics() {
  const metricsFallback = (
    <>
      <MetricCard label="Average price (4-Room)" caption="No data yet" />
      <MetricCard label="Sales (latest month)" caption="No data yet" />
      <MetricCard label="Price trend" caption="No data yet" />
    </>
  );
  const metrics = await getHomeMetrics();
  if (!metrics) {
    return metricsFallback;
  }

  const [year, month] = metrics.period.split("-");
  const yearNum = Number(year);
  const monthNum = Number(month);
  if (
    !year ||
    !month ||
    isNaN(yearNum) ||
    isNaN(monthNum) ||
    monthNum < 1 ||
    monthNum > 12
  ) {
    console.error(`Invalid period format: ${metrics.period}`);
    return metricsFallback;
  }
  const caption = new Date(yearNum, monthNum - 1).toLocaleDateString("en-SG", {
    month: "long",
    year: "numeric",
  });
  const averagePrice = new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0,
  }).format(metrics.averagePrice);
  const priceTrend =
    metrics.priceTrendPercent === null
      ? "N/A"
      : `${metrics.priceTrendPercent >= 0 ? "+" : ""}${metrics.priceTrendPercent.toFixed(1)}%`;

  return (
    <>
      <MetricCard
        label="Average price (4-Room)"
        value={averagePrice}
        caption={caption}
      />
      <MetricCard
        label="Sales (latest month)"
        value={metrics.salesThisMonth.toString()}
        caption={caption}
      />
      <MetricCard
        label="Price trend"
        value={priceTrend}
        caption="vs last year"
        valueClassName={
          metrics.priceTrendPercent !== null && metrics.priceTrendPercent < 0
            ? "text-destructive"
            : "text-emerald-600"
        }
      />
    </>
  );
}

export function HomeMetricsSkeleton() {
  return (
    <>
      <MetricCardSkeleton />
      <MetricCardSkeleton />
      <MetricCardSkeleton />
    </>
  );
}
