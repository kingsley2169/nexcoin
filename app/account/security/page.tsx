import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AccountSecurity } from "@/components/account/account-security";
import { getSecurityData } from "@/lib/security";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
	title: "Security Settings | Nexcoin",
	description:
		"Manage password access, two-factor authentication, trusted devices, and withdrawal protection.",
};

export default async function AccountSecurityPage() {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);
	const securityData = await getSecurityData(supabase);

	return <AccountSecurity data={securityData} />;
}
