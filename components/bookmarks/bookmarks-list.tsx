"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/lib/routes";
import { removeBookmarkAction } from "@/app/bookmarks/actions";
import type { SavedPropertyDetail } from "@/lib/tables/saved-properties";
import { SavedPropertyCard } from "./saved-property-card";

export function BookmarksList({
  initialBookmarks,
}: {
  initialBookmarks: SavedPropertyDetail[];
}) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleRemove(propertyId: string) {
    setRemovingId(propertyId);
    try {
      await removeBookmarkAction(propertyId);
      setBookmarks((prev) => prev.filter((b) => b.property?.id !== propertyId));
      toast.success("Bookmark removed");
    } catch {
      toast.error("Failed to remove bookmark");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {bookmarks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <p className="text-sm text-muted-foreground">
              No saved properties yet.
            </p>
            <Button asChild variant="outline">
              <Link href={ROUTES.PROPERTIES}>Browse properties</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((bookmark) => (
            <SavedPropertyCard
              key={bookmark.id}
              bookmark={bookmark}
              onRemove={handleRemove}
              pending={removingId === bookmark.property?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
