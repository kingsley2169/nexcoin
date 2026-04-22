import { AdminShell } from "@/components/neocoin-admin-priv/admin-shell";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Admin Dashboard | Nexcoin",
    description: "Admin dashboard for managing users, plans, and transactions.",
}
export default function AdminDashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <AdminShell>{children}</AdminShell>;
}
