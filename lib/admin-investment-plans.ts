import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminPlanStatus = "Active" | "Draft" | "Paused";

export type AdminPlanRisk = "Balanced" | "Conservative" | "High";

export type AdminInvestmentPlan = {
	activeInvestors: number;
	description: string;
	durationHours: number;
	features: string[];
	highlight: boolean;
	id: string;
	maxDepositUsd: number | null;
	minDepositUsd: number;
	name: string;
	profitCreditedUsd: number;
	returnRatePercent: number;
	risk: AdminPlanRisk;
	status: AdminPlanStatus;
	tag: string;
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
		activeInvestors: number;
		activePlans: number;
		maturingToday: number;
		totalInvestedUsd: number;
		totalProfitCreditedUsd: number;
		totalPlans: number;
	};
};

type SummaryRow = {
	active_investors: number | string;
	active_plans: number | string;
	maturing_today: number | string;
	total_invested_usd: number | string;
	total_plans: number | string;
	total_profit_credited_usd: number | string;
};

type PlanRow = {
	active_investors: number | string;
	archived_at: string | null;
	description: string;
	duration_hours: number;
	features: string[] | null;
	highlight: boolean;
	id: string;
	max_deposit_usd: number | string | null;
	min_deposit_usd: number | string;
	name: string;
	profit_credited_usd: number | string;
	risk: string;
	return_rate_percent: number | string;
	status: string;
	tag: string | null;
	total_invested_usd: number | string;
	updated_at: string;
};

type ActivityRow = {
	created_at: string;
	id: string;
	plan_name: string;
	title: string;
	to_status: string | null;
};

function toNumber(value: number | string | null | undefined) {
	if (typeof value === "number") return value;
	if (typeof value === "string" && value.length > 0) return Number(value);
	return 0;
}

function mapRisk(value: string): AdminPlanRisk {
	switch (value) {
		case "conservative":
			return "Conservative";
		case "high":
			return "High";
		default:
			return "Balanced";
	}
}

function mapStatus(value: string): AdminPlanStatus {
	switch (value) {
		case "paused":
			return "Paused";
		case "draft":
			return "Draft";
		default:
			return "Active";
	}
}

export async function getAdminInvestmentPlansData(
	supabase: SupabaseClient,
): Promise<AdminInvestmentPlansData> {
	const [summaryResult, plansResult, activityResult] = await Promise.all([
		supabase.rpc("get_admin_investment_plan_summary").single<SummaryRow>(),
		supabase
			.from("admin_investment_plan_catalog_view")
			.select(
				"id,name,description,tag,status,risk,min_deposit_usd,max_deposit_usd,return_rate_percent,duration_hours,features,highlight,archived_at,updated_at,active_investors,total_invested_usd,profit_credited_usd",
			)
			.order("display_order", { ascending: true })
			.order("created_at", { ascending: true })
			.returns<PlanRow[]>(),
		supabase
			.rpc("get_admin_investment_plan_activity", { limit_count: 8 })
			.returns<ActivityRow[]>(),
	]);

	if (summaryResult.error) throw new Error(summaryResult.error.message);
	if (plansResult.error) throw new Error(plansResult.error.message);
	if (activityResult.error) throw new Error(activityResult.error.message);

	const summary = summaryResult.data;
	const plans = (plansResult.data ?? [])
		.filter((plan) => plan.archived_at === null)
		.map((plan) => ({
			activeInvestors: toNumber(plan.active_investors),
			description: plan.description,
			durationHours: plan.duration_hours,
			features: Array.isArray(plan.features) ? plan.features : [],
			highlight: plan.highlight,
			id: plan.id,
			maxDepositUsd:
				plan.max_deposit_usd === null ? null : toNumber(plan.max_deposit_usd),
			minDepositUsd: toNumber(plan.min_deposit_usd),
			name: plan.name,
			profitCreditedUsd: toNumber(plan.profit_credited_usd),
			returnRatePercent: toNumber(plan.return_rate_percent),
			risk: mapRisk(plan.risk),
			status: mapStatus(plan.status),
			tag: plan.tag ?? "",
			totalInvestedUsd: toNumber(plan.total_invested_usd),
			updatedAt: plan.updated_at,
		}));

	return {
		activity: (Array.isArray(activityResult.data) ? activityResult.data : []).map(
			(item) => ({
			createdAt: item.created_at,
			id: item.id,
			planName: item.plan_name,
			status: mapStatus(item.to_status ?? "active"),
			title: item.title,
		}),
		),
		plans,
		summary: {
			activeInvestors: toNumber(summary?.active_investors),
			activePlans: toNumber(summary?.active_plans),
			maturingToday: toNumber(summary?.maturing_today),
			totalInvestedUsd: toNumber(summary?.total_invested_usd),
			totalProfitCreditedUsd: toNumber(summary?.total_profit_credited_usd),
			totalPlans: toNumber(summary?.total_plans),
		},
	};
}
