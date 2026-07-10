"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { PriceRangeStat } from "@/lib/collections/search-logs";

const chartConfig = {
  count: { label: "Searches", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function PriceRangeDistribution({ data }: { data: PriceRangeStat[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Price range distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {data.every((d) => d.count === 0) ? (
          <p className="text-muted-foreground text-center py-8">
            No data available
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="range"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                width={40}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
