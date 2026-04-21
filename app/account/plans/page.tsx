import { AccountPlans } from "@/components/account/account-plans";

export default async function AccountPlansPage() {
	const accountSummary = {
		activeInvestment: 18000,
		activePlans: 2,
		availableBalance: 6850,
		estimatedMonthlyReturn: 2420,
	};

	const plans = [
		{
			availability: "Open",
			bestFor: "New investors",
			durationDays: 1,
			id: "beginner",
			maxInvestment: 999,
			minInvestment: 100,
			name: "Beginner",
			payoutSchedule: "At maturity",
			rate: 8,
			tag: "Starter",
		},
		{
			availability: "Open",
			bestFor: "Bonus package access",
			durationDays: 1,
			id: "amateur",
			maxInvestment: 4999,
			minInvestment: 1000,
			name: "Amateur",
			payoutSchedule: "At maturity",
			rate: 10,
			tag: "Bonus access",
		},
		{
			availability: "Popular",
			bestFor: "Growing portfolios",
			durationDays: 2,
			id: "advanced",
			maxInvestment: 19999,
			minInvestment: 5000,
			name: "Advanced",
			payoutSchedule: "At maturity",
			rate: 15,
			tag: "Most balanced",
		},
		{
			availability: "Open",
			bestFor: "Experienced investors",
			durationDays: 3,
			id: "pro",
			maxInvestment: null,
			minInvestment: 20000,
			name: "Pro",
			payoutSchedule: "At maturity",
			rate: 20,
			tag: "Premium",
		},
	];

	const activePlans = [
		{
			amount: 5000,
			maturityDate: "Apr 24, 2026",
			name: "Advanced",
			progress: 62,
			status: "Active",
		},
		{
			amount: 1250,
			maturityDate: "Apr 22, 2026",
			name: "Amateur",
			progress: 88,
			status: "Near completion",
		},
	];

	return (
		<AccountPlans
			accountSummary={accountSummary}
			activePlans={activePlans}
			plans={plans}
		/>
	);
}
