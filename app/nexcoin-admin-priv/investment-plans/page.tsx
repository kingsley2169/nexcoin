import { AdminInvestmentPlans } from "@/components/neocoin-admin-priv/admin-investment-plans";
import { adminInvestmentPlansData } from "@/lib/admin-investment-plans";

export const metadata = {
	title: "Investment Plan Management | Nexcoin Admin",
	description:
		"Manage plan status, deposit ranges, returns, active investors, and plan activity.",
};

export default function AdminInvestmentPlansPage() {
	return <AdminInvestmentPlans data={adminInvestmentPlansData} />;
}
