import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/components/auth-provider";
import { auth } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "HDB Trackr",
  description:
    "A web application for tracking HDB resale prices and analytics.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en" className={cn("h-full", "antialiased", inter.variable)}>
      <body className="min-h-full flex flex-col">
        <AuthProvider session={session}>
          <Navbar />
          <div className="flex-1">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
