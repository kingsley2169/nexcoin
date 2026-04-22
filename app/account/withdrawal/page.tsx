import type { Metadata } from "next";
import { AccountWithdrawal } from "@/components/account/account-withdrawal";
import { withdrawalData } from "@/lib/withdrawals";

export const metadata: Metadata = {
	title: "Withdrawal | Nexcoin",
	description:
		"Request a withdrawal, manage saved wallet addresses, and track withdrawal history.",
};

export default function AccountWithdrawalPage() {
	return <AccountWithdrawal data={withdrawalData} />;
}
