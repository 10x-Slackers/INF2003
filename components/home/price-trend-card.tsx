"use client";

import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FlatTypeTrends } from "@/app/home-stats";
import { PriceTrendChart } from "@/components/home/price-trend-chart";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function computeYoY(series: { period: string; value: number }[]) {
  if (series.length === 0) return null;
  const latest = series[series.length - 1];
  const [year, month] = latest.period.split("-");
  const lastYearPeriod = `${Number(year) - 1}-${month}`;
  const lastYear = series.find((p) => p.period === lastYearPeriod);
  if (!lastYear || lastYear.value === 0) return null;
  return ((latest.value - lastYear.value) / lastYear.value) * 100;
}

type Variant = "avgPrice" | "perSqm";

const VARIANT_CONFIG: Record<
  Variant,
  {
    valueLabel: string;
    valueFormat: (value: number) => string;
    axisFormat: (value: number) => string;
  }
> = {
  avgPrice: {
    valueLabel: "Average price",
    valueFormat: (v) =>
      `S$${v.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    axisFormat: (v) => `S$${(v / 1000).toFixed(0)}k`,
  },
  perSqm: {
    valueLabel: "Avg price per sqm",
    valueFormat: (v) => `S$${v.toFixed(2)}/sqm`,
    axisFormat: (v) => `S$${v.toFixed(0)}`,
  },
};

type PriceTrendCardProps = {
  title: string;
  description: string;
  data: FlatTypeTrends;
  variant: Variant;
};

export function PriceTrendCard({
  title,
  description,
  data,
  variant,
}: PriceTrendCardProps) {
  const { valueLabel, valueFormat, axisFormat } = VARIANT_CONFIG[variant];
  const flatTypes = data.flatTypes.filter((ft) => ft.monthly || ft.yearly);

  if (flatTypes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No {title.toLowerCase()} data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={flatTypes[0].name}>
          <TabsList className="h-auto flex-wrap">
            {flatTypes.map((ft) => (
              <TabsTrigger key={ft.name} value={ft.name}>
                {ft.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {flatTypes.map((ft, index) => {
            const monthly = ft.monthly?.series ?? [];
            const latest = monthly[monthly.length - 1];
            const yoy = computeYoY(monthly);
            const defaultGranularity = ft.monthly ? "monthly" : "yearly";

            return (
              <TabsContent key={ft.name} value={ft.name}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-4 md:flex-row [&>*]:flex-1">
                    <MetricCard
                      label={`Latest ${valueLabel}`}
                      value={latest ? valueFormat(latest.value) : "N/A"}
                      caption={latest ? `as of ${latest.period}` : undefined}
                    />
                    <MetricCard
                      label="Price trend"
                      value={
                        yoy === null
                          ? "N/A"
                          : `${yoy >= 0 ? "+" : ""}${yoy.toFixed(1)}%`
                      }
                      caption="vs last year"
                      valueClassName={
                        yoy === null
                          ? undefined
                          : yoy < 0
                            ? "text-destructive"
                            : "text-emerald-600"
                      }
                    />
                    <MetricCard
                      label="Transactions"
                      value={
                        latest ? latest.sampleSize.toLocaleString() : "N/A"
                      }
                      caption={latest ? `in ${latest.period}` : undefined}
                    />
                  </div>
                  <Tabs defaultValue={defaultGranularity}>
                    <TabsList className="sm:ml-auto">
                      {ft.monthly && (
                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                      )}
                      {ft.yearly && (
                        <TabsTrigger value="yearly">Yearly</TabsTrigger>
                      )}
                    </TabsList>
                    {ft.monthly && (
                      <TabsContent value="monthly" className="w-full">
                        <PriceTrendChart
                          series={ft.monthly.series}
                          color={CHART_COLORS[index % CHART_COLORS.length]}
                          valueLabel={valueLabel}
                          valueFormat={valueFormat}
                          axisFormat={axisFormat}
                        />
                      </TabsContent>
                    )}
                    {ft.yearly && (
                      <TabsContent value="yearly" className="w-full">
                        <PriceTrendChart
                          series={ft.yearly.series}
                          color={CHART_COLORS[index % CHART_COLORS.length]}
                          valueLabel={valueLabel}
                          valueFormat={valueFormat}
                          axisFormat={axisFormat}
                        />
                      </TabsContent>
                    )}
                  </Tabs>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
