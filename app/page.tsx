import { MetricCard } from "@/components/dashboard/MetricCard";
import { MetricCardSkeleton } from "@/components/dashboard/MetricCardSkeleton";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { getHomeMetrics } from "./home-metrics";
import { toast } from "sonner";

export default function Home() {
  return (
    <main className="container mx-auto flex flex-col gap-7 px-5 py-6">
      <Card className="min-h-[480px]">
        <CardHeader>
          <CardTitle>Town map</CardTitle>
        </CardHeader>
      </Card>

      <section className="flex flex-col gap-4 md:flex-row [&>*]:flex-1">
        <Suspense fallback={<MetricsLoading />}>
          <Metrics />
        </Suspense>
      </section>
    </main>
  );
}

async function Metrics() {
  let metrics;
  try {
    metrics = await getHomeMetrics();
  } catch (error) {
    console.error("Error fetching home metrics:", error);
    toast.error("Failed to fetch home metrics. Please try again later.");
  }
  if (!metrics) {
    return (
      <>
        <MetricCard label="Average price (4-Room)" caption="No data yet" />
        <MetricCard label="Sales (latest month)" caption="No data yet" />
        <MetricCard label="Price trend" caption="No data yet" />
      </>
    );
  }

  const [year, month] = metrics.period.split("-");
  const yearNum = Number(year);
  const monthNum = Number(month);
  if (!year || !month || isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    console.error(`Invalid period format: ${metrics.period}`);
    return (
      <>
        <MetricCard label="Average price (4-Room)" caption="No data yet" />
        <MetricCard label="Sales (latest month)" caption="No data yet" />
        <MetricCard label="Price trend" caption="No data yet" />
      </>
    );
  }
  const caption = new Date(yearNum, monthNum - 1).toLocaleDateString(
    "en-SG",
    { month: "long", year: "numeric" },
  );
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

function MetricsLoading() {
  return (
    <>
      <MetricCardSkeleton />
      <MetricCardSkeleton />
      <MetricCardSkeleton />
    </>
  );
}
