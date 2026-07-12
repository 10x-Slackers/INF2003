"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

function formatPeriod(period: string): string {
  const [year, month] = period.split("-");
  return new Date(Number(year), Number(month ?? 1) - 1).toLocaleDateString(
    "en-SG",
    month ? { month: "short", year: "numeric" } : { year: "numeric" },
  );
}

type PriceTrendPoint = {
  period: string;
  value: number;
  sampleSize: number;
};

type PriceTrendChartProps = {
  series: PriceTrendPoint[];
  color: string;
  valueLabel: string;
  valueFormat: (value: number) => string;
  axisFormat: (value: number) => string;
};

export function PriceTrendChart({
  series,
  color,
  valueLabel,
  valueFormat,
  axisFormat,
}: PriceTrendChartProps) {
  const config = {
    value: { label: valueLabel, color },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={config}
      className="h-[250px] w-full [&_.recharts-responsive-container]:h-[250px]"
    >
      <LineChart accessibilityLayer data={series}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="period"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={formatPeriod}
        />
        <YAxis
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={axisFormat}
          width={70}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(label) => formatPeriod(String(label))}
              formatter={(value, _name, item) => (
                <div className="grid gap-1">
                  <span>{valueFormat(Number(value))}</span>
                  <span className="text-muted-foreground">
                    Sample: {item.payload.sampleSize.toLocaleString()}{" "}
                    transactions
                  </span>
                </div>
              )}
            />
          }
        />
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
