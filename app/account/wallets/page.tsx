import { AccountWallets } from "@/components/account/account-wallets";
import { walletsData } from "@/lib/wallets";

export const metadata = {
	title: "Wallets | Nexcoin",
	description:
		"View supported wallet balances, deposit addresses, confirmations, and recent wallet activity.",
};

export default function WalletsPage() {
	return <AccountWallets data={walletsData} />;
}
