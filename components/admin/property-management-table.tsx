"use client";

import { FormEvent, useMemo, useState } from "react";
import { DataTablePlaceholder } from "@/components/data/data-table-placeholder";
import { ConfirmationModal } from "@/components/forms/confirmation-modal";
import { FormFieldText } from "@/components/forms/form-fields";
import { Button } from "@/components/ui/button";
import { properties } from "@/lib/frontend/placeholders";
import type { PlaceholderProperty } from "@/lib/frontend/types";

export function PropertyManagementTable() {
  const [rows, setRows] = useState(properties);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState({
    town: "",
    block: "",
    streetName: "",
    leaseCommenceYear: "",
  });
  const [search, setSearch] = useState("");
  const [town, setTown] = useState("");
  const [message, setMessage] = useState("");
  const [pendingProperty, setPendingProperty] = useState<{
    action: "Create" | "Update";
    editingId: string;
    property: PlaceholderProperty;
  } | null>(null);
  const [propertyToDelete, setPropertyToDelete] =
    useState<PlaceholderProperty | null>(null);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const townQuery = town.trim().toLowerCase();

    return rows.filter((property) => {
      const haystack =
        `${property.town} ${property.block} ${property.streetName}`.toLowerCase();
      return (
        (!query || haystack.includes(query)) &&
        (!townQuery || property.town.toLowerCase().includes(townQuery))
      );
    });
  }, [rows, search, town]);

  function saveProperty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPendingProperty({
      action: editingId ? "Update" : "Create",
      editingId,
      property: {
        id: editingId || `property-${Date.now()}`,
        town: form.town.toUpperCase(),
        block: form.block,
        streetName: form.streetName.toUpperCase(),
        leaseCommenceYear: Number(form.leaseCommenceYear),
      },
    });
  }

  function confirmSaveProperty() {
    if (!pendingProperty) return;

    const nextProperty = pendingProperty.property;

    setRows((current) =>
      pendingProperty.editingId
        ? current.map((property) =>
            property.id === pendingProperty.editingId ? nextProperty : property,
          )
        : [nextProperty, ...current],
    );
    setEditingId("");
    setForm({ town: "", block: "", streetName: "", leaseCommenceYear: "" });
    setMessage(
      pendingProperty.editingId ? "Property updated." : "Property created.",
    );
    setPendingProperty(null);
  }

  function editProperty(property: PlaceholderProperty) {
    setEditingId(property.id);
    setForm({
      town: property.town,
      block: property.block,
      streetName: property.streetName,
      leaseCommenceYear: String(property.leaseCommenceYear),
    });
    setMessage(
      `Editing ${property.block} ${property.streetName}. Submit the form to save.`,
    );
  }

  function confirmDeleteProperty() {
    if (!propertyToDelete) return;

    setRows((current) =>
      current.filter((property) => property.id !== propertyToDelete.id),
    );
    setMessage("Property deleted.");
    setPropertyToDelete(null);
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        <FormFieldText
          label="Search"
          name="propertySearch"
          placeholder="Block or street"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <FormFieldText
          label="Town"
          name="propertyTownFilter"
          placeholder="Queenstown"
          value={town}
          onChange={(event) => setTown(event.target.value)}
        />
      </div>

      <form className="grid gap-3 md:grid-cols-5" onSubmit={saveProperty}>
        <FormFieldText
          label="Town"
          name="town"
          placeholder="Queenstown"
          value={form.town}
          onChange={(event) =>
            setForm((current) => ({ ...current, town: event.target.value }))
          }
        />
        <FormFieldText
          label="Block"
          name="block"
          placeholder="12"
          value={form.block}
          onChange={(event) =>
            setForm((current) => ({ ...current, block: event.target.value }))
          }
        />
        <FormFieldText
          label="Street"
          name="streetName"
          placeholder="Dover Close East"
          value={form.streetName}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              streetName: event.target.value,
            }))
          }
        />
        <FormFieldText
          label="Lease year"
          name="leaseCommenceYear"
          type="number"
          value={form.leaseCommenceYear}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              leaseCommenceYear: event.target.value,
            }))
          }
        />
        <div className="self-end">
          <Button type="submit">{editingId ? "Update" : "Create"}</Button>
        </div>
      </form>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <ConfirmationModal
        open={Boolean(pendingProperty)}
        title={`${pendingProperty?.action ?? "Save"} property?`}
        description="Confirm the placeholder property details."
        confirmLabel={pendingProperty?.action ?? "Save"}
        items={[
          { label: "Town", value: pendingProperty?.property.town ?? "" },
          { label: "Block", value: pendingProperty?.property.block ?? "" },
          {
            label: "Street",
            value: pendingProperty?.property.streetName ?? "",
          },
          {
            label: "Lease year",
            value: pendingProperty
              ? String(pendingProperty.property.leaseCommenceYear)
              : "",
          },
        ]}
        onCancel={() => setPendingProperty(null)}
        onConfirm={confirmSaveProperty}
      />
      <ConfirmationModal
        open={Boolean(propertyToDelete)}
        title="Delete property?"
        description="Confirm before removing this placeholder property."
        confirmLabel="Delete"
        items={[
          { label: "Town", value: propertyToDelete?.town ?? "" },
          { label: "Block", value: propertyToDelete?.block ?? "" },
          { label: "Street", value: propertyToDelete?.streetName ?? "" },
          {
            label: "Lease year",
            value: propertyToDelete
              ? String(propertyToDelete.leaseCommenceYear)
              : "",
          },
        ]}
        onCancel={() => setPropertyToDelete(null)}
        onConfirm={confirmDeleteProperty}
      />

      <DataTablePlaceholder
        columns={[
          { key: "town", header: "Town" },
          { key: "block", header: "Block" },
          { key: "streetName", header: "Street" },
          { key: "leaseCommenceYear", header: "Lease year" },
          {
            key: "actions",
            header: "Actions",
            render: (property) => (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => editProperty(property)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  onClick={() => setPropertyToDelete(property)}
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        rows={filteredRows}
      />
    </div>
  );
}
