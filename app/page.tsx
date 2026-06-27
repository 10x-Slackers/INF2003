"use client"
import { MetricCard } from "@/components/metric-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate a fetching of data from db
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="container mx-auto flex flex-col gap-7 px-5 py-6">
      <Card className="min-h-[480px]">
        <CardHeader>
          <CardTitle>Town map</CardTitle>
        </CardHeader>
      </Card>

      <section className="flex flex-col gap-4 md:flex-row [&>*]:flex-1">
        <MetricCard label="Average price" value="$735,000" caption="May 2026" isLoading={isLoading} />
        <MetricCard label="Sales this month" value="2" caption="May 2026" isLoading={isLoading} />
        <MetricCard
          label="Price trend"
          value="$9,100 (+1.3%)"
          caption="vs last year"
          valueClassName="text-emerald-600"
          isLoading={isLoading}
        />
      </section>
    </main>
  );
}
