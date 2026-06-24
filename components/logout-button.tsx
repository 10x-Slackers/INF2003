"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { ROUTES } from "@/lib/routes";

export function LogoutButton() {
    return (
        <Button variant="outline" onClick={() => signOut({ callbackUrl: ROUTES.HOME })}>
            Logout
        </Button>
    );
}
