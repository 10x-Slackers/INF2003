"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  createSavedProperty,
  deleteSavedProperty,
} from "@/lib/tables/saved-properties/actions";

export function SavePropertyButton({
  propertyId,
  initialSaved,
}: {
  propertyId: string;
  initialSaved: boolean;
}) {
  const { data: session } = useSession();
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  if (!session?.user) return null;

  const toggle = () => {
    startTransition(async () => {
      if (saved) await deleteSavedProperty(propertyId);
      else await createSavedProperty(propertyId);
      setSaved(!saved);
    });
  };

  return (
    <Button disabled={isPending} onClick={toggle} variant="outline">
      {saved ? <BookmarkCheck /> : <Bookmark />}
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
