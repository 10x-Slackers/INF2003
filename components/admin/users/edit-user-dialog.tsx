"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateUserAction } from "@/app/admin/actions";
import type { PublicUser, UserRole } from "@/lib/tables/users";
import { UserFormFields } from "./user-form-fields";

export function EditUserDialog({
  user,
  onClose,
  onSaved,
}: {
  user: PublicUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [role, setRole] = useState<UserRole>(user.role);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    setPending(true);
    try {
      await updateUserAction({
        id: user.id,
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        role,
      });
      onSaved();
      onClose();
    } catch {
      setError("Failed to update user.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>Update account details.</DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <UserFormFields
            defaultName={user.name}
            defaultEmail={user.email}
            role={role}
            onRoleChange={setRole}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
