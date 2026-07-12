import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTownProfileById } from "@/lib/collections/town-profile";
import { getTownById, listAllAmenitiesByTown } from "@/lib/tables/towns";

export default async function TownDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [town, profile, amenities] = await Promise.all([
    getTownById(id),
    getTownProfileById(id),
    listAllAmenitiesByTown(id),
  ]);
  if (!town) notFound();

  const amenitiesByType = Map.groupBy(
    amenities,
    (amenity) => amenity.amenity_type_name,
  );
  const flatTypeCounts = Object.entries(
    profile?.transactionSummary.transactionCountByFlatType ?? {},
  );

  return (
    <main className="container mx-auto flex flex-col gap-6 px-5 py-6">
      <section>
        <h1 className="font-heading text-2xl font-semibold">{town.name}</h1>
        <p className="text-muted-foreground">{town.region}</p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            {profile && (
              <p className="text-sm text-muted-foreground">
                Last updated{" "}
                {new Date(profile.updatedAt * 1000).toLocaleDateString()}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {profile ? (
              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <dt className="text-sm text-muted-foreground">
                    Total transactions
                  </dt>
                  <dd className="font-heading text-xl font-semibold">
                    {profile.transactionSummary.totalTransaction.toLocaleString()}
                  </dd>
                </div>
                <div className="rounded-lg border p-3">
                  <dt className="text-sm text-muted-foreground">
                    Transactions in last 6 months
                  </dt>
                  <dd className="font-heading text-xl font-semibold">
                    {profile.transactionSummary.transactionsLast6Months.toLocaleString()}
                  </dd>
                </div>
                <div className="rounded-lg border p-3">
                  <dt className="text-sm text-muted-foreground">
                    Transactions by flat type
                  </dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {flatTypeCounts.length
                      ? flatTypeCounts.map(([type, count]) => (
                          <span
                            key={type}
                            className="inline-flex items-center gap-1"
                          >
                            <Badge variant="secondary">{type}-room</Badge>
                            <span>{count.toLocaleString()}</span>
                          </span>
                        ))
                      : "None"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-muted-foreground">
                No profile summary is available for this town.
              </p>
            )}
          </CardContent>
        </Card>

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

      <Card>
        <CardHeader>
          <CardTitle>Statistics (deferred)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </main>
  );
}
