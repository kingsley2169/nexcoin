import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { DashboardOverviewData } from "@/components/account/dashboard-overview";

type AccountStatus = "active" | "flagged" | "suspended";
type KycStatus = "approved" | "pending" | "rejected" | "unverified";
type UserInvestmentStatus = "active" | "matured" | "cancelled" | "refunded";

type ProfileRow = {
	account_status: AccountStatus;
	country: string | null;
	created_at: string;
	email: string;
	full_name: string | null;
	last_active_at: string | null;
	phone_number: string | null;
};

type BalanceSnapshotRow = {
	active_plans_count: number;
	available_balance_usd: number | string;
	deposits_usd: number | string;
	locked_balance_usd: number | string;
	updated_at: string;
	withdrawals_usd: number | string;
};

type ComplianceSummaryRow = {
	deposit_limit_usd: number | string | null;
	kyc_status: KycStatus;
	updated_at: string;
	withdrawal_limit_usd: number | string;
};

type InvestmentPlanRef = {
	name: string;
};

type InvestmentRow = {
	amount_usd: number | string;
	end_at: string;
	id: string;
	investment_plans: InvestmentPlanRef | InvestmentPlanRef[] | null;
	profit_credited_usd: number | string;
	projected_profit_usd: number | string;
	start_at: string;
	status: UserInvestmentStatus;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
	currency: "USD",
	style: "currency",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	day: "numeric",
	month: "short",
	year: "numeric",
});

function formatCurrency(value: number | string | null | undefined) {
	return currencyFormatter.format(toNumber(value));
}

function formatDate(value: string | null | undefined) {
	if (!value) {
		return "Not available";
	}

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return "Not available";
	}

	return dateFormatter.format(date);
}

function formatStatus(value: string | null | undefined) {
	if (!value) {
		return "Not available";
	}

	return value
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function toNumber(value: number | string | null | undefined) {
	if (typeof value === "number") {
		return value;
	}

	const parsed = Number(value ?? 0);
	return Number.isFinite(parsed) ? parsed : 0;
}

function getPlanName(plan: InvestmentRow["investment_plans"]) {
	if (Array.isArray(plan)) {
		return plan[0]?.name ?? "Investment Plan";
	}

	return plan?.name ?? "Investment Plan";
}

function getInvestmentProgress(investment: InvestmentRow) {
	const start = new Date(investment.start_at).getTime();
	const end = new Date(investment.end_at).getTime();
	const now = Date.now();

	if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
		return 0;
	}

	const progress = ((now - start) / (end - start)) * 100;
	return Math.max(0, Math.min(100, Math.round(progress)));
}

function buildEmptyDashboard(user: User): DashboardOverviewData {
	const email = user.email ?? "account@nexcoin.local";
	const name =
		typeof user.user_metadata?.full_name === "string"
			? user.user_metadata.full_name
			: email;

	return {
		accountDetails: [
			{ label: "Full Name", value: name },
			{ label: "Email", value: email },
			{ label: "Phone", value: "Not provided" },
			{ label: "Country", value: "Not provided" },
			{ label: "Status", value: "Active" },
			{ label: "Last Active", value: "Not available" },
		],
		activePlans: [],
		metrics: [
			{ label: "Total Balance", value: formatCurrency(0) },
			{ label: "Active Investment", value: formatCurrency(0) },
			{ label: "Total Profit", value: formatCurrency(0) },
			{ label: "Pending Withdrawal", value: formatCurrency(0) },
			{ label: "Available Balance", value: formatCurrency(0) },
			{ label: "Active Plans", value: "0" },
		],
		portfolioSnapshot: [
			{ label: "Account Status", value: "Active" },
			{ label: "Verification", value: "Unverified" },
			{ label: "Current Plan", value: "No active plan" },
			{ label: "Next Payout", value: "Not scheduled" },
			{ label: "Deposit Limit", value: "Not set" },
			{ label: "Member Since", value: "Not available" },
		],
		recentActivity: [],
		user: { email, name },
	};
}

export async function getAccountDashboardData(
	supabase: SupabaseClient,
	user: User,
): Promise<DashboardOverviewData> {
	await supabase.rpc("settle_matured_investments", {
		p_target_user_id: user.id,
	});

	const [
		profileResult,
		balanceResult,
		complianceResult,
		activeInvestmentsResult,
		allInvestmentsResult,
	] = await Promise.all([
		supabase
			.from("profiles")
			.select(
				"full_name,email,phone_number,country,account_status,last_active_at,created_at",
			)
			.eq("id", user.id)
			.maybeSingle<ProfileRow>(),
		supabase
			.from("user_balance_snapshots")
			.select(
				"available_balance_usd,locked_balance_usd,deposits_usd,withdrawals_usd,active_plans_count,updated_at",
			)
			.eq("user_id", user.id)
			.maybeSingle<BalanceSnapshotRow>(),
		supabase
			.from("my_compliance_summary")
			.select("kyc_status,withdrawal_limit_usd,deposit_limit_usd,updated_at")
			.eq("user_id", user.id)
			.maybeSingle<ComplianceSummaryRow>(),
		supabase
			.from("user_investments")
			.select(
				"id,amount_usd,projected_profit_usd,profit_credited_usd,status,start_at,end_at,investment_plans(name)",
			)
			.eq("user_id", user.id)
			.eq("status", "active")
			.order("end_at", { ascending: true })
			.limit(3)
			.returns<InvestmentRow[]>(),
		supabase
			.from("user_investments")
			.select(
				"id,amount_usd,projected_profit_usd,profit_credited_usd,status,start_at,end_at,investment_plans(name)",
			)
			.eq("user_id", user.id)
			.order("created_at", { ascending: false })
			.limit(8)
			.returns<InvestmentRow[]>(),
	]);

	if (profileResult.error) {
		throw new Error(profileResult.error.message);
	}

	if (balanceResult.error) {
		throw new Error(balanceResult.error.message);
	}

	if (complianceResult.error) {
		throw new Error(complianceResult.error.message);
	}

	if (activeInvestmentsResult.error) {
		throw new Error(activeInvestmentsResult.error.message);
	}

	if (allInvestmentsResult.error) {
		throw new Error(allInvestmentsResult.error.message);
	}

	const fallback = buildEmptyDashboard(user);
	const profile = profileResult.data;
	const balance = balanceResult.data;
	const compliance = complianceResult.data;
	const activeInvestments = activeInvestmentsResult.data ?? [];
	const allInvestments = allInvestmentsResult.data ?? [];
	const fullName = profile?.full_name || fallback.user.name;
	const email = profile?.email || fallback.user.email;
	const activeInvestedUsd =
		activeInvestments.reduce(
			(total, investment) => total + toNumber(investment.amount_usd),
			0,
		) || toNumber(balance?.locked_balance_usd);
	const totalProfitUsd = allInvestments.reduce(
		(total, investment) => total + toNumber(investment.profit_credited_usd),
		0,
	);
	const availableBalanceUsd = toNumber(balance?.available_balance_usd);
	const lockedBalanceUsd = toNumber(balance?.locked_balance_usd);
	const totalBalanceUsd = availableBalanceUsd + lockedBalanceUsd;
	const nextPayout = activeInvestments[0]?.end_at;

	return {
		accountDetails: [
			{ label: "Full Name", value: fullName },
			{ label: "Email", value: email },
			{ label: "Phone", value: profile?.phone_number ?? "Not provided" },
			{ label: "Country", value: profile?.country ?? "Not provided" },
			{
				label: "Status",
				value: formatStatus(profile?.account_status ?? "active"),
			},
			{ label: "Last Active", value: formatDate(profile?.last_active_at) },
		],
		activePlans: activeInvestments.map((investment) => ({
			amount: formatCurrency(investment.amount_usd),
			expectedReturn: formatCurrency(investment.projected_profit_usd),
			maturityDate: formatDate(investment.end_at),
			name: getPlanName(investment.investment_plans),
			progress: getInvestmentProgress(investment),
			startDate: formatDate(investment.start_at),
			status: formatStatus(investment.status),
		})),
		metrics: [
			{ label: "Total Balance", value: formatCurrency(totalBalanceUsd) },
			{ label: "Active Investment", value: formatCurrency(activeInvestedUsd) },
			{ label: "Total Profit", value: formatCurrency(totalProfitUsd) },
			{ label: "Total Deposits", value: formatCurrency(balance?.deposits_usd) },
			{ label: "Available Balance", value: formatCurrency(availableBalanceUsd) },
			{
				label: "Active Plans",
				value: String(balance?.active_plans_count ?? activeInvestments.length),
			},
		],
		portfolioSnapshot: [
			{
				label: "Account Status",
				value: formatStatus(profile?.account_status ?? "active"),
			},
			{
				label: "Verification",
				value: formatStatus(compliance?.kyc_status ?? "unverified"),
			},
			{
				label: "Current Plan",
				value: activeInvestments[0]
					? getPlanName(activeInvestments[0].investment_plans)
					: "No active plan",
			},
			{ label: "Next Payout", value: nextPayout ? formatDate(nextPayout) : "Not scheduled" },
			{
				label: "Withdrawal Limit",
				value: formatCurrency(compliance?.withdrawal_limit_usd),
			},
			{ label: "Member Since", value: formatDate(profile?.created_at) },
		],
		recentActivity:
			allInvestments.length > 0
				? allInvestments.slice(0, 5).map((investment) => ({
						amount: formatCurrency(investment.amount_usd),
						date: formatDate(investment.start_at),
						label: getPlanName(investment.investment_plans),
						status: formatStatus(investment.status),
						type: "Investment",
					}))
				: [
						{
							amount: formatCurrency(0),
							date: formatDate(profile?.created_at),
							label: "Account created",
							status: formatStatus(profile?.account_status ?? "active"),
							type: "Account",
						},
					],
		user: {
			email,
			name: fullName,
		},
	};
}
