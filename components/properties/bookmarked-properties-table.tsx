"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DataTablePlaceholder } from "@/components/data/data-table-placeholder";
import { EmptyState } from "@/components/display/empty-state";
import { Button } from "@/components/ui/button";
import { bookmarkedPropertyIds } from "@/lib/frontend/placeholders";
import type { PlaceholderProperty } from "@/lib/frontend/types";

export function BookmarkedPropertiesTable({
  properties,
}: {
  properties: PlaceholderProperty[];
}) {
  const [bookmarkedIds, setBookmarkedIds] = useState(bookmarkedPropertyIds);

  const bookmarkedProperties = useMemo(
    () => properties.filter((property) => bookmarkedIds.includes(property.id)),
    [properties, bookmarkedIds],
  );

  function removeProperty(propertyId: string) {
    const nextIds = bookmarkedIds.filter((id) => id !== propertyId);
    setBookmarkedIds(nextIds);
  }

  if (!bookmarkedProperties.length) {
    return (
      <EmptyState
        title="No bookmarks"
        description="Bookmark a property from the property detail page, then create alerts from it here."
        action={
          <Button asChild>
            <Link href="/properties">Browse properties</Link>
          </Button>
        }
      />
    );
  }

  return (
    <DataTablePlaceholder
      columns={[
        { key: "town", header: "Town" },
        { key: "block", header: "Block" },
        { key: "streetName", header: "Street" },
        {
          key: "actions",
          header: "Actions",
          render: (property) => (
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/properties/${property.id}`}>View</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/alerts?propertyId=${property.id}`}>
                  Create alert
                </Link>
              </Button>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                onClick={() => removeProperty(property.id)}
              >
                Remove
              </Button>
            </div>
          ),
        },
      ]}
      rows={bookmarkedProperties}
    />
  );
}
