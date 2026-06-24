"use client";
import { cn } from "@/lib/utils";
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
import Link from "next/link";
import { useCallback, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import {
  fieldError,
  actionSuccess,
  actionError,
  type ActionState,
} from "@/lib/action-helpers";

const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFields = z.infer<typeof loginSchema>;

const defaultFormState: ActionState<LoginFields> = {
  fields: {
    email: "",
    password: "",
  },
  fieldErrors: {},
  formError: undefined,
  success: false,
};

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [state, setState] = useState(defaultFormState);
  const [pending, setPending] = useState(false);
  const handleSubmit = useCallback(
    async (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (pending) return;
      const formData = new FormData(e.currentTarget);
      const values = {
        email: String(formData.get("email") || ""),
        password: String(formData.get("password") || ""),
      };
      const parsed = loginSchema.safeParse(values);
      if (!parsed.success) {
        const errors = z.flattenError(parsed.error);
        setState(
          fieldError<LoginFields>(errors.fieldErrors, {
            email: values.email,
          }),
        );

        return;
      }

      setPending(true);

      try {
        const result = await signIn("credentials", {
          redirect: false,
          email: values.email,
          password: values.password,
          callbackUrl,
        });

        if (result?.error) {
          setState(
            actionError<LoginFields>(result.error, {
              email: values.email,
            }),
          );

          return;
        }
        setState(
          actionSuccess<LoginFields>({
            email: values.email,
          }),
        );
        router.push(callbackUrl);
      } catch {
        setState(
          actionError<LoginFields>("An unexpected error occurred", {
            email: values.email,
          }),
        );
        return;
      } finally {
        setPending(false);
      }
    },
    [pending, callbackUrl, router],
  );

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                {state.formError && (
                  <div className="text-red-500 text-sm">{state.formError}</div>
                )}
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={state.fields?.email}
                  disabled={pending}
                  required
                />
                {state.fieldErrors?.email?.map((error) => (
                  <p key={error} className="text-sm text-destructive">
                    {error}
                  </p>
                ))}
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  defaultValue={state.fields?.password}
                  disabled={pending}
                  required
                />
                {state.fieldErrors?.password?.map((error) => (
                  <p key={error} className="text-sm text-destructive">
                    {error}
                  </p>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Signing in..." : "Sign in"}
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="underline underline-offset-4">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
