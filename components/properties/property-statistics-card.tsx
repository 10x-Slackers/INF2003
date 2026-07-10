"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { PropertyStatsData } from "@/app/properties/[id]/property-stats";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type PropertyStatisticsCardProps = {
  data: PropertyStatsData | null;
};

function formatMonth(period: string) {
  const [year, month] = period.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en-SG", { month: "short", year: "2-digit" });
}

function formatPrice(value: number) {
  return `S$${(value / 1000).toFixed(0)}k`;
}

function formatCurrency(value: number) {
  return `S$${value.toLocaleString()}`;
}

function formatSqm(value: number) {
  return `S$${Math.round(value).toLocaleString()}`;
}

type FlatTypeData = {
  name: string;
  chartData: { period: string; value: number }[];
  minPrice: number;
  maxPrice: number;
};

function splitByFlatType(
  chartData: Record<string, number | string>[],
  priceRanges: PropertyStatsData["priceRanges"],
  flatTypeNames: string[],
): FlatTypeData[] {
  const priceRangeMap = new Map(priceRanges.map((r) => [r.flatTypeName, r]));

  return flatTypeNames.map((name) => {
    const data = chartData
      .map((point) => {
        const value = point[name];
        return value !== undefined && typeof value === "number"
          ? { period: point.period as string, value }
          : null;
      })
      .filter((p): p is { period: string; value: number } => p !== null);

    const range = priceRangeMap.get(name);
    return {
      name,
      chartData: data,
      minPrice: range?.minPrice ?? 0,
      maxPrice: range?.maxPrice ?? 0,
    };
  });
}

function PriceChart({
  chartData,
  color,
  yFormatter,
  yLabel,
}: {
  chartData: { period: string; value: number }[];
  color: string;
  yFormatter: (v: number) => string;
  yLabel: string;
}) {
  const chartConfig = {
    value: { label: yLabel, color },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={chartConfig}
      className="h-[250px] flex-1 [&_.recharts-responsive-container]:h-[250px]"
    >
      <LineChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="period"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={formatMonth}
        />
        <YAxis
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={yFormatter}
          width={70}
        />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Line
          dataKey="value"
          stroke="var(--color-value)"
          type="natural"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}

function FlatTypeTabs({
  flatTypes,
  yFormatter,
  yLabel,
  metric,
  onMetricChange,
}: {
  flatTypes: FlatTypeData[];
  yFormatter: (v: number) => string;
  yLabel: string;
  metric: "price" | "sqm";
  onMetricChange: (m: "price" | "sqm") => void;
}) {
  return (
    <Tabs defaultValue={flatTypes[0]?.name}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <TabsList className="flex-wrap">
          {flatTypes.map((ft) => (
            <TabsTrigger key={ft.name} value={ft.name}>
              {ft.name}
            </TabsTrigger>
          ))}
        </TabsList>
        <ToggleGroup
          type="single"
          value={metric}
          onValueChange={(v) => v && onMetricChange(v as "price" | "sqm")}
          variant="outline"
        >
          <ToggleGroupItem value="price">Avg Price</ToggleGroupItem>
          <ToggleGroupItem value="sqm">Price per sqm</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {flatTypes.map((ft, i) => (
        <TabsContent key={ft.name} value={ft.name}>
          <div className="flex gap-4">
            <PriceChart
              chartData={ft.chartData}
              color={CHART_COLORS[i % CHART_COLORS.length]}
              yFormatter={yFormatter}
              yLabel={yLabel}
            />
            <div className="flex w-40 shrink-0 flex-col gap-4">
              <div className="flex flex-1 flex-col justify-center border rounded-md p-3">
                <p className="text-muted-foreground text-sm">Lowest price</p>
                <p className="font-medium">{formatCurrency(ft.minPrice)}</p>
              </div>
              <div className="flex flex-1 flex-col justify-center border rounded-md p-3">
                <p className="text-muted-foreground text-sm">Highest price</p>
                <p className="font-medium">{formatCurrency(ft.maxPrice)}</p>
              </div>
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function PropertyStatisticsCard({ data }: PropertyStatisticsCardProps) {
  const [metric, setMetric] = useState<"price" | "sqm">("price");

  if (!data || data.chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No statistics available
          </p>
        </CardContent>
      </Card>
    );
  }

  const priceFlatTypes = splitByFlatType(
    data.chartData,
    data.priceRanges,
    data.flatTypeNames,
  );
  const sqmFlatTypes = splitByFlatType(
    data.sqmChartData,
    data.priceRanges,
    data.flatTypeNames,
  );

  const isPrice = metric === "price";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        {isPrice ? (
          <FlatTypeTabs
            flatTypes={priceFlatTypes}
            yFormatter={formatPrice}
            yLabel="Avg Price"
            metric={metric}
            onMetricChange={setMetric}
          />
        ) : (
          <FlatTypeTabs
            flatTypes={sqmFlatTypes}
            yFormatter={formatSqm}
            yLabel="Avg Price/sqm"
            metric={metric}
            onMetricChange={setMetric}
          />
        )}
      </CardContent>
    </Card>
  );
}
