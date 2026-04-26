import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/account/account-shell";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
	title: "Account Dashboard | Nexcoin",
	description: "Manage your Nexcoin portfolio, plans, deposits, and withdrawals.",
};

export default async function AccountLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/auth/login?error=Sign in to access your account dashboard.");
	}

	const accountName =
		typeof user.user_metadata?.full_name === "string"
			? user.user_metadata.full_name
			: user.email ?? "Account";

	return (
		<AccountShell accountEmail={user.email ?? ""} accountName={accountName}>
			{children}
		</AccountShell>
	);
}
