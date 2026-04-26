import { cookies } from "next/headers";
import { DashboardOverview } from "@/components/account/dashboard-overview";
import { getAccountDashboardData } from "@/lib/account-dashboard";
import { createClient } from "@/utils/supabase/server";

export default async function AccountPage() {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) {
		throw new Error("Unable to load the signed-in account.");
	}

	const dashboardData = await getAccountDashboardData(supabase, user);

	return <DashboardOverview data={dashboardData} />;
}
