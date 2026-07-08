"use client";

import { useRouter } from "next/navigation";
import { SubmitEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPropertyAction } from "@/app/properties/actions";
import { createPropertySchema } from "@/lib/tables/properties/types";
import { ROUTES } from "@/lib/routes";
import { TownCombobox } from "@/components/properties/town-combobox";
import type { Town } from "@/lib/tables/towns";

export function PropertyForm({ towns }: { towns: Town[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [townId, setTownId] = useState<string | undefined>(undefined);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const values = {
      town_id: townId ?? "",
      block: String(formData.get("block") ?? ""),
      street_name: String(formData.get("street_name") ?? ""),
      lease_commence_year: String(formData.get("lease_commence_year") ?? ""),
    };

    const parsed = createPropertySchema.safeParse(values);
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ??
          "Please fill in all fields correctly.",
      );
      return;
    }

    setPending(true);
    try {
      await createPropertyAction(parsed.data);
      toast.success("Property created");
      setTimeout(() => router.push(ROUTES.PROPERTIES), 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create property.",
      );
      setPending(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid gap-2">
            <Label htmlFor="town">Town</Label>
            <TownCombobox towns={towns} value={townId} onChange={setTownId} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="block">Block</Label>
            <Input id="block" name="block" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="street_name">Street name</Label>
            <Input id="street_name" name="street_name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lease_commence_year">Lease commence year</Label>
            <Input
              id="lease_commence_year"
              name="lease_commence_year"
              type="number"
              min={1960}
              max={2100}
              required
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create property"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
