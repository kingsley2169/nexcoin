import { cookies } from "next/headers";
import { AdminWithdrawalsManagement } from "@/components/neocoin-admin-priv/admin-withdrawals-management";
import { getAdminWithdrawalsManagementData } from "@/lib/admin-withdrawals-management";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
	title: "Withdrawals Management | Nexcoin Admin",
	description:
		"Review withdrawal requests, AML checks, payout status, and destination wallet risk.",
};

export default async function AdminWithdrawalsManagementPage() {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);
	const data = await getAdminWithdrawalsManagementData(supabase);

	return <AdminWithdrawalsManagement data={data} />;
}
