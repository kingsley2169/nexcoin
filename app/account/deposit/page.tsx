import { AccountDeposit } from "@/components/account/account-deposit";
import { depositData } from "@/lib/deposits";

export const metadata = {
	title: "Deposit Funds | Nexcoin",
	description:
		"Fund your Nexcoin account with supported crypto assets and approved payment methods.",
};

export default function DepositPage() {
	return <AccountDeposit data={depositData} />;
}
