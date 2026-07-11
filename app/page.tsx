import { TownMap, TownMapSkeleton, type MapTown } from "@/components/town-map";
import { Card, CardContent } from "@/components/ui/card";
import { listTownProfiles } from "@/lib/collections/town-profile/functions";
import { listTowns } from "@/lib/tables/towns/functions";
import { Suspense } from "react";
import { HomeMetrics, HomeMetricsSkeleton } from "./home-metrics-view";

export default function Home() {
  return (
    <main className="container mx-auto flex flex-col gap-7 px-5 py-6">
      <Card>
        <CardContent>
          <Suspense fallback={<TownMapSkeleton />}>
            <TownMapSection />
          </Suspense>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4 md:flex-row [&>*]:flex-1">
        <Suspense fallback={<HomeMetricsSkeleton />}>
          <HomeMetrics />
        </Suspense>
      </section>
    </main>
  );
}

async function TownMapSection() {
  const [profiles, towns] = await Promise.all([
    listTownProfiles(),
    listTowns(),
  ]);
  const townById = new Map(towns.map((t) => [t.id, t]));
  const mapTowns: MapTown[] = profiles
    .filter((p) => townById.has(p._id))
    .map((p) => ({
      name: townById.get(p._id)!.name,
      coordinates: p.coordinates,
      summary: {
        totalTransaction: p.transactionSummary.totalTransaction,
        transactionsLast6Months: p.transactionSummary.transactionsLast6Months,
      },
    }));
  return <TownMap towns={mapTowns} />;
}
