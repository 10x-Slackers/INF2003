"use client";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import type { UserRole } from "@/lib/auth";
import { isAdmin, isAgent, isSignedIn } from "@/lib/permissions";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import { Bookmark, Bell, Plus, ShieldUser } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { useEffect, useMemo, useState } from "react";
import { getUnreadCountAction } from "@/app/alerts/actions";

type NavLink = {
  href: string;
  label: string;
};

const links: NavLink[] = [
  { href: ROUTES.PROPERTIES, label: "Properties" },
  { href: ROUTES.TRANSACTIONS, label: "Transactions" },
];

type ActionLink = {
  href: string;
  label: string;
  canView: (role?: UserRole) => boolean;
  icon: React.ComponentType<{ className?: string }>;
};

const actionLinks: ActionLink[] = [
  {
    href: ROUTES.BOOKMARKS,
    label: "Bookmarks",
    canView: isSignedIn,
    icon: Bookmark,
  },
  { href: ROUTES.ALERTS, label: "Alerts", canView: isSignedIn, icon: Bell },
  { href: ROUTES.ADMIN, label: "Admin", canView: isAdmin, icon: ShieldUser },
];

type CreateLink = {
  href: string;
  label: string;
  canView: (role?: UserRole) => boolean;
};

const createLinks: CreateLink[] = [
  { href: ROUTES.PROPERTIES_NEW, label: "New property", canView: isAgent },
  {
    href: ROUTES.TRANSACTIONS_NEW,
    label: "New transaction",
    canView: isAgent,
  },
  { href: ROUTES.ALERT_NEW, label: "New alert", canView: isSignedIn },
];

export function Navbar() {
  const { data: session } = useSession();
  const role = session?.user.role;
  const [unreadCount, setUnreadCount] = useState(0);
  const visibleActions = useMemo(
    () => actionLinks.filter((link) => link.canView(role)),
    [role],
  );
  const visibleCreate = useMemo(
    () => createLinks.filter((link) => link.canView(role)),
    [role],
  );

  useEffect(() => {
    if (!session?.user) return;
    getUnreadCountAction()
      .then(setUnreadCount)
      .catch(() => {});
  }, [session?.user]);

  return (
    <div className="container mx-auto flex h-16 items-center px-4">
      <div className="flex flex-1 items-center">
        <Link href={ROUTES.HOME} className="text-lg font-semibold">
          HDB Trackr
        </Link>
      </div>

      <nav className="hidden items-center gap-1 md:flex">
        {links.map((link) => (
          <Button key={link.href} asChild variant="ghost">
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}
      </nav>

      <div className="flex flex-1 items-center justify-end gap-2">
        {session?.user ? (
          <>
            {visibleActions.map(({ href, label, icon: Icon }) => (
              <Button key={href} asChild variant="ghost" size="icon">
                <Link href={href} aria-label={label} className="relative">
                  <Icon className="size-5" />
                  {label === "Alerts" && unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              </Button>
            ))}
            {visibleCreate.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Create">
                    <Plus className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {visibleCreate.map(({ href, label }) => (
                    <DropdownMenuItem key={href} asChild>
                      <Link href={href}>{label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  {session.user.name ?? "Profile"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.PROFILE}>Edit profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => signOut({ redirectTo: ROUTES.HOME })}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
