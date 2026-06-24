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
import { useCallback, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { ROUTES } from "@/lib/routes";
import { useRouter, useSearchParams } from "next/navigation";

type LoginFields = {
    email: string;
    password: string;
};

type ActionState<T> = {
    error: string;
    fields?: Partial<T>;
}

const initialState: ActionState<LoginFields> = {
    error: "",
    fields: {
        email: "",
        password: "",
    },
};


export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const callbackUrl = searchParams.get("callbackUrl") || ROUTES.HOME;

    const [state, setState] = useState<ActionState<LoginFields>>(initialState);
    const [pending, startTransition] = useTransition();
    const handleSubmit = useCallback(async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = String(formData.get("email") || "");
        const password = String(formData.get("password") || "");

        startTransition(async () => {
            if (!email || !password) {
                setState({
                    error: "Email and password are required",
                    fields: {
                        email,
                        password,
                    },
                });
                return;
            }
            try {
                const result = await signIn("credentials", {
                    redirect: false,
                    email,
                    password,
                });

                if (result?.error) {
                    setState({
                        error: "Invalid email or password",
                        fields: {
                            email,
                        },
                    });
                    return;
                }
                router.push(callbackUrl);
            } catch {
                setState({
                    error: "An unexpected error occurred. Please try again.",
                    fields: {
                        email,
                    },
                });
                return;
            }
        })
    }, [router, callbackUrl]);

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
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    defaultValue={state.fields?.email}
                                    required
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    defaultValue={state.fields?.password}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button type="submit" className="w-full" disabled={pending}>
                                    Sign in
                                </Button>
                            </div>
                        </div>
                        {state.error && (
                            <div className="text-red-500 text-sm">{state.error}</div>
                        )}
                        <div className="mt-4 text-center text-sm">
                            Don&apos;t have an account?{" "}
                            <Link href={ROUTES.SIGNUP} className="underline underline-offset-4">
                                Sign up
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
