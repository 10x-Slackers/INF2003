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


export function SignUpForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [state, formAction, pending] = useActionState(signUpEmail, {
        error: "",
        fields: {
            email: "",
            password: "",
            name: "",
        },
    });
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
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="John Doe"
                                    required
                                    defaultValue={state.fields.name}
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    defaultValue={state.fields.email}
                                />
                            </div>
                            <div className="grid gap-3">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    minLength={8}
                                    defaultValue={state.fields.password}
                                />
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button type="submit" className="w-full" disabled={pending}>
                                    Sign up
                                </Button>
                            </div>
                        </div>
                        {state.error && (
                            <div className="text-red-500 text-sm">{state.error}</div>
                        )}

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
