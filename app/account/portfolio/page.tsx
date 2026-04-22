import type { Metadata } from "next";
import { AccountPortfolio } from "@/components/account/account-portfolio";
import { portfolioData } from "@/lib/portfolio";

export const metadata: Metadata = {
	title: "Portfolio | Nexcoin",
	description:
		"Track portfolio value, plan performance, crypto holdings, and profit history.",
};

export default function AccountPortfolioPage() {
	return <AccountPortfolio data={portfolioData} />;
}
