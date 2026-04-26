import { cookies } from "next/headers";
import { AccountPlans } from "@/components/account/account-plans";
import { getAccountPlansData } from "@/lib/account-plans";
import { createClient } from "@/utils/supabase/server";

export default async function AccountPlansPage() {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);
	const data = await getAccountPlansData(supabase);

	return (
		<AccountPlans
			accountSummary={data.accountSummary}
			activePlans={data.activePlans}
			plans={data.plans}
		/>
	);
}
