"use client";

import { useState } from "react";
import { PropertyManagementTable } from "@/components/admin/property-management-table";
import { Button } from "@/components/ui/button";
import { UserRoleTable } from "@/components/admin/user-role-table";
import { placeholderUsers } from "@/lib/frontend/placeholders";

const tables = [
  { id: "users", label: "Users" },
  { id: "properties", label: "Properties" },
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
      {activeTable === "properties" && <PropertyManagementTable />}
    </div>
  );
}
