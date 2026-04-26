import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AccountWallets } from "@/components/account/account-wallets";
import { getWalletsData } from "@/lib/wallets";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
	title: "Wallets | Nexcoin",
	description:
		"Save, review, and manage your own withdrawal wallets for faster payouts.",
};

export default async function WalletsPage() {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/auth/login?error=Sign in to access your account dashboard.");
	}

	const data = await getWalletsData(supabase, user.id);

	return <AccountWallets data={data} />;
}
