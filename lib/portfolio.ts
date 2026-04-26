import type { SupabaseClient } from "@supabase/supabase-js";

export type PortfolioRange = "30D" | "90D" | "1Y";

export type PortfolioSummary = {
	bestPlan: { name: string; returnPercent: number };
	profitChangePercent: number;
	totalInvested: number;
	totalProfit: number;
	totalValue: number;
};

export type PortfolioAllocationSegment = {
	amount: number;
	color: string;
	name: string;
};

export type PortfolioPosition = {
	amount: number;
	id: string;
	maturityDate: string;
	planName: string;
	progress: number;
	projectedReturn: number;
	startDate: string;
	status: "Active" | "Maturing" | "Near completion" | "Pending";
};

export type PortfolioHolding = {
	amount: number;
	change24h: number;
	name: string;
	symbol: string;
	valueUsd: number;
};

export type PortfolioProfitEntry = {
	amount: number;
	date: string;
	id: string;
	planName: string;
	status: "Accruing" | "Credited" | "Pending";
};

export type PortfolioData = {
	allocation: PortfolioAllocationSegment[];
	holdings: PortfolioHolding[];
	performance: Record<PortfolioRange, number[]>;
	positions: PortfolioPosition[];
	profitHistory: PortfolioProfitEntry[];
	summary: PortfolioSummary;
};

type AllocationRow = {
	amount_usd: number | string;
	color_hex: string;
	plan_name: string;
};

type ActiveInvestmentRow = {
	amount_usd: number | string;
	end_at: string;
	id: string;
	plan_name: string;
	progress_percent: number;
	projected_profit_usd: number | string;
	start_at: string;
	status: string;
};

type HoldingRow = {
	amount: number | string;
	change_24h_percent: number | string;
	name: string;
	symbol: string;
	value_usd: number | string;
};

type ProfitRow = {
	amount_usd: number | string;
	display_status: string;
	id: string;
	occurred_at: string;
	plan_name: string;
};

type PerformanceRow = {
	bucket_index: number;
	total_value_usd: number | string;
};

type BestPlanRow = {
	name: string;
	return_rate_percent: number | string;
};

type InvestmentTotalsRow = {
	amount_usd: number | string;
	profit_credited_usd: number | string;
	projected_profit_usd: number | string;
	status: string;
};

function toNumber(value: number | string | null | undefined) {
	if (typeof value === "number") return value;
	if (typeof value === "string" && value.length > 0) return Number(value);
	return 0;
}

function mapPositionStatus(
	rawStatus: string,
	progress: number,
): PortfolioPosition["status"] {
	if (rawStatus === "matured") return "Pending";
	if (progress >= 95) return "Maturing";
	if (progress >= 80) return "Near completion";
	return "Active";
}

function mapProfitStatus(value: string): PortfolioProfitEntry["status"] {
	switch (value) {
		case "Credited":
			return "Credited";
		case "Pending":
			return "Pending";
		default:
			return "Accruing";
	}
}

async function fetchPerformance(
	supabase: SupabaseClient,
	range: PortfolioRange,
): Promise<number[]> {
	const { data, error } = await supabase.rpc("user_portfolio_performance", {
		p_range: range,
	});

	if (error) throw new Error(error.message);

	const rows = (data ?? []) as PerformanceRow[];

	return rows
		.slice()
		.sort((left, right) => left.bucket_index - right.bucket_index)
		.map((row) => toNumber(row.total_value_usd));
}

export async function getPortfolioData(
	supabase: SupabaseClient,
): Promise<PortfolioData> {
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (user) {
		await supabase.rpc("settle_matured_investments", {
			p_target_user_id: user.id,
		});
	}

	const [
		allocationResult,
		positionsResult,
		holdingsResult,
		profitResult,
		investmentTotalsResult,
		performance30D,
		performance90D,
		performance1Y,
	] = await Promise.all([
		supabase
			.from("user_portfolio_allocation_view")
			.select("plan_name,amount_usd,color_hex")
			.returns<AllocationRow[]>(),
		supabase
			.from("user_active_investments_view")
			.select(
				"id,plan_name,amount_usd,projected_profit_usd,progress_percent,start_at,end_at,status",
			)
			.order("end_at", { ascending: true })
			.returns<ActiveInvestmentRow[]>(),
		supabase
			.from("user_holdings_view")
			.select("symbol,name,amount,value_usd,change_24h_percent")
			.order("value_usd", { ascending: false })
			.returns<HoldingRow[]>(),
		supabase
			.from("user_profit_history_view")
			.select("id,plan_name,amount_usd,occurred_at,display_status")
			.limit(20)
			.returns<ProfitRow[]>(),
		supabase
			.from("user_investments")
			.select("amount_usd,projected_profit_usd,profit_credited_usd,status")
			.in("status", ["active", "matured"])
			.returns<InvestmentTotalsRow[]>(),
		fetchPerformance(supabase, "30D"),
		fetchPerformance(supabase, "90D"),
		fetchPerformance(supabase, "1Y"),
	]);

	if (allocationResult.error) throw new Error(allocationResult.error.message);
	if (positionsResult.error) throw new Error(positionsResult.error.message);
	if (holdingsResult.error) throw new Error(holdingsResult.error.message);
	if (profitResult.error) throw new Error(profitResult.error.message);
	if (investmentTotalsResult.error) {
		throw new Error(investmentTotalsResult.error.message);
	}

	const allocation: PortfolioAllocationSegment[] = (
		allocationResult.data ?? []
	).map((row) => ({
		amount: toNumber(row.amount_usd),
		color: row.color_hex,
		name: row.plan_name,
	}));

	const positions: PortfolioPosition[] = (positionsResult.data ?? []).map(
		(row) => ({
			amount: toNumber(row.amount_usd),
			id: row.id,
			maturityDate: row.end_at,
			planName: row.plan_name,
			progress: row.progress_percent,
			projectedReturn: toNumber(row.projected_profit_usd),
			startDate: row.start_at,
			status: mapPositionStatus(row.status, row.progress_percent),
		}),
	);

	const holdings: PortfolioHolding[] = (holdingsResult.data ?? []).map(
		(row) => ({
			amount: toNumber(row.amount),
			change24h: toNumber(row.change_24h_percent),
			name: row.name,
			symbol: row.symbol,
			valueUsd: toNumber(row.value_usd),
		}),
	);

	const profitHistory: PortfolioProfitEntry[] = (profitResult.data ?? []).map(
		(row) => ({
			amount: toNumber(row.amount_usd),
			date: row.occurred_at,
			id: row.id,
			planName: row.plan_name,
			status: mapProfitStatus(row.display_status),
		}),
	);

	const investmentTotals = investmentTotalsResult.data ?? [];
	const totalInvested = investmentTotals.reduce(
		(sum, row) => sum + toNumber(row.amount_usd),
		0,
	);
	const totalProfit = investmentTotals.reduce((sum, row) => {
		if (row.status === "matured") {
			return sum + toNumber(row.profit_credited_usd);
		}
		return sum + toNumber(row.profit_credited_usd);
	}, 0);

	const lastValue =
		performance30D.length > 0 ? performance30D[performance30D.length - 1] : 0;
	const totalValue = lastValue > 0 ? lastValue : totalInvested + totalProfit;

	const profitChangePercent =
		performance30D.length > 1 && performance30D[0] > 0
			? ((performance30D[performance30D.length - 1] - performance30D[0]) /
					performance30D[0]) *
				100
			: 0;

	const { data: bestPlanData } = await supabase
		.from("user_investments")
		.select("plan_id,investment_plans!inner(name,return_rate_percent)")
		.in("status", ["active", "matured"])
		.order("investment_plans(return_rate_percent)", { ascending: false })
		.limit(1)
		.maybeSingle<{
			plan_id: string;
			investment_plans: BestPlanRow | BestPlanRow[];
		}>();

	const bestPlanJoin = bestPlanData?.investment_plans;
	const bestPlanRow = Array.isArray(bestPlanJoin) ? bestPlanJoin[0] : bestPlanJoin;
	const bestPlan = bestPlanRow
		? {
				name: bestPlanRow.name,
				returnPercent: toNumber(bestPlanRow.return_rate_percent),
			}
		: { name: "—", returnPercent: 0 };

	return {
		allocation,
		holdings,
		performance: {
			"30D": performance30D,
			"90D": performance90D,
			"1Y": performance1Y,
		},
		positions,
		profitHistory,
		summary: {
			bestPlan,
			profitChangePercent,
			totalInvested,
			totalProfit,
			totalValue,
		},
	};
}
