"use client";

import { FormEvent, useState } from "react";
import { ConfirmationModal } from "@/components/forms/confirmation-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserRole } from "@/lib/auth";

export function ProfileForm({
  initialName,
  initialEmail,
  role,
}: {
  initialName?: string | null;
  initialEmail?: string | null;
  role: UserRole;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [savedName, setSavedName] = useState(initialName ?? "");
  const [savedEmail, setSavedEmail] = useState(initialEmail ?? "");
  const [message, setMessage] = useState("");
  const [pendingProfile, setPendingProfile] = useState<{
    name: string;
    email: string;
  } | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingProfile({ name, email });
  }

  function confirmProfile() {
    if (!pendingProfile) return;

    setSavedName(pendingProfile.name);
    setSavedEmail(pendingProfile.email);
    setMessage("Profile updated for this session.");
    setPendingProfile(null);
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Placeholder account details.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Name</p>
            <p>{savedName || "No name set"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p>{savedEmail || "No email set"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Role</p>
            <Badge variant="outline">{role}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit profile</CardTitle>
          <CardDescription>
            Changes stay in local placeholder state.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
            <div>
              <Button type="submit">Save profile</Button>
            </div>
          </form>
          <ConfirmationModal
            open={Boolean(pendingProfile)}
            title="Save profile?"
            description="Confirm the placeholder profile details."
            confirmLabel="Save profile"
            items={[
              { label: "Name", value: pendingProfile?.name ?? "" },
              { label: "Email", value: pendingProfile?.email ?? "" },
              { label: "Role", value: role },
            ]}
            onCancel={() => setPendingProfile(null)}
            onConfirm={confirmProfile}
          />
        </CardContent>
      </Card>
    </div>
  );
}
