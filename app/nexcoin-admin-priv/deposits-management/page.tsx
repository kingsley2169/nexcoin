import { cookies } from "next/headers";
import { AdminDepositsManagement } from "@/components/neocoin-admin-priv/admin-deposits-management";
import { getAdminDepositsManagementData } from "@/lib/admin-deposits-management";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
	title: "Deposits Management | Nexcoin Admin",
	description:
		"Review incoming crypto deposits, confirmations, receiving wallets, risk notes, and funding activity.",
};

export default async function AdminDepositsManagementPage() {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);
	const data = await getAdminDepositsManagementData(supabase);

	return <AdminDepositsManagement data={data} />;
}
