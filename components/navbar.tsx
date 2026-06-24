"use client";
import Link from "next/link";
import { LogoutButton } from "./logout-button";
import { useSession } from "next-auth/react";


export function Navbar() {
    const links = [
        { href: "/", label: "Home" },
        { href: "/login", label: "Login" },
    ]
    const { data: session, status } = useSession();

    return (
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link href="/" className="text-lg font-semibold">
                HDB Trackr
            </Link>

            <nav className="hidden items-center gap-6 md:flex">
                {status === "loading" ? (
                    <span>Loading...</span>
                ) : session?.user ? (
                    <div>
                        <span className="text-sm font-medium text-muted-foreground">
                            {session.user.name}
                        </span>
                        <LogoutButton />
                    </div>
                ) : (
                    links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {link.label}
                        </Link>
                    ))
                )}
            </nav>
        </div>
    );
}
