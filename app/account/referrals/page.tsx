import type { Metadata } from "next";
import { AccountReferrals } from "@/components/account/account-referrals";
import { referralProgram } from "@/lib/referrals";

export const metadata: Metadata = {
	title: "Referrals | Nexcoin",
	description:
		"Share your referral link, track referred users, and view your tier progress and commission history.",
};

export default function AccountReferralsPage() {
	return <AccountReferrals data={referralProgram} />;
}
