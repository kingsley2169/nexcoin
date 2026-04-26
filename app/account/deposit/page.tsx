import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AccountDeposit } from "@/components/account/account-deposit";
import { getDepositData } from "@/lib/deposits";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
	title: "Deposit Funds | Nexcoin",
	description: "Fund your Nexcoin account with supported crypto assets.",
};

export default async function DepositPage() {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/auth/login?error=Sign in to access your account dashboard.");
	}

	const data = await getDepositData(supabase, user.id);

	return <AccountDeposit data={data} />;
}
