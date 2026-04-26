import { cookies } from "next/headers";
import { AdminTransactions } from "@/components/neocoin-admin-priv/admin-transactions";
import { getAdminTransactionsData } from "@/lib/admin-transactions";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
	title: "Transaction Management | Nexcoin Admin",
	description:
		"Inspect deposits, withdrawals, investments, profits, fees, referrals, and manual adjustments across the platform ledger.",
};

export default async function AdminTransactionsPage() {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);
	const data = await getAdminTransactionsData(supabase);

	return <AdminTransactions data={data} />;
}
