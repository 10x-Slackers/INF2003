"use client";

import { useRouter } from "next/navigation";
import { SubmitEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createAlertAction } from "@/app/alerts/actions";
import { savedAlertFiltersSchema } from "@/lib/collections/saved-alerts/types";
import { ROUTES } from "@/lib/routes";
import type { Town } from "@/lib/tables/towns/types";
import type { FlatType, FlatModel } from "@/lib/tables/lookups/types";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

export function AlertForm({
  towns,
  flatTypes,
  flatModels,
}: {
  towns: Town[];
  flatTypes: FlatType[];
  flatModels: FlatModel[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [selectedTownIds, setSelectedTownIds] = useState<string[]>([]);
  const [selectedFlatTypeIds, setSelectedFlatTypeIds] = useState<string[]>([]);
  const [selectedFlatModelIds, setSelectedFlatModelIds] = useState<string[]>(
    [],
  );

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const filters: Record<string, unknown> = {};

    if (selectedTownIds.length > 0) filters.townId = selectedTownIds;
    if (selectedFlatTypeIds.length > 0)
      filters.flatTypeId = selectedFlatTypeIds;
    if (selectedFlatModelIds.length > 0)
      filters.flatModelId = selectedFlatModelIds;

    const priceMin = formData.get("price_min");
    const priceMax = formData.get("price_max");
    if (priceMin || priceMax) {
      filters.price = {
        ...(priceMin && { min: Number(priceMin) }),
        ...(priceMax && { max: Number(priceMax) }),
      };
    }

    const floorAreaMin = formData.get("floorAreaSqm_min");
    const floorAreaMax = formData.get("floorAreaSqm_max");
    if (floorAreaMin || floorAreaMax) {
      filters.floorAreaSqm = {
        ...(floorAreaMin && { min: Number(floorAreaMin) }),
        ...(floorAreaMax && { max: Number(floorAreaMax) }),
      };
    }

    const storeyMin = formData.get("storey_min");
    const storeyMax = formData.get("storey_max");
    if (storeyMin || storeyMax) {
      filters.storey = {
        ...(storeyMin && { min: Number(storeyMin) }),
        ...(storeyMax && { max: Number(storeyMax) }),
      };
    }

    const leaseRemainingMin = formData.get("leaseRemaining_min");
    const leaseRemainingMax = formData.get("leaseRemaining_max");
    if (leaseRemainingMin || leaseRemainingMax) {
      filters.leaseRemaining = {
        ...(leaseRemainingMin && { min: Number(leaseRemainingMin) }),
        ...(leaseRemainingMax && { max: Number(leaseRemainingMax) }),
      };
    }

    const parsed = savedAlertFiltersSchema.safeParse(filters);
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ??
          "Please fill in at least one filter correctly.",
      );
      return;
    }

    setPending(true);
    try {
      await createAlertAction(parsed.data);
      toast.success("Alert created");
      setTimeout(() => router.push(ROUTES.ALERTS), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create alert.");
      setPending(false);
    }
  }

  function toggleId(
    id: string,
    selected: string[],
    setSelected: (ids: string[]) => void,
  ) {
    setSelected(
      selected.includes(id)
        ? selected.filter((i) => i !== id)
        : [...selected, id],
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New alert</CardTitle>
        <CardDescription>
          Choose the filters that will trigger your alert.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="grid gap-2">
            <Label>Towns</Label>
            <MultiCombobox
              options={towns.map((t) => ({ id: t.id, name: t.name }))}
              selected={selectedTownIds}
              onChange={setSelectedTownIds}
              placeholder="Select towns"
            />
          </div>

          <div className="grid gap-2">
            <Label>Flat types</Label>
            <div className="flex flex-wrap gap-2">
              {flatTypes.map((type) => (
                <Button
                  key={type.id}
                  type="button"
                  variant={
                    selectedFlatTypeIds.includes(String(type.id))
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    toggleId(
                      String(type.id),
                      selectedFlatTypeIds,
                      setSelectedFlatTypeIds,
                    )
                  }
                >
                  {type.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Flat models</Label>
            <MultiCombobox
              options={flatModels.map((m) => ({
                id: String(m.id),
                name: m.name,
              }))}
              selected={selectedFlatModelIds}
              onChange={setSelectedFlatModelIds}
              placeholder="Select flat models"
            />
          </div>

          <RangeField label="Price" name="price" />
          <RangeField label="Floor area (sqm)" name="floorAreaSqm" />
          <RangeField label="Storey" name="storey" />
          <RangeField label="Lease remaining (years)" name="leaseRemaining" />

          <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create alert"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function RangeField({ label, name }: { label: string; name: string }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <Input name={`${name}_min`} type="number" min={0} placeholder="Min" />
        <Input name={`${name}_max`} type="number" min={0} placeholder="Max" />
      </div>
    </div>
  );
}

function MultiCombobox({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);

  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((i) => i !== id)
        : [...selected, id],
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selected.length > 0 ? `${selected.length} selected` : placeholder}
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder={`Search ${placeholder.toLowerCase()}...`}
          />
          <CommandList>
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.name}
                  onSelect={() => toggle(option.id)}
                >
                  {option.name}
                  <CheckIcon
                    className={
                      selected.includes(option.id) ? "opacity-100" : "opacity-0"
                    }
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
