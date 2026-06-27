"use client";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import type { UserRole } from "@/lib/auth";
import { isAdmin, isSignedIn } from "@/lib/permissions";
import { Button } from "./ui/button";
import { ROUTES } from "@/lib/routes";
import { useMemo } from "react";

type NavLink = {
  href: string;
  label: string;
  canView: (role?: UserRole) => boolean;
};

const links: NavLink[] = [
  { href: ROUTES.HOME, label: "Home", canView: () => true },
  { href: ROUTES.PROPERTIES, label: "Properties", canView: () => true },
  { href: ROUTES.TRANSACTIONS, label: "Transactions", canView: () => true },
  { href: ROUTES.BOOKMARKS, label: "Bookmarks", canView: isSignedIn },
  { href: ROUTES.ALERTS, label: "Alerts", canView: isSignedIn },
  { href: ROUTES.ADMIN, label: "Admin", canView: isAdmin },
];

export function Navbar() {
  const { data: session, status } = useSession();
  const role = session?.user.role;
  const visibleLinks = useMemo(() => links.filter((link) => link.canView(role)), [role]);

  return (
    <div className="container mx-auto flex h-16 items-center px-4">
      <div className="flex flex-1 items-center">
        <Link href={ROUTES.HOME} className="text-lg font-semibold">
          HDB Trackr
        </Link>
      </div>

      <nav className="hidden items-center gap-1 md:flex">
        {visibleLinks.map((link) => {
          return (
            <Button key={link.href} asChild variant="ghost">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          );
        })}
      </nav>

      <div className="flex flex-1 items-center justify-end gap-2">
        {status === "loading" ? (
          <span className="text-sm text-muted-foreground">Loading...</span>
        ) : session?.user ? (
          <>
            <Link href={ROUTES.PROFILE}>{session.user.name ?? "Profile"}</Link>
            <Button
              variant="ghost"
              onClick={() => signOut({ redirectTo: ROUTES.HOME })}
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button asChild variant="ghost">
              <Link href={ROUTES.LOGIN}>Login</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href={ROUTES.SIGNUP}>Signup</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
