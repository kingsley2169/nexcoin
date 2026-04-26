import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AccountWithdrawal } from "@/components/account/account-withdrawal";
import { getWithdrawalData } from "@/lib/withdrawals";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
	title: "Withdrawal | Nexcoin",
	description:
		"Request a withdrawal, manage saved wallet addresses, and track withdrawal history.",
};

export default async function AccountWithdrawalPage() {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);
	const data = await getWithdrawalData(supabase);

	return <AccountWithdrawal data={data} />;
}
