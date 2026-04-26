import type { SupabaseClient } from "@supabase/supabase-js";

export type InvestmentPlan = {
	description: string;
	duration: string;
	features: string[];
	highlight: boolean;
	name: string;
	price: string;
	returnRate: string;
	tag: string;
};

export type PublicInvestmentPlan = {
	id: string;
	name: string;
	tag: string;
	minDepositUsd: number;
	maxDepositUsd: number | null;
	returnRatePercent: number;
	durationHours: number;
	description: string;
	features: string[];
	highlight: boolean;
};

// Legacy static plans for fallback
export const investmentPlans: InvestmentPlan[] = [
	{
		description:
			"A starting point for new users who want to understand the platform with a smaller commitment.",
		duration: "24 hours",
		features: [
			"Starter plan access",
			"Limited reinvestment",
			"Standard withdrawal review",
			"Basic portfolio tracking",
		],
		highlight: false,
		name: "Beginner",
		price: "$100 - $999",
		returnRate: "8%",
		tag: "Starter",
	},
	{
		description:
			"A short-cycle plan for investors exploring bonus package eligibility and active crypto opportunities.",
		duration: "24 hours",
		features: [
			"Up to 3 investments",
			"Bonus package eligibility",
			"Referral commission access",
			"Trading activity visibility",
		],
		highlight: false,
		name: "Amateur",
		price: "$1,000 - $4,999",
		returnRate: "10%",
		tag: "Bonus access",
	},
	{
		description:
			"A VIP-style plan for users who want more flexibility, broader offers, and stronger projected returns.",
		duration: "48 hours",
		features: [
			"No standard reinvestment limit",
			"Higher referral commission access",
			"Priority plan offers",
			"Expanded portfolio tracking",
		],
		highlight: true,
		name: "Advanced",
		price: "$5,000 - $19,999",
		returnRate: "15%",
		tag: "Most balanced",
	},
	{
		description:
			"A premium plan for experienced investors seeking extended plan access and the highest projected package rate.",
		duration: "72 hours",
		features: [
			"No reinvestment limit",
			"Premium bonus eligibility",
			"Priority support routing",
			"Advanced account handling",
		],
		highlight: false,
		name: "Pro",
		price: "$20,000+",
		returnRate: "20%",
		tag: "Premium",
	},
];

export async function getPublicInvestmentPlans(): Promise<PublicInvestmentPlan[]> {
	try {
		// Import supabase client dynamically to avoid server/client issues
		const { createClient } = await import("@/utils/supabase/server");
		const { cookies } = await import("next/headers");
		const supabase = createClient(await cookies());

		const { data, error } = await supabase
			.from("investment_plans")
			.select(`
				id,
				name,
				tag,
				min_deposit_usd,
				max_deposit_usd,
				return_rate_percent,
				duration_hours,
				description,
				features,
				highlight
			`)
			.eq("status", "active")
			.order("min_deposit_usd");

		if (error) {
			console.error("Error fetching investment plans:", error);
			// Return empty array, will fallback to static plans
			return [];
		}

		return (data || []).map((plan: any) => ({
			id: plan.id,
			name: plan.name,
			tag: plan.tag,
			minDepositUsd: plan.min_deposit_usd,
			maxDepositUsd: plan.max_deposit_usd,
			returnRatePercent: plan.return_rate_percent,
			durationHours: plan.duration_hours,
			description: plan.description,
			features: plan.features || [],
			highlight: plan.highlight,
		}));
	} catch (error) {
		console.error("Error in getPublicInvestmentPlans:", error);
		return [];
	}
}
