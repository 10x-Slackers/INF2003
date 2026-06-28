import { MetricCard } from "@/components/dashboard/MetricCard";
import { MetricCardSkeleton } from "@/components/dashboard/MetricCardSkeleton";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

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
  // database call to fetch metrics data goes here
  const metrics = {
    averagePrice: "$500,000",
    salesThisMonth: "100",
    priceTrend: "+5%",
  };

  return (
    <>
      <MetricCard
        label="Average price"
        value={metrics.averagePrice}
        caption="May 2026"
      />
      <MetricCard
        label="Sales this month"
        value={metrics.salesThisMonth}
        caption="May 2026"
      />
      <MetricCard
        label="Price trend"
        value={metrics.priceTrend}
        caption="vs last year"
        valueClassName="text-emerald-600"
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
