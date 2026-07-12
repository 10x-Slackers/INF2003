"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { SubmitEvent, Suspense, useState } from "react";
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

    setPending(true);
    const result = await signIn("credentials", {
      ...parsed.data,
      redirect: false,
      redirectTo,
    });
    setPending(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

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
            <Label>Email</Label>
            <Input name="email" type="email" required />
          </div>
          <div className="grid gap-2">
            <Label>Password</Label>
            <Input name="password" type="password" required />
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
