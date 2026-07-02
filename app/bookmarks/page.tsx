import Link from "next/link";
import { Suspense } from "react";
import { DataTable } from "@/components/dashboard/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { propertyColumns } from "../properties/property-columns";
import { listSavedProperties } from "@/lib/tables/saved-properties";
import { listTowns } from "@/lib/tables/towns";
import { BookmarksTable } from "./bookmarks-table";

const pageSize = 10;

type BookmarksPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default function BookmarksPage({ searchParams }: BookmarksPageProps) {
  return (
    <main className="container mx-auto px-5 py-6">
      <Suspense fallback={<BookmarksSkeleton />}>
        <Bookmarks searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Bookmarks({
  searchParams,
}: {
  searchParams: BookmarksPageProps["searchParams"];
}) {
  const session = await auth();
  if (!session?.user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bookmarks</CardTitle>
        </CardHeader>
        <CardContent>
          <Link className="underline" href={ROUTES.LOGIN}>
            Sign in
          </Link>{" "}
          to see your saved properties.
        </CardContent>
      </Card>
    );
  }

  const query = await searchParams;
  const page = getPositiveNumber(query.page) ?? 1;

  const [results, townsResult] = await Promise.all([
    listSavedProperties({ userId: session.user.id, page, pageSize }),
    listTowns({ page: 1, pageSize: 100 }),
  ]);
  const pageCount = Math.max(1, Math.ceil(results.total / pageSize));
  const townNameById = new Map(
    townsResult.data.map((town) => [town.id, town.name]),
  );

  return (
    <BookmarksTable
      currentPage={Math.min(page, pageCount)}
      pageCount={pageCount}
      properties={results.data
        .filter((saved) => saved.property !== null)
        .map((saved) => ({
          ...saved.property!,
          town_name: townNameById.get(saved.property!.town_id) ?? "—",
        }))}
    />
  );
}

function getPositiveNumber(value?: string) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

function BookmarksSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookmarks</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <DataTable columns={propertyColumns} data={[]} skeletonRows={2} />
        <Skeleton className="mx-auto h-8 w-64" />
      </CardContent>
    </Card>
  );
}
