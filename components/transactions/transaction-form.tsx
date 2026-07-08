"use client";

import { useRouter } from "next/navigation";
import { SubmitEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTransactionAction } from "@/app/transactions/actions";
import { createTransactionSchema } from "@/lib/tables/transactions/types";
import { ROUTES } from "@/lib/routes";
import { PropertySearchCombobox } from "@/components/transactions/property-search-combobox";
import type { FlatType, FlatModel, StoreyRange } from "@/lib/tables/lookups";

export function TransactionForm({
  flatTypes,
  flatModels,
  storeyRanges,
}: {
  flatTypes: FlatType[];
  flatModels: FlatModel[];
  storeyRanges: StoreyRange[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [propertyId, setPropertyId] = useState<string | undefined>(undefined);
  const [flatTypeId, setFlatTypeId] = useState<string | undefined>(undefined);
  const [flatModelId, setFlatModelId] = useState<string | undefined>(undefined);
  const [storeyRangeId, setStoreyRangeId] = useState<string | undefined>(
    undefined,
  );

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const values = {
      property_id: propertyId ?? "",
      flat_type_id: flatTypeId ?? "",
      flat_model_id: flatModelId ?? "",
      storey_range_id: storeyRangeId ?? "",
      floor_area_sqm: String(formData.get("floor_area_sqm") ?? ""),
      transaction_month: String(formData.get("transaction_month") ?? ""),
      resale_price: String(formData.get("resale_price") ?? ""),
    };

    const parsed = createTransactionSchema.safeParse(values);
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ??
          "Please fill in all fields correctly.",
      );
      return;
    }

    setPending(true);
    try {
      await createTransactionAction(parsed.data);
      toast.success("Transaction created");
      setTimeout(() => router.push(ROUTES.TRANSACTIONS), 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create transaction.",
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
            <Label htmlFor="property">Property</Label>
            <PropertySearchCombobox
              value={propertyId}
              onChange={(id) => setPropertyId(id)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="flat_type_id">Flat type</Label>
            <Select value={flatTypeId ?? ""} onValueChange={setFlatTypeId}>
              <SelectTrigger id="flat_type_id">
                <SelectValue placeholder="Select a flat type" />
              </SelectTrigger>
              <SelectContent>
                {flatTypes.map((ft) => (
                  <SelectItem key={ft.id} value={String(ft.id)}>
                    {ft.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="flat_model_id">Flat model</Label>
            <Select value={flatModelId ?? ""} onValueChange={setFlatModelId}>
              <SelectTrigger id="flat_model_id">
                <SelectValue placeholder="Select a flat model" />
              </SelectTrigger>
              <SelectContent>
                {flatModels.map((fm) => (
                  <SelectItem key={fm.id} value={String(fm.id)}>
                    {fm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="storey_range_id">Storey range</Label>
            <Select
              value={storeyRangeId ?? ""}
              onValueChange={setStoreyRangeId}
            >
              <SelectTrigger id="storey_range_id">
                <SelectValue placeholder="Select a storey range" />
              </SelectTrigger>
              <SelectContent>
                {storeyRanges.map((sr) => (
                  <SelectItem key={sr.id} value={String(sr.id)}>
                    {sr.min_storey}-{sr.max_storey}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="floor_area_sqm">Floor area (sqm)</Label>
            <Input
              id="floor_area_sqm"
              name="floor_area_sqm"
              type="number"
              min={1}
              step="0.01"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="transaction_month">Transaction month</Label>
            <Input
              id="transaction_month"
              name="transaction_month"
              type="month"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="resale_price">Resale price</Label>
            <Input
              id="resale_price"
              name="resale_price"
              type="number"
              min={1}
              step="0.01"
              required
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create transaction"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
