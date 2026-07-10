"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { toggleBookmarkAction } from "@/app/bookmarks/actions";
import { ROUTES } from "@/lib/routes";

export function BookmarkButton({
  propertyId,
  initialSaved,
  className,
}: {
  propertyId: string;
  initialSaved: boolean;
  className?: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  async function handleClick() {
    if (!session) {
      toast.info("Please sign in to save bookmarks");
      router.push(
        `${ROUTES.LOGIN}?redirectTo=${encodeURIComponent(ROUTES.PROPERTY_DETAIL(propertyId))}`,
      );
      return;
    }
    setPending(true);
    try {
      const result = await toggleBookmarkAction(propertyId);
      setSaved(result.saved);
      toast.success(result.saved ? "Bookmark added" : "Bookmark removed");
    } catch {
      toast.error("Failed to update bookmark");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant={saved ? "default" : "outline"}
      disabled={pending}
      className={className}
      onClick={handleClick}
    >
      {saved ? <BookmarkCheck /> : <Bookmark />}
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
