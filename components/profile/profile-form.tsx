"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { SubmitEvent, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/app/profile/actions";
import { ROUTES } from "@/lib/routes";
import type { PublicUser } from "@/lib/tables/users";

const schema = z
  .object({
    name: z.string().trim().min(1).max(255),
    email: z.email().trim().toLowerCase().max(320),
    newPassword: z.string().min(8).optional().or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
    currentPassword: z.string().min(1, "Enter your current password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export function ProfileForm({ user }: { user: PublicUser }) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const values = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
      currentPassword: String(formData.get("currentPassword") ?? ""),
    };

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ??
          "Please fill in all fields correctly.",
      );
      return;
    }

    setPending(true);
    try {
      await updateProfileAction({
        name: parsed.data.name,
        email: parsed.data.email,
        newPassword: parsed.data.newPassword || undefined,
        currentPassword: parsed.data.currentPassword,
      });
      await updateSession();
      toast.success("Profile updated");
      setTimeout(() => router.push(ROUTES.HOME), 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update profile.",
      );
      setPending(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={user.name} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword">New password (optional)</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="Leave blank to keep current"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter new password"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
