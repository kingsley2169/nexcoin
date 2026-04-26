import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AccountReferrals } from "@/components/account/account-referrals";
import { getReferralProgramData } from "@/lib/referrals";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
	title: "Referrals | Nexcoin",
	description:
		"Share your referral link, track referred users, and view your tier progress and commission history.",
};

export default async function AccountReferralsPage() {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);
	const data = await getReferralProgramData(supabase);

	return <AccountReferrals data={data} />;
}
