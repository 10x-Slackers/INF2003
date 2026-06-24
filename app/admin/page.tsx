"use server"
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { loginRedirect, ROUTES } from "@/lib/routes";

export default async function AdminPage() {
    const user = await getCurrentUser();
    if (!user) {
        redirect(loginRedirect(ROUTES.ADMIN));
    }

    if (user.role !== "ADMIN") {
        redirect(ROUTES.HOME);
    }

    return (
        <main>
            <h1>Admin Page</h1>
            <p>Welcome, {user.name}!</p>
        </main>
    )
}
