import { TownMap, TownMapSkeleton, type MapTown } from "@/components/town-map";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listTownProfiles } from "@/lib/collections/town-profile";
import { listTowns } from "@/lib/tables/towns/functions";
import { Suspense } from "react";
import { getAvgPriceByFlatType, getPricePerSqmByFlatType } from "./home-stats";
import { PriceTrendCard } from "@/components/home/price-trend-card";

export default function Home() {
  return (
    <main className="container mx-auto flex flex-col gap-7 px-5 py-6">
      <section>
        <h1 className="text-2xl font-semibold">HDB resale overview</h1>
        <p className="text-muted-foreground">
          Explore town activity and resale price trends across Singapore.
        </p>
      </section>
      <Card>
        <CardContent>
          <Suspense fallback={<TownMapSkeleton />}>
            <TownMapSection />
          </Suspense>
        </CardContent>
      </Card>

      <Suspense fallback={<PriceTrendCardSkeleton />}>
        <AvgPriceSection />
      </Suspense>

      <Suspense fallback={<PriceTrendCardSkeleton />}>
        <PricePerSqmSection />
      </Suspense>
    </main>
  );
}

async function AvgPriceSection() {
  const data = await getAvgPriceByFlatType();
  if (!data.flatTypes.length) return null;
  return (
    <PriceTrendCard
      data={data}
      title="Average price by flat type"
      description="Average resale price across Singapore"
      variant="avgPrice"
    />
  );
}

async function PricePerSqmSection() {
  const data = await getPricePerSqmByFlatType();
  if (!data.flatTypes.length) return null;
  return (
    <PriceTrendCard
      data={data}
      title="Price per sqm by flat type"
      description="Average resale price per square metre across Singapore"
      variant="perSqm"
    />
  );
}

function PriceTrendCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-[400px] w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

async function TownMapSection() {
  let mapTowns: MapTown[] = [];
  try {
    const [profiles, towns] = await Promise.all([
      listTownProfiles(),
      listTowns(),
    ]);
    const townById = new Map(towns.map((t) => [t.id, t]));
    mapTowns = profiles
      .filter((p) => townById.has(p._id))
      .map((p) => ({
        id: p._id,
        name: townById.get(p._id)!.name,
        coordinates: p.coordinates,
        summary: {
          totalTransaction: p.transactionSummary.totalTransaction,
          transactionsLast6Months: p.transactionSummary.transactionsLast6Months,
        },
      }));
  } catch (error) {
    console.error("Error fetching town map data:", error);
    return (
      <p className="text-muted-foreground p-4 text-center">
        Failed to load town map.
      </p>
    );
  }
  return <TownMap towns={mapTowns} />;
}
