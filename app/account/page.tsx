import { DashboardOverview } from "@/components/account/dashboard-overview";

export default async function AccountPage() {
	const dashboardData = {
		activePlans: [
			{
				amount: "$5,000.00",
				expectedReturn: "$750.00",
				maturityDate: "Apr 24, 2026",
				name: "Advanced Plan",
				progress: 62,
				startDate: "Apr 12, 2026",
				status: "Active",
			},
			{
				amount: "$1,250.00",
				expectedReturn: "$125.00",
				maturityDate: "Apr 22, 2026",
				name: "Amateur Plan",
				progress: 88,
				startDate: "Apr 19, 2026",
				status: "Near completion",
			},
		],
		metrics: [
			{ label: "Total Balance", value: "$24,850.00" },
			{ label: "Active Investment", value: "$18,000.00" },
			{ label: "Total Profit", value: "$6,850.00" },
			{ label: "Pending Withdrawal", value: "$1,200.00" },
			{ label: "Available Balance", value: "$6,850.00" },
			{ label: "Referral Earnings", value: "$250.00" },
		],
		portfolioSnapshot: [
			{ label: "Portfolio Growth", value: "+18.6%" },
			{ label: "Current Plan", value: "Advanced Plan" },
			{ label: "Next Payout", value: "Apr 24, 2026" },
			{ label: "Verification", value: "Verified" },
			{ label: "Risk Level", value: "Balanced" },
			{ label: "Plan Category", value: "VIP" },
		],
		recentActivity: [
			{
				amount: "$5,000.00",
				date: "Apr 20, 2026",
				label: "Advanced Plan activated",
				status: "Active",
				type: "Investment Started",
			},
			{
				amount: "$1,200.00",
				date: "Apr 20, 2026",
				label: "Withdrawal request",
				status: "Pending",
				type: "Withdrawal",
			},
			{
				amount: "$250.00",
				date: "Apr 19, 2026",
				label: "Referral commission",
				status: "Credited",
				type: "Referral Bonus",
			},
			{
				amount: "$2,500.00",
				date: "Apr 18, 2026",
				label: "Bitcoin deposit",
				status: "Confirmed",
				type: "Deposit",
			},
			{
				amount: "$480.00",
				date: "Apr 17, 2026",
				label: "Advanced Plan profit",
				status: "Credited",
				type: "Profit Credited",
			},
		],
		user: {
			email: "alex.morgan@example.com",
			name: "Alex Morgan",
		},
	};

	return <DashboardOverview data={dashboardData} />;
}
