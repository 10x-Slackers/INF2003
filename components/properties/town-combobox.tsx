"use client";
import { useState } from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
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
import { regionSchema, type Town } from "@/lib/tables/towns/types";

const REGIONS = regionSchema.options as readonly string[];

export function TownCombobox({
  towns,
  value,
  onChange,
}: {
  towns: Town[];
  value?: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = towns.find((t) => t.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {selected ? selected.name : "Select town"}
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search town..." />
          <CommandList>
            <CommandEmpty>No town found.</CommandEmpty>
            {REGIONS.map((region) => {
              const group = towns.filter((t) => t.region === region);
              if (group.length === 0) return null;
              return (
                <CommandGroup key={region} heading={region}>
                  {group.map((town) => (
                    <CommandItem
                      key={town.id}
                      value={town.name}
                      onSelect={() => {
                        onChange(town.id);
                        setOpen(false);
                      }}
                    >
                      {town.name}
                      <CheckIcon
                        className={
                          value === town.id ? "opacity-100" : "opacity-0"
                        }
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
