"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SubmitEvent, useState } from "react";
import { ConfirmationModal } from "@/components/forms/confirmation-modal";
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
import { signupSchema } from "@/lib/auth/schemas";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [pendingSignup, setPendingSignup] = useState<{
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  } | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const values = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    };
    const parsed = signupSchema.safeParse(values);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details.");
      return;
    }

    setPendingSignup(parsed.data);
  }

  async function confirmSignup() {
    if (!pendingSignup) return;

    setPending(true);
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pendingSignup),
    });
    setPending(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Sign up failed.");
      return;
    }

    setPendingSignup(null);
    router.push("/login");
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign up</CardTitle>
          <CardDescription>Create a basic account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Signing up..." : "Sign up"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                className="text-primary underline-offset-4 hover:underline"
                href="/login"
              >
                Login
              </Link>
            </p>
          </form>
          <ConfirmationModal
            open={Boolean(pendingSignup)}
            title="Confirm sign up"
            description="Review the account details before creating the account."
            confirmLabel="Create account"
            pending={pending}
            items={[
              { label: "Name", value: pendingSignup?.name ?? "" },
              { label: "Email", value: pendingSignup?.email ?? "" },
              { label: "Password", value: pendingSignup ? "Provided" : "" },
            ]}
            onCancel={() => setPendingSignup(null)}
            onConfirm={confirmSignup}
          />
        </CardContent>
      </Card>
    </main>
  );
}
