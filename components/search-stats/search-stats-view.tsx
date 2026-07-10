"use client";

import { useEffect, useState } from "react";
import { getSearchStatsAction } from "@/app/search-stats/actions";
import type { SearchStats } from "@/lib/collections/search-logs";
import { MetricCard, MetricCardSkeleton } from "@/components/metric-card";
import { TownPopularity } from "./town-popularity";
import { FlatTypeDemand } from "./flat-type-demand";
import { PriceRangeDistribution } from "./price-range-distribution";
import { TopFlatModels } from "./top-flat-models";

export function SearchStatsView() {
  const [stats, setStats] = useState<SearchStats | null>(null);

  useEffect(() => {
    getSearchStatsAction().then(setStats);
  }, []);

  if (!stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCardSkeleton label="Total searches" />
        <div className="sm:col-span-2 lg:col-span-2">
          <MetricCardSkeleton label="Loading charts..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <MetricCard
        label="Total searches"
        value={stats.totalSearches.toLocaleString()}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <TownPopularity data={stats.topTowns} />
        <FlatTypeDemand data={stats.topFlatTypes} />
        <PriceRangeDistribution data={stats.priceRanges} />
        <TopFlatModels data={stats.topFlatModels} />
      </div>
    </div>
  );
}
