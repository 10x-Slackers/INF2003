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
import { signUpEmail } from "./action";
import { useActionState } from "react";
import { ROUTES } from "@/lib/routes";
import { ActionState } from "@/lib/action-helpers";


type SignUpFields = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
};

const defaultState: ActionState<SignUpFields> = {
    fields: {
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    },
    fieldErrors: {},
    formError: undefined,
    success: false,
};

export function SignUpForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [state, formAction, pending] = useActionState(signUpEmail, defaultState);
    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>Sign up for an account</CardTitle>
                    <CardDescription>
                        Enter your email below to sign up for an account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction}>
                        {state.formError && (
                            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {state.formError}
                            </div>
                        )}
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    defaultValue={state.fields?.name}
                                    disabled={pending}
                                />
                                {state.fieldErrors?.name?.map((error) => (
                                    <p key={error} className="text-sm text-destructive">
                                        {error}
                                    </p>
                                ))}
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    defaultValue={state.fields?.email}
                                    disabled={pending}
                                />
                                {state.fieldErrors?.email?.map((error) => (
                                    <p key={error} className="text-sm text-destructive">
                                        {error}
                                    </p>
                                ))}
                            </div>
                            <div className="grid gap-3">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    defaultValue={state.fields?.password}
                                    disabled={pending}
                                />
                                {state.fieldErrors?.password?.map((error) => (
                                    <p key={error} className="text-sm text-destructive">
                                        {error}
                                    </p>
                                ))}
                            </div>
                            <div className="grid gap-3">
                                <div className="flex items-center">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                </div>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    defaultValue={state.fields?.confirmPassword}
                                    disabled={pending}
                                />
                                {state.fieldErrors?.confirmPassword?.map((error) => (
                                    <p key={error} className="text-sm text-destructive">
                                        {error}
                                    </p>
                                ))}
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button type="submit" className="w-full" disabled={pending}>
                                    {pending ? "Signing up..." : "Sign up"}
                                </Button>
                            </div>
                        </div>

                        <div className="mt-4 text-center text-sm">
                            Already have an account?{" "}
                            <Link href={ROUTES.LOGIN} className="underline underline-offset-4">
                                Login
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
