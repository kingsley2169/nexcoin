export type AdminPlanStatus = "Active" | "Draft" | "Paused";

export type AdminPlanRisk = "Balanced" | "Conservative" | "High";

export type AdminInvestmentPlan = {
	activeInvestors: number;
	description: string;
	durationHours: number;
	id: string;
	maxDepositUsd: number | null;
	minDepositUsd: number;
	name: string;
	profitCreditedUsd: number;
	returnRatePercent: number;
	risk: AdminPlanRisk;
	status: AdminPlanStatus;
	totalInvestedUsd: number;
	updatedAt: string;
};

export type AdminPlanActivity = {
	createdAt: string;
	id: string;
	planName: string;
	status: AdminPlanStatus;
	title: string;
};

export type AdminInvestmentPlansData = {
	activity: AdminPlanActivity[];
	plans: AdminInvestmentPlan[];
	summary: {
		activePlans: number;
		maturingToday: number;
		totalInvestedUsd: number;
		totalProfitCreditedUsd: number;
	};
};

export const adminInvestmentPlansData: AdminInvestmentPlansData = {
	summary: {
		activePlans: 3,
		maturingToday: 37,
		totalInvestedUsd: 4800000,
		totalProfitCreditedUsd: 42180,
	},
	plans: [
		{
			activeInvestors: 412,
			description: "Starter access for smaller deposits and first-cycle investors.",
			durationHours: 24,
			id: "plan-beginner",
			maxDepositUsd: 999,
			minDepositUsd: 100,
			name: "Beginner",
			profitCreditedUsd: 6840,
			returnRatePercent: 8,
			risk: "Conservative",
			status: "Active",
			totalInvestedUsd: 280000,
			updatedAt: "2026-04-18T10:12:00Z",
		},
		{
			activeInvestors: 536,
			description: "Short-cycle plan with bonus eligibility and referral access.",
			durationHours: 24,
			id: "plan-amateur",
			maxDepositUsd: 4999,
			minDepositUsd: 1000,
			name: "Amateur",
			profitCreditedUsd: 11120,
			returnRatePercent: 10,
			risk: "Balanced",
			status: "Active",
			totalInvestedUsd: 1240000,
			updatedAt: "2026-04-19T14:45:00Z",
		},
		{
			activeInvestors: 247,
			description: "Priority plan for larger commitments and stronger projected returns.",
			durationHours: 48,
			id: "plan-advanced",
			maxDepositUsd: 19999,
			minDepositUsd: 5000,
			name: "Advanced",
			profitCreditedUsd: 18100,
			returnRatePercent: 15,
			risk: "Balanced",
			status: "Active",
			totalInvestedUsd: 2180000,
			updatedAt: "2026-04-21T09:22:00Z",
		},
		{
			activeInvestors: 45,
			description: "Premium plan for experienced users and highest package rate.",
			durationHours: 72,
			id: "plan-pro",
			maxDepositUsd: null,
			minDepositUsd: 20000,
			name: "Pro",
			profitCreditedUsd: 6120,
			returnRatePercent: 20,
			risk: "High",
			status: "Paused",
			totalInvestedUsd: 1100000,
			updatedAt: "2026-04-20T16:08:00Z",
		},
	],
	activity: [
		{
			createdAt: "2026-04-22T09:30:00Z",
			id: "plan-activity-1",
			planName: "Advanced",
			status: "Active",
			title: "Return rate reviewed by admin",
		},
		{
			createdAt: "2026-04-21T18:10:00Z",
			id: "plan-activity-2",
			planName: "Pro",
			status: "Paused",
			title: "New subscriptions paused",
		},
		{
			createdAt: "2026-04-20T11:44:00Z",
			id: "plan-activity-3",
			planName: "Amateur",
			status: "Active",
			title: "Deposit range confirmed",
		},
	],
};
