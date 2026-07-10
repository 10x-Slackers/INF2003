"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchUsers } from "@/app/admin/actions";
import type { PublicUser } from "@/lib/tables/users";
import { UsersTable } from "./users/users-table";
import { Pagination } from "@/components/ui/pagination";
import { CreateUserDialog } from "./users/create-user-dialog";
import { EditUserDialog } from "./users/edit-user-dialog";
import { DeleteUserDialog } from "./users/delete-user-dialog";

const PAGE_SIZE = 20;

export function UsersPanel() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<PublicUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<PublicUser | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(
    async (
      currentPage: number,
      currentSearch: string,
      cancelled: { current: boolean } = { current: false },
    ) => {
      try {
        const { data, total } = await fetchUsers({
          page: currentPage,
          pageSize: PAGE_SIZE,
          search: currentSearch || undefined,
        });
        if (cancelled.current) return;
        setUsers(data);
        setTotal(total);
      } catch {
        if (cancelled.current) return;
        toast.error("Failed to load users");
        setUsers([]);
        setTotal(0);
      } finally {
        if (!cancelled.current) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const cancelled = { current: false };
    (async () => {
      await load(page, search, cancelled);
    })();
    return () => {
      cancelled.current = true;
    };
  }, [page, search, load]);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setLoading(true);
    setSearch(value);
    setPage(1);
  }, 300);

  function goToPage(p: number) {
    setLoading(true);
    setPage(p);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search name or email..."
          onChange={(e) => debouncedSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Add user
        </Button>
      </div>

      <UsersTable
        users={users}
        loading={loading}
        onEdit={setEditUser}
        onDelete={setDeleteUser}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        totalLabel={`${total} users total`}
        loading={loading}
        onPrev={() => goToPage(Math.max(1, page - 1))}
        onNext={() => goToPage(Math.min(totalPages, page + 1))}
      />

      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => load(page, search)}
      />
      {editUser && (
        <EditUserDialog
          key={editUser.id}
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => load(page, search)}
        />
      )}
      {deleteUser && (
        <DeleteUserDialog
          key={deleteUser.id}
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onDeleted={() => load(page, search)}
        />
      )}
    </div>
  );
}
