import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTownById, listAllAmenitiesByTown } from "@/lib/tables/towns";
import { TownStatisticsCard } from "@/components/towns/town-statistics-card";
import { getTownStats } from "./town-stats";

export default async function TownDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [town, amenities, stats] = await Promise.all([
    getTownById(id),
    listAllAmenitiesByTown(id),
    getTownStats(id),
  ]);
  if (!town) notFound();

  const amenitiesByType = Map.groupBy(
    amenities,
    (amenity) => amenity.amenity_type_name,
  );
  return (
    <main className="container mx-auto flex flex-col gap-6 px-5 py-6">
      <section>
        <h1 className="font-heading text-2xl font-semibold">{town.name}</h1>
        <p className="text-muted-foreground">{town.region}</p>
      </section>

      <TownStatisticsCard data={stats} />

      <section>
        <Card className="flex h-[22rem] min-w-0 flex-col">
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1">
            {amenities.length ? (
              <Tabs
                defaultValue={`amenity-type-${amenitiesByType.keys().next().value}`}
                className="h-full min-h-0"
              >
                <TabsList
                  aria-label="Amenity categories"
                  className="h-auto w-full flex-wrap justify-start"
                >
                  {[...amenitiesByType].map(([type]) => (
                    <TabsTrigger key={type} value={`amenity-type-${type}`}>
                      {type}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {[...amenitiesByType].map(([type, items]) => (
                  <TabsContent
                    key={type}
                    value={`amenity-type-${type}`}
                    className="min-h-0 overflow-y-auto pr-2"
                  >
                    <ul className="space-y-2 text-muted-foreground">
                      {items.map((amenity) => {
                        const address = [
                          amenity.street_name,
                          amenity.postal_code,
                        ]
                          .filter(Boolean)
                          .join(", ");

                        return (
                          <li key={amenity.id}>
                            {amenity.name}
                            {address && ` (${address})`}
                          </li>
                        );
                      })}
                    </ul>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <p className="text-muted-foreground">
                No amenities are available for this town.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
