import type { Metadata } from "next";
import { AccountTransactions } from "@/components/account/account-transactions";
import { mockTransactions } from "@/lib/transactions";

export const metadata: Metadata = {
	title: "Transactions | Nexcoin",
	description:
		"Filter, search, and export every deposit, withdrawal, investment, profit, fee, and referral credit on your account.",
};

export default function AccountTransactionsPage() {
	return <AccountTransactions data={mockTransactions} />;
}
