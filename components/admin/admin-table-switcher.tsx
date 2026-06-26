"use client";

import { useState } from "react";
import { DataTablePlaceholder } from "@/components/data/data-table-placeholder";
import { Button } from "@/components/ui/button";
import { UserRoleTable } from "@/components/admin/user-role-table";
import {
  placeholderAmenities,
  placeholderReferenceTables,
  placeholderTowns,
  placeholderUsers,
} from "@/lib/frontend/placeholders";

const tables = [
  { id: "users", label: "Users" },
  { id: "towns", label: "Towns" },
  { id: "amenities", label: "Amenities" },
  { id: "reference", label: "Reference data" },
] as const;

type AdminTable = (typeof tables)[number]["id"];

export function AdminTableSwitcher() {
  const [activeTable, setActiveTable] = useState<AdminTable>("users");

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {tables.map((table) => (
          <Button
            key={table.id}
            type="button"
            variant={activeTable === table.id ? "default" : "outline"}
            onClick={() => setActiveTable(table.id)}
          >
            {table.label}
          </Button>
        ))}
      </div>

      {activeTable === "users" && <UserRoleTable users={placeholderUsers} />}

      {activeTable === "towns" && (
        <DataTablePlaceholder
          columns={[
            { key: "name", header: "Town" },
            { key: "region", header: "Region" },
            { key: "properties", header: "Properties" },
          ]}
          rows={placeholderTowns}
        />
      )}

      {activeTable === "amenities" && (
        <DataTablePlaceholder
          columns={[
            { key: "name", header: "Amenity" },
            { key: "type", header: "Type" },
            { key: "town", header: "Town" },
          ]}
          rows={placeholderAmenities}
        />
      )}

      {activeTable === "reference" && (
        <DataTablePlaceholder
          columns={[
            { key: "name", header: "Table" },
            { key: "records", header: "Records" },
            { key: "status", header: "Status" },
          ]}
          rows={placeholderReferenceTables}
        />
      )}
    </div>
  );
}
