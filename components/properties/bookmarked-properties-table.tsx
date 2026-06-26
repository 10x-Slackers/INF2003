"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DataTablePlaceholder } from "@/components/data/data-table-placeholder";
import { EmptyState } from "@/components/display/empty-state";
import { ConfirmationModal } from "@/components/forms/confirmation-modal";
import { Button } from "@/components/ui/button";
import { bookmarkedPropertyIds } from "@/lib/frontend/placeholders";
import type { PlaceholderProperty } from "@/lib/frontend/types";

export function BookmarkedPropertiesTable({
  properties,
}: {
  properties: PlaceholderProperty[];
}) {
  const [bookmarkedIds, setBookmarkedIds] = useState(bookmarkedPropertyIds);
  const [propertyToRemove, setPropertyToRemove] =
    useState<PlaceholderProperty | null>(null);

  const bookmarkedProperties = useMemo(
    () => properties.filter((property) => bookmarkedIds.includes(property.id)),
    [properties, bookmarkedIds],
  );

  function confirmRemoveProperty() {
    if (!propertyToRemove) return;

    setBookmarkedIds((current) =>
      current.filter((id) => id !== propertyToRemove.id),
    );
    setPropertyToRemove(null);
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
    <>
      <ConfirmationModal
        open={Boolean(propertyToRemove)}
        title="Remove saved property?"
        description="Confirm before removing this property from your placeholder saved list."
        confirmLabel="Remove"
        items={[
          { label: "Town", value: propertyToRemove?.town ?? "" },
          { label: "Block", value: propertyToRemove?.block ?? "" },
          { label: "Street", value: propertyToRemove?.streetName ?? "" },
        ]}
        onCancel={() => setPropertyToRemove(null)}
        onConfirm={confirmRemoveProperty}
      />
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
                  onClick={() => setPropertyToRemove(property)}
                >
                  Remove
                </Button>
              </div>
            ),
          },
        ]}
        rows={bookmarkedProperties}
      />
    </>
  );
}
