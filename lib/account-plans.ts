import type { SupabaseClient } from "@supabase/supabase-js";

export type AccountPlansSummary = {
	activeInvestment: number;
	activePlans: number;
	availableBalance: number;
	projectedProfit: number;
};

export type AccountPlan = {
	availability: string;
	bestFor: string;
	description: string;
	durationDays: number;
	features: string[];
	highlight: boolean;
	id: string;
	maxInvestment: number | null;
	minInvestment: number;
	name: string;
	payoutSchedule: string;
	rate: number;
	tag: string;
};

export type ActiveAccountPlan = {
	amount: number;
	canCancel: boolean;
	id: string;
	maturityDate: string;
	name: string;
	progress: number;
	status: string;
};

export type AccountPlansData = {
	accountSummary: AccountPlansSummary;
	activePlans: ActiveAccountPlan[];
	plans: AccountPlan[];
};

type BalanceRow = {
	active_plans_count: number | string;
	available_balance_usd: number | string;
	locked_balance_usd: number | string;
};

type PlanRow = {
	description: string;
	duration_hours: number;
	features: string[] | null;
	highlight: boolean;
	id: string;
	max_deposit_usd: number | string | null;
	min_deposit_usd: number | string;
	name: string;
	return_rate_percent: number | string;
	tag: string | null;
};

type ActivePlanRow = {
	amount_usd: number | string;
	id: string;
	profit_credited_usd: number | string;
	plan_name: string;
	progress_percent: number;
	projected_profit_usd: number | string;
	start_at: string;
	end_at: string;
};

function toNumber(value: number | string | null | undefined) {
	if (typeof value === "number") return value;
	if (typeof value === "string" && value.length > 0) return Number(value);
	return 0;
}

function formatShortDate(iso: string) {
	return new Intl.DateTimeFormat("en-US", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(new Date(iso));
}

function getAvailability(highlight: boolean) {
	return highlight ? "Popular" : "Open";
}

function getBestFor(minDeposit: number) {
	if (minDeposit >= 20000) return "Experienced investors";
	if (minDeposit >= 5000) return "Growing portfolios";
	if (minDeposit >= 1000) return "Bonus package access";
	return "New investors";
}

function getPlanStatus(progress: number) {
	if (progress >= 85) return "Near completion";
	return "Active";
}

function canCancelPlan(startAt: string, profitCreditedUsd: number) {
	if (profitCreditedUsd > 0) return false;

	const startTime = new Date(startAt).getTime();
	if (Number.isNaN(startTime)) return false;

	return Date.now() - startTime <= 15 * 60 * 1000;
}

export async function getAccountPlansData(
	supabase: SupabaseClient,
): Promise<AccountPlansData> {
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (user) {
		await supabase.rpc("settle_matured_investments", {
			p_target_user_id: user.id,
		});
	}

	const [balanceResult, plansResult, activePlansResult] = await Promise.all([
		supabase
			.from("user_balance_snapshots")
			.select("available_balance_usd,locked_balance_usd,active_plans_count")
			.single<BalanceRow>(),
		supabase
			.from("investment_plans")
			.select(
				"id,name,description,tag,min_deposit_usd,max_deposit_usd,return_rate_percent,duration_hours,features,highlight",
			)
			.eq("status", "active")
			.is("archived_at", null)
			.order("display_order", { ascending: true })
			.order("created_at", { ascending: true })
			.returns<PlanRow[]>(),
		supabase
			.from("user_active_investments_view")
			.select(
				"id,plan_name,amount_usd,projected_profit_usd,profit_credited_usd,progress_percent,start_at,end_at",
			)
			.order("end_at", { ascending: true })
			.returns<ActivePlanRow[]>(),
	]);

	if (balanceResult.error && balanceResult.error.code !== "PGRST116") {
		throw new Error(balanceResult.error.message);
	}
	if (plansResult.error) throw new Error(plansResult.error.message);
	if (activePlansResult.error) throw new Error(activePlansResult.error.message);

	const activePlans = (activePlansResult.data ?? []).map((plan) => ({
		amount: toNumber(plan.amount_usd),
		canCancel: canCancelPlan(
			plan.start_at,
			toNumber(plan.profit_credited_usd),
		),
		id: plan.id,
		maturityDate: formatShortDate(plan.end_at),
		name: plan.plan_name,
		progress: plan.progress_percent,
		status: getPlanStatus(plan.progress_percent),
	}));

	const projectedProfit = (activePlansResult.data ?? []).reduce(
		(total,
		plan,
	) => total + toNumber(plan.projected_profit_usd),
	0);

	return {
		accountSummary: {
			activeInvestment:
				toNumber(balanceResult.data?.locked_balance_usd) ||
				activePlans.reduce((total, plan) => total + plan.amount, 0),
			activePlans:
				toNumber(balanceResult.data?.active_plans_count) || activePlans.length,
			availableBalance: toNumber(balanceResult.data?.available_balance_usd),
			projectedProfit,
		},
		activePlans,
		plans: (plansResult.data ?? []).map((plan) => ({
			availability: getAvailability(plan.highlight),
			bestFor: getBestFor(toNumber(plan.min_deposit_usd)),
			description: plan.description,
			durationDays: Math.max(Math.round(plan.duration_hours / 24), 1),
			features: Array.isArray(plan.features) ? plan.features : [],
			highlight: plan.highlight,
			id: plan.id,
			maxInvestment:
				plan.max_deposit_usd === null ? null : toNumber(plan.max_deposit_usd),
			minInvestment: toNumber(plan.min_deposit_usd),
			name: plan.name,
			payoutSchedule: "At maturity",
			rate: toNumber(plan.return_rate_percent),
			tag: plan.tag ?? "",
		})),
	};
}
