"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserRole } from "@/lib/auth";
import type { PlaceholderUser } from "@/lib/frontend/types";

const roleOptions: UserRole[] = ["USER", "AGENT", "ADMIN"];

export function UserRoleTable({ users }: { users: PlaceholderUser[] }) {
  const [rows, setRows] = useState(users);
  const [selectedRoles, setSelectedRoles] = useState(
    Object.fromEntries(users.map((user) => [user.id, user.role])),
  );
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return rows;

    return rows.filter((user) =>
      `${user.name} ${user.email}`.toLowerCase().includes(query),
    );
  }, [rows, search]);

  function updateRole(userId: string) {
    const role = selectedRoles[userId];

    setRows((current) =>
      current.map((user) => (user.id === userId ? { ...user, role } : user)),
    );
    setMessage("Placeholder role granted.");
  }

  return (
    <div className="grid gap-3">
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by name or email"
      />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Current role</TableHead>
            <TableHead>Grant role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRows.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant="outline">{user.role}</Badge>
              </TableCell>
              <TableCell>
                <Select
                  value={selectedRoles[user.id]}
                  onChange={(event) =>
                    setSelectedRoles((current) => ({
                      ...current,
                      [user.id]: event.target.value as UserRole,
                    }))
                  }
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </Select>
              </TableCell>
              <TableCell>{user.createdAt}</TableCell>
              <TableCell>
                <Button
                  disabled={selectedRoles[user.id] === user.role}
                  size="sm"
                  type="button"
                  onClick={() => updateRole(user.id)}
                >
                  Grant
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!filteredRows.length && (
        <p className="text-sm text-muted-foreground">No users found.</p>
      )}
    </div>
  );
}
