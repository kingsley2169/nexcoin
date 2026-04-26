import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AccountTransactions } from "@/components/account/account-transactions";
import { getTransactions } from "@/lib/transactions";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
	title: "Transactions | Nexcoin",
	description:
		"Filter, search, and export every deposit, withdrawal, investment, profit, fee, and referral credit on your account.",
};

export default async function AccountTransactionsPage() {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);
	const data = await getTransactions(supabase);

	return <AccountTransactions data={data} />;
}
