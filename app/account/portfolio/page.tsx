import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AccountPortfolio } from "@/components/account/account-portfolio";
import { getPortfolioData } from "@/lib/portfolio";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
	title: "Portfolio | Nexcoin",
	description:
		"Track portfolio value, plan performance, crypto holdings, and profit history.",
};

export default async function AccountPortfolioPage() {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);
	const data = await getPortfolioData(supabase);

	return <AccountPortfolio data={data} />;
}
