"use client";

import { useState, useTransition } from "react";
import type { DataTableColumn } from "@/components/dashboard/DataTable";
import { PaginatedDataTable } from "@/components/dashboard/PaginatedDataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteSavedProperty } from "@/lib/tables/saved-properties/actions";
import {
  getPropertyColumns,
  type PropertyRow,
} from "../properties/property-columns";

type BookmarksTableProps = {
  properties: PropertyRow[];
  currentPage: number;
  pageCount: number;
};

export function BookmarksTable({
  properties,
  currentPage,
  pageCount,
}: BookmarksTableProps) {
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const visibleProperties = properties.filter(
    (property) => !removedIds.includes(property.id),
  );

  const remove = (propertyId: string) => {
    startTransition(async () => {
      await deleteSavedProperty(propertyId);
      setRemovedIds((ids) => [...ids, propertyId]);
    });
  };

  const columns: DataTableColumn<PropertyRow>[] = [
    ...getPropertyColumns("bookmarks"),
    {
      key: "remove",
      header: "",
      cell: (row) => (
        <Button
          disabled={isPending}
          onClick={() => remove(row.id)}
          size="sm"
          variant="destructive"
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookmarks</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <PaginatedDataTable
          columns={columns}
          currentPage={currentPage}
          data={visibleProperties}
          emptyMessage="No saved properties found."
          getPageHref={(page) => `/bookmarks?page=${page}`}
          getRowKey={(property) => property.id}
          pageCount={pageCount}
        />
      </CardContent>
    </Card>
  );
}
