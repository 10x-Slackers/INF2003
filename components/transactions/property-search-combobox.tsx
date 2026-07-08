"use client";

import { useState } from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { searchPropertiesAction } from "@/app/transactions/actions";
import type { PropertySearchResult } from "@/lib/tables/properties";

export function PropertySearchCombobox({
  value,
  onChange,
}: {
  value?: string;
  onChange: (propertyId: string, label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PropertySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | undefined>();

  const debouncedSearch = useDebouncedCallback(async (search: string) => {
    if (search.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await searchPropertiesAction(search);
      setResults(data);
    } catch (err) {
      setResults([]);
      toast.error(
        err instanceof Error ? err.message : "Failed to search properties",
      );
    } finally {
      setLoading(false);
    }
  }, 300);

  function handleSelect(property: PropertySearchResult) {
    const label = `${property.block} ${property.street_name}, ${property.town_name}`;
    onChange(property.id, label);
    setSelectedLabel(label);
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
      setResults([]);
    }
  }

  function handleInputChange(nextQuery: string) {
    setQuery(nextQuery);
    setLoading(true);
    debouncedSearch(nextQuery);
  }

  const tooShort = query.trim().length < 2;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedLabel ?? "Search property..."}
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search property..."
            value={query}
            onValueChange={handleInputChange}
            aria-label="Search property"
          />
          <CommandList>
            {tooShort ? (
              <CommandEmpty>
                Type at least 2 characters to search...
              </CommandEmpty>
            ) : loading ? (
              <CommandEmpty>Searching...</CommandEmpty>
            ) : results.length === 0 ? (
              <CommandEmpty>No properties found.</CommandEmpty>
            ) : null}
            <CommandGroup>
              {results.map((property) => (
                <CommandItem
                  key={property.id}
                  value={property.id}
                  onSelect={() => handleSelect(property)}
                >
                  {`${property.block} ${property.street_name}, ${property.town_name}`}
                  <CheckIcon
                    className={cn(
                      "ml-auto",
                      value === property.id ? "opacity-100" : "opacity-0",
                    )}
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
