import { AdminInvestmentPlans } from "@/components/neocoin-admin-priv/admin-investment-plans";
import { cookies } from "next/headers";
import { getAdminInvestmentPlansData } from "@/lib/admin-investment-plans";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
	title: "Investment Plan Management | Nexcoin Admin",
	description:
		"Manage plan status, deposit ranges, returns, active investors, and plan activity.",
};

export default async function AdminInvestmentPlansPage() {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);
	const data = await getAdminInvestmentPlansData(supabase);

	return <AdminInvestmentPlans data={data} />;
}
