"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { SubmitEvent, Suspense, useState } from "react";
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
import { loginSchema } from "@/lib/auth/schemas";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [pendingLogin, setPendingLogin] = useState<{
    email: string;
    password: string;
  } | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const values = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };
    const parsed = loginSchema.safeParse(values);

    if (!parsed.success) {
      setError("Enter a valid email and password.");
      return;
    }

    setPendingLogin(parsed.data);
  }

  async function confirmLogin() {
    if (!pendingLogin) return;

    setPending(true);
    const result = await signIn("credentials", {
      ...pendingLogin,
      redirect: false,
      redirectTo,
    });
    setPending(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    setPendingLogin(null);
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your account details.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Logging in..." : "Login"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link
              className="text-primary underline-offset-4 hover:underline"
              href="/signup"
            >
              Sign up
            </Link>
          </p>
        </form>
        <ConfirmationModal
          open={Boolean(pendingLogin)}
          title="Confirm login"
          description="Review the account before signing in."
          confirmLabel="Login"
          pending={pending}
          items={[
            { label: "Email", value: pendingLogin?.email ?? "" },
            { label: "Redirect", value: redirectTo },
          ]}
          onCancel={() => setPendingLogin(null)}
          onConfirm={confirmLogin}
        />
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
