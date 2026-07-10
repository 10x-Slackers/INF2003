"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function PriceChart({
  chartData,
  color,
}: {
  chartData: { period: string; value: number }[];
  color: string;
}) {
  const chartConfig = {
    value: { label: "Avg Price", color },
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
          tickFormatter={formatPrice}
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

export function PropertyStatisticsCard({ data }: PropertyStatisticsCardProps) {
  if (!data || data.flatTypes.length === 0) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={data.flatTypes[0].name}>
          <div className="mb-4">
            <TabsList className="flex-wrap">
              {data.flatTypes.map((ft) => (
                <TabsTrigger key={ft.name} value={ft.name}>
                  {ft.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {data.flatTypes.map((ft, i) => (
            <TabsContent key={ft.name} value={ft.name}>
              <div className="flex gap-4">
                <PriceChart
                  chartData={ft.chartData}
                  color={CHART_COLORS[i % CHART_COLORS.length]}
                />
                <div className="flex w-40 shrink-0 flex-col gap-4">
                  <div className="flex flex-1 flex-col justify-center border rounded-md p-3">
                    <p className="text-muted-foreground text-sm">
                      Lowest price
                    </p>
                    <p className="font-medium">{formatCurrency(ft.minPrice)}</p>
                  </div>
                  <div className="flex flex-1 flex-col justify-center border rounded-md p-3">
                    <p className="text-muted-foreground text-sm">
                      Highest price
                    </p>
                    <p className="font-medium">{formatCurrency(ft.maxPrice)}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
