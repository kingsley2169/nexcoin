import type { Metadata } from "next";
import { AccountShell } from "@/components/account/account-shell";

export const metadata: Metadata = {
	title: "Account Dashboard | Nexcoin",
	description: "Manage your Nexcoin portfolio, plans, deposits, and withdrawals.",
};

export default function AccountLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <AccountShell>{children}</AccountShell>;
}
