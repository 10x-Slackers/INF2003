"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Pie, PieChart, Sector, type PieSectorShapeProps } from "recharts";
import type { NamedCount } from "@/lib/collections/search-logs";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function PieSlice(props: PieSectorShapeProps) {
  return (
    <Sector {...props} fill={CHART_COLORS[props.index % CHART_COLORS.length]} />
  );
}

export function FlatTypeDemand({ data }: { data: NamedCount[] }) {
  const chartConfig = data.reduce<ChartConfig>((acc, item, i) => {
    acc[item.name] = {
      label: item.name,
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flat type demand</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No data available
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="mx-auto h-[300px]">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="name"
                innerRadius={60}
                outerRadius={80}
                shape={PieSlice}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
