"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { bookmarkedPropertyIds } from "@/lib/frontend/placeholders";
import type { PlaceholderProperty } from "@/lib/frontend/types";

export function PropertyActions({
  property,
}: {
  property: PlaceholderProperty;
}) {
  const { data: session, status } = useSession();
  const [bookmarkedIds, setBookmarkedIds] = useState(bookmarkedPropertyIds);

  const isBookmarked = bookmarkedIds.includes(property.id);

  function toggleBookmark() {
    const nextIds = isBookmarked
      ? bookmarkedIds.filter((id) => id !== property.id)
      : [...bookmarkedIds, property.id];

    setBookmarkedIds(nextIds);
  }

  if (status === "loading") {
    return (
      <Button disabled type="button" variant="outline">
        Loading
      </Button>
    );
  }

  if (!session?.user) {
    return (
      <Button asChild variant="outline">
        <Link href={`/login?redirectTo=/properties/${property.id}`}>
          Login to bookmark
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant={isBookmarked ? "secondary" : "default"}
        onClick={toggleBookmark}
      >
        {isBookmarked ? "Bookmarked" : "Bookmark"}
      </Button>
      <Button asChild type="button" variant="outline">
        <Link href={`/alerts?propertyId=${property.id}`}>Create alert</Link>
      </Button>
    </div>
  );
}
