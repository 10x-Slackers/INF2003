"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { ROUTES } from "@/lib/routes";
import {
  listBookmarksAction,
  removeBookmarkAction,
} from "@/app/bookmarks/actions";
import type { SavedPropertyDetail } from "@/lib/tables/saved-properties";
import { SavedPropertyCard } from "./saved-property-card";

export function BookmarksList({
  initialBookmarks,
  initialTotal,
  pageSize,
}: {
  initialBookmarks: SavedPropertyDetail[];
  initialTotal: number;
  pageSize: number;
}) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function loadPage(currentPage: number) {
    setLoading(true);
    try {
      const { data, total } = await listBookmarksAction({
        page: currentPage,
        pageSize,
      });
      setBookmarks(data);
      setTotal(total);
      setPage(currentPage);
    } catch {
      toast.error("Failed to load bookmarks");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(propertyId: string) {
    setRemovingId(propertyId);
    try {
      await removeBookmarkAction(propertyId);
      setBookmarks((prev) => prev.filter((b) => b.property?.id !== propertyId));
      setTotal((prev) => {
        const next = prev - 1;
        if (next > 0 && bookmarks.length === 1) loadPage(page);
        return next;
      });
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

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalLabel={`${total} bookmarks`}
          loading={loading}
          onPrev={() => loadPage(Math.max(1, page - 1))}
          onNext={() => loadPage(Math.min(totalPages, page + 1))}
        />
      )}
    </div>
  );
}
