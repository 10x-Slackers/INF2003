"use client";

import { FormEvent, useMemo, useState } from "react";
import { DataTablePlaceholder } from "@/components/data/data-table-placeholder";
import { PlaceholderPanel } from "@/components/display/placeholder-panel";
import {
  FormFieldSelect,
  FormFieldText,
  SubmitButton,
} from "@/components/forms/form-fields";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  flatModelOptions,
  flatTypeOptions,
  properties,
  storeyRangeOptions,
} from "@/lib/frontend/placeholders";
import type { PlaceholderProperty } from "@/lib/frontend/types";

function optionLabel(
  options: { value: string; label: string }[],
  value: string,
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function CreateTransactionFlow() {
  const [selectedProperty, setSelectedProperty] =
    useState<PlaceholderProperty | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const searchResults = useMemo(() => properties, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!selectedProperty) {
      setError("Select a property before creating the transaction draft.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const required = [
      "flatTypeId",
      "flatModelId",
      "storeyRangeId",
      "floorAreaSqm",
      "transactionMonth",
      "resalePrice",
    ];

    const values = Object.fromEntries(
      required.map((field) => [field, String(formData.get(field) ?? "")]),
    );

    if (required.some((field) => !values[field])) {
      setError("Fill in all transaction details.");
      return;
    }

    setMessage(
      `Placeholder transaction ready for ${optionLabel(flatTypeOptions, values.flatTypeId)} at ${selectedProperty.block} ${selectedProperty.streetName}.`,
    );
    event.currentTarget.reset();
  }

  return (
    <div className="grid gap-6">
      <PlaceholderPanel
        title="1. Search for property"
        description="This form is static for now and shows sample properties from placeholder data."
      >
        <form className="grid gap-4 md:grid-cols-4">
          <FormFieldText label="Town" name="town" placeholder="Queenstown" />
          <FormFieldText label="Block" name="block" placeholder="12" />
          <FormFieldText
            label="Street name"
            name="streetName"
            placeholder="Dover Close East"
          />
          <FormFieldText
            label="Lease year"
            name="leaseCommenceYear"
            type="number"
          />
        </form>
      </PlaceholderPanel>

      <PlaceholderPanel
        title="2. Select property"
        description="Agents will eventually search MariaDB properties before inserting a resale transaction."
      >
        <DataTablePlaceholder
          columns={[
            { key: "town", header: "Town" },
            { key: "block", header: "Block" },
            { key: "streetName", header: "Street" },
            { key: "leaseCommenceYear", header: "Lease year" },
            {
              key: "select",
              header: "Select",
              render: (property) => (
                <Button
                  size="sm"
                  type="button"
                  variant={
                    selectedProperty?.id === property.id ? "default" : "outline"
                  }
                  onClick={() => setSelectedProperty(property)}
                >
                  {selectedProperty?.id === property.id ? "Selected" : "Select"}
                </Button>
              ),
            },
          ]}
          rows={searchResults}
        />
      </PlaceholderPanel>

      <PlaceholderPanel
        title="3. Enter transaction details"
        description="The fields mirror the resale_transactions table. This placeholder does not persist anything yet."
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="md:col-span-2">
            {selectedProperty ? (
              <Badge variant="outline">
                Selected: {selectedProperty.block} {selectedProperty.streetName}
              </Badge>
            ) : (
              <Badge variant="outline">No property selected</Badge>
            )}
          </div>

          <FormFieldSelect
            label="Flat type"
            name="flatTypeId"
            options={flatTypeOptions}
          />
          <FormFieldSelect
            label="Flat model"
            name="flatModelId"
            options={flatModelOptions}
          />
          <FormFieldSelect
            label="Storey range"
            name="storeyRangeId"
            options={storeyRangeOptions}
          />
          <FormFieldText
            label="Floor area sqm"
            name="floorAreaSqm"
            min="1"
            step="0.01"
            type="number"
          />
          <FormFieldText
            label="Transaction month"
            name="transactionMonth"
            type="month"
          />
          <FormFieldText
            label="Resale price"
            name="resalePrice"
            min="1"
            step="0.01"
            type="number"
          />

          {error && (
            <p className="text-sm text-destructive md:col-span-2">{error}</p>
          )}
          {message && (
            <p className="text-sm text-muted-foreground md:col-span-2">
              {message}
            </p>
          )}

          <div className="md:col-span-2">
            <SubmitButton>Create transaction draft</SubmitButton>
          </div>
        </form>
      </PlaceholderPanel>
    </div>
  );
}
