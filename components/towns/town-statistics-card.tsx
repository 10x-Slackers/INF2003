"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TownStatsData } from "@/app/towns/[id]/town-stats";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type PriceSeries = NonNullable<TownStatsData["flatTypes"][number]["monthly"]>;

function formatPeriod(period: string) {
  const [year, month] = period.split("-");
  return new Date(Number(year), Number(month ?? 1) - 1).toLocaleDateString(
    "en-SG",
    month ? { month: "short", year: "2-digit" } : { year: "numeric" },
  );
}

function formatCurrency(value: number) {
  return `S$${value.toLocaleString("en-SG")}`;
}

function formatAxisPrice(value: number) {
  return `S$${(value / 1000).toFixed(0)}k`;
}

function PriceChart({ series, color }: { series: PriceSeries; color: string }) {
  const config = {
    value: { label: "Average price", color },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={config}
      className="h-[250px] w-full [&_.recharts-responsive-container]:h-[250px]"
    >
      <LineChart accessibilityLayer data={series.series}>
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
          tickFormatter={formatAxisPrice}
          width={70}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(label) => formatPeriod(String(label))}
              formatter={(value, _name, item) => (
                <div className="grid gap-1">
                  <span>{formatCurrency(Number(value))}</span>
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

export function TownStatisticsCard({ data }: { data: TownStatsData }) {
  const trendFlatTypes = data.flatTypes.filter(
    (flatType) => flatType.monthly || flatType.yearly,
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.profile ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground text-sm">
                Total transactions
              </dt>
              <dd className="font-heading text-xl font-semibold">
                {data.profile.totalTransactions.toLocaleString()}
              </dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground text-sm">
                Transactions in last 6 months
              </dt>
              <dd className="font-heading text-xl font-semibold">
                {data.profile.transactionsLast6Months.toLocaleString()}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground text-sm">
                Transactions by flat type
              </dt>
              <dd className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                {data.flatTypes.some(
                  (flatType) => flatType.transactionCount !== undefined,
                )
                  ? data.flatTypes.map(
                      (flatType) =>
                        flatType.transactionCount !== undefined && (
                          <span
                            key={flatType.name}
                            className="inline-flex items-center gap-1"
                          >
                            <Badge variant="secondary">{flatType.name}</Badge>
                            <span>
                              {flatType.transactionCount.toLocaleString()}
                            </span>
                          </span>
                        ),
                    )
                  : "None"}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted-foreground">
            No transaction summary is available for this town.
          </p>
        )}

        {trendFlatTypes.length ? (
          <section className="space-y-3">
            <h2 className="font-medium">Average resale price</h2>
            <Tabs
              defaultValue={trendFlatTypes[0].name}
              className="flex flex-wrap items-center gap-2"
            >
              <TabsList className="h-auto flex-wrap">
                {trendFlatTypes.map((flatType) => (
                  <TabsTrigger key={flatType.name} value={flatType.name}>
                    {flatType.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {trendFlatTypes.map((flatType, index) => {
                const defaultGranularity = flatType.monthly
                  ? "monthly"
                  : "yearly";
                return (
                  <TabsContent
                    key={flatType.name}
                    value={flatType.name}
                    className="contents"
                  >
                    <Tabs
                      defaultValue={defaultGranularity}
                      className="contents"
                    >
                      <TabsList className="sm:ml-auto">
                        {flatType.monthly && (
                          <TabsTrigger value="monthly">Monthly</TabsTrigger>
                        )}
                        {flatType.yearly && (
                          <TabsTrigger value="yearly">Yearly</TabsTrigger>
                        )}
                      </TabsList>
                      {flatType.monthly && (
                        <TabsContent value="monthly" className="w-full">
                          <PriceChart
                            series={flatType.monthly}
                            color={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        </TabsContent>
                      )}
                      {flatType.yearly && (
                        <TabsContent value="yearly" className="w-full">
                          <PriceChart
                            series={flatType.yearly}
                            color={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        </TabsContent>
                      )}
                    </Tabs>
                  </TabsContent>
                );
              })}
            </Tabs>
          </section>
        ) : (
          <p className="text-muted-foreground">
            No average resale-price trend is available for this town.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
