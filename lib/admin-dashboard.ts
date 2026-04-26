import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminMetricTone = "danger" | "neutral" | "positive" | "warning";

export type AdminQueuePriority = "High" | "Normal" | "Urgent";

export type AdminActivityStatus =
	| "Approved"
	| "Completed"
	| "Flagged"
	| "Pending"
	| "Resolved";

export type AdminMetric = {
	hint: string;
	label: string;
	tone: AdminMetricTone;
	value: string;
};

export type AdminQueueItem = {
	age: string;
	amount?: string;
	href: string;
	id: string;
	priority: AdminQueuePriority;
	reference: string;
	title: string;
	type: string;
	user: string;
};

export type AdminFinancialSnapshot = {
	breakdown: {
		count: number;
		label: string;
		value: string;
	}[];
	footer: string;
	title: string;
	total: string;
};

export type AdminInvestmentOverview = {
	activePlans: string;
	maturingToday: number;
	mostPopularPlan: string;
	profitCreditedToday: string;
	totalInvested: string;
};

export type AdminRiskAlert = {
	description: string;
	href: string;
	id: string;
	severity: AdminQueuePriority;
	title: string;
};

export type AdminActivity = {
	createdAt: string;
	id: string;
	reference: string;
	status: AdminActivityStatus;
	title: string;
	user: string;
};

export type AdminDashboardData = {
	activity: AdminActivity[];
	financialSnapshots: AdminFinancialSnapshot[];
	investmentOverview: AdminInvestmentOverview;
	metrics: AdminMetric[];
	queue: AdminQueueItem[];
	riskAlerts: AdminRiskAlert[];
	shiftNotes: string[];
};

type SummaryInvestmentRow = {
	active_investors: number | string;
	active_plans: number | string;
	maturing_today: number | string;
	total_invested_usd: number | string;
	total_profit_credited_usd: number | string;
};

type SummaryDepositRow = {
	average_credit_minutes: number | string;
	confirming_count: number | string;
	confirming_usd: number | string;
	needs_review_count: number | string;
	needs_review_usd: number | string;
	pending_count: number | string;
	pending_usd: number | string;
};

type SummaryWithdrawalRow = {
	aml_review_count: number | string;
	aml_review_usd: number | string;
	average_processing_hours: number | string;
	pending_count: number | string;
	pending_usd: number | string;
	processing_count: number | string;
	processing_usd: number | string;
};

type SummaryTransactionRow = {
	failed_rejected_count: number | string;
	pending_processing_count: number | string;
};

type KycSummaryPayload = {
	summary?: {
		approvedToday?: number;
		averageReviewMinutes?: number;
		documentsExpiring?: number;
		pendingReview?: number;
		rejectedToday?: number;
	};
};

type SupportSummaryPayload = {
	slaAlerts?: Array<{
		dueAt: string;
		id: string;
		reference: string;
		subject: string;
	}>;
	summary?: {
		averageFirstResponseMinutes?: number;
		awaitingUser?: number;
		openTickets?: number;
		resolvedToday?: number;
		slaAtRisk?: number;
		urgentTickets?: number;
	};
};

type DepositQueueRow = {
	amount_usd: number | string;
	created_at: string;
	id: string;
	network: string;
	reference: string;
	status: string;
	user_name: string | null;
};

type WithdrawalQueueRow = {
	amount_usd: number | string;
	created_at: string;
	id: string;
	reference: string;
	risk: string | null;
	status: string;
	user_name: string | null;
};

type KycQueueRow = {
	created_at: string;
	document_quality: string | null;
	id: string;
	reference: string;
	status: string;
	user_name: string | null;
};

type SupportQueueRow = {
	created_at: string;
	id: string;
	priority: string;
	reference: string;
	status: string;
	subject: string;
	user_name: string | null;
};

type TransactionActivityRow = {
	created_at: string;
	id: string;
	reference: string;
	status: string;
	type: string;
	user_name: string | null;
};

type PopularPlanRow = {
	active_investors: number | string;
	name: string;
};

type AdminUserCountRow = {
	id: string;
	kyc_status: string | null;
	status: string;
};

type AdminUserRoleRow = {
	user_id: string;
};

const usdCompactFormatter = new Intl.NumberFormat("en-US", {
	currency: "USD",
	maximumFractionDigits: 1,
	minimumFractionDigits: 0,
	notation: "compact",
	style: "currency",
});

const usdFormatter = new Intl.NumberFormat("en-US", {
	currency: "USD",
	maximumFractionDigits: 2,
	style: "currency",
});

function formatUsd(value: number) {
	return usdFormatter.format(value);
}

function formatUsdCompact(value: number) {
	return usdCompactFormatter.format(value);
}

function toNumber(value: number | string | null | undefined) {
	if (typeof value === "number") return value;
	if (typeof value === "string" && value.length > 0) return Number(value);
	return 0;
}

function hoursAgo(iso: string) {
	const diffMs = Date.now() - new Date(iso).getTime();
	const hours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
	return `${hours}h`;
}

function formatMinutes(value: number) {
	return `${Math.round(value)} min`;
}

function formatHours(value: number) {
	return `${value.toFixed(1)} h`;
}

function mapQueuePriority(value: "high" | "normal" | "urgent"): AdminQueuePriority {
	switch (value) {
		case "urgent":
			return "Urgent";
		case "high":
			return "High";
		default:
			return "Normal";
	}
}

function mapActivityStatus(value: string): AdminActivityStatus {
	switch (value.toLowerCase()) {
		case "approved":
		case "credited":
			return "Approved";
		case "completed":
			return "Completed";
		case "rejected":
		case "failed":
		case "needs_review":
		case "needs resubmission":
		case "flagged":
			return "Flagged";
		case "resolved":
		case "reviewed":
			return "Resolved";
		default:
			return "Pending";
	}
}

function adminName(name: string | null | undefined) {
	return name?.trim() || "Unknown user";
}

export async function getAdminDashboardData(
	supabase: SupabaseClient,
): Promise<AdminDashboardData> {
	const [
		investmentSummaryResult,
		depositSummaryResult,
		withdrawalSummaryResult,
		transactionSummaryResult,
		kycSummaryResult,
		supportSummaryResult,
		depositQueueResult,
		withdrawalQueueResult,
		kycQueueResult,
		supportQueueResult,
		transactionActivityResult,
		popularPlanResult,
		adminUsersResult,
		adminUserCountsResult,
	] = await Promise.all([
		supabase
			.rpc("get_admin_investment_plan_summary")
			.single<SummaryInvestmentRow>(),
		supabase
			.rpc("get_admin_deposit_management_summary")
			.single<SummaryDepositRow>(),
		supabase
			.rpc("get_admin_withdrawal_management_summary")
			.single<SummaryWithdrawalRow>(),
		supabase
			.rpc("get_admin_transaction_management_summary")
			.single<SummaryTransactionRow>(),
		supabase.rpc("get_admin_kyc_review_summary"),
		supabase.rpc("get_admin_support_management_summary"),
		supabase
			.from("admin_deposit_management_view")
			.select("id,reference,user_name,amount_usd,network,created_at,status")
			.in("status", ["pending", "confirming", "needs_review"])
			.order("created_at", { ascending: true })
			.limit(1)
			.returns<DepositQueueRow[]>(),
		supabase
			.from("admin_withdrawal_management_view")
			.select("id,reference,user_name,amount_usd,created_at,status,risk")
			.in("status", ["pending", "aml_review", "approved", "processing"])
			.order("created_at", { ascending: true })
			.limit(1)
			.returns<WithdrawalQueueRow[]>(),
		supabase
			.from("admin_kyc_review_view")
			.select("id,reference,user_name,created_at,status,document_quality")
			.in("status", ["pending", "in_review", "needs_resubmission"])
			.order("created_at", { ascending: true })
			.limit(1)
			.returns<KycQueueRow[]>(),
		supabase
			.from("admin_support_management_view")
			.select("id,reference,user_name,subject,created_at,status,priority")
			.in("status", ["Open", "Pending Admin", "Awaiting User"])
			.order("created_at", { ascending: true })
			.limit(1)
			.returns<SupportQueueRow[]>(),
		supabase
			.from("admin_transaction_management_view")
			.select("id,reference,user_name,created_at,status,type")
			.order("created_at", { ascending: false })
			.limit(5)
			.returns<TransactionActivityRow[]>(),
		supabase
			.from("admin_investment_plan_catalog_view")
			.select("name,active_investors")
			.order("active_investors", { ascending: false })
			.order("name", { ascending: true })
			.limit(1)
			.returns<PopularPlanRow[]>(),
		supabase.from("admin_users").select("user_id").returns<AdminUserRoleRow[]>(),
		supabase
			.from("admin_user_management_view")
			.select("id,status,kyc_status")
			.returns<AdminUserCountRow[]>(),
	]);

	if (investmentSummaryResult.error) {
		throw new Error(investmentSummaryResult.error.message);
	}
	if (depositSummaryResult.error) throw new Error(depositSummaryResult.error.message);
	if (withdrawalSummaryResult.error) {
		throw new Error(withdrawalSummaryResult.error.message);
	}
	if (transactionSummaryResult.error) {
		throw new Error(transactionSummaryResult.error.message);
	}
	if (kycSummaryResult.error) throw new Error(kycSummaryResult.error.message);
	if (supportSummaryResult.error) throw new Error(supportSummaryResult.error.message);
	if (depositQueueResult.error) throw new Error(depositQueueResult.error.message);
	if (withdrawalQueueResult.error) {
		throw new Error(withdrawalQueueResult.error.message);
	}
	if (kycQueueResult.error) throw new Error(kycQueueResult.error.message);
	if (supportQueueResult.error) throw new Error(supportQueueResult.error.message);
	if (transactionActivityResult.error) {
		throw new Error(transactionActivityResult.error.message);
	}
	if (popularPlanResult.error) throw new Error(popularPlanResult.error.message);
	if (adminUsersResult.error) throw new Error(adminUsersResult.error.message);
	if (adminUserCountsResult.error) {
		throw new Error(adminUserCountsResult.error.message);
	}

	const investmentSummary = investmentSummaryResult.data ?? undefined;
	const depositSummary = depositSummaryResult.data ?? undefined;
	const withdrawalSummary = withdrawalSummaryResult.data ?? undefined;
	const transactionSummary = transactionSummaryResult.data ?? undefined;
	const kycSummary = (kycSummaryResult.data ?? {}) as KycSummaryPayload;
	const supportSummary = (supportSummaryResult.data ?? {}) as SupportSummaryPayload;

	const depositQueue = depositQueueResult.data?.[0];
	const withdrawalQueue = withdrawalQueueResult.data?.[0];
	const kycQueue = kycQueueResult.data?.[0];
	const supportQueue = supportQueueResult.data?.[0];
	const popularPlan = popularPlanResult.data?.[0];
	const adminUserIds = new Set(
		(adminUsersResult.data ?? []).map((row) => row.user_id),
	);
	const platformUsers = (adminUserCountsResult.data ?? []).filter(
		(row) => !adminUserIds.has(row.id),
	);
	const platformUserSummary = {
		activeUsers: platformUsers.filter(
			(row) => row.status.toLowerCase() === "active",
		).length,
		pendingKyc: platformUsers.filter(
			(row) => row.kyc_status?.toLowerCase() === "pending",
		).length,
		totalUsers: platformUsers.length,
	};

	const metrics: AdminMetric[] = [
		{
			hint: `${platformUserSummary.activeUsers.toLocaleString("en-US")} active users`,
			label: "Total users",
			tone: "positive",
			value: platformUserSummary.totalUsers.toLocaleString("en-US"),
		},
		{
			hint: `${toNumber(kycSummary.summary?.approvedToday).toLocaleString("en-US")} approved today`,
			label: "Pending KYC",
			tone: "warning",
			value: platformUserSummary.pendingKyc.toLocaleString("en-US"),
		},
		{
			hint: `${toNumber(depositSummary?.pending_count).toLocaleString("en-US")} requests pending`,
			label: "Pending deposits",
			tone: "warning",
			value: formatUsd(toNumber(depositSummary?.pending_usd)),
		},
		{
			hint: `${toNumber(withdrawalSummary?.pending_count).toLocaleString("en-US")} requests pending`,
			label: "Pending withdrawals",
			tone: "danger",
			value: formatUsd(toNumber(withdrawalSummary?.pending_usd)),
		},
		{
			hint: `${toNumber(transactionSummary?.pending_processing_count).toLocaleString("en-US")} pending or processing`,
			label: "Transaction exceptions",
			tone: "neutral",
			value: toNumber(transactionSummary?.failed_rejected_count).toLocaleString("en-US"),
		},
		{
			hint: `${toNumber(supportSummary.summary?.urgentTickets).toLocaleString("en-US")} urgent · ${toNumber(supportSummary.summary?.slaAtRisk).toLocaleString("en-US")} SLA risk`,
			label: "Open support tickets",
			tone: "warning",
			value: toNumber(supportSummary.summary?.openTickets).toLocaleString("en-US"),
		},
	];

	const financialSnapshots: AdminFinancialSnapshot[] = [
		{
			breakdown: [
				{
					count: toNumber(depositSummary?.confirming_count),
					label: "Crypto confirming",
					value: formatUsd(toNumber(depositSummary?.confirming_usd)),
				},
				{
					count: toNumber(depositSummary?.needs_review_count),
					label: "Manual payment review",
					value: formatUsd(toNumber(depositSummary?.needs_review_usd)),
				},
				{
					count: toNumber(depositSummary?.pending_count),
					label: "Pending credit",
					value: formatUsd(toNumber(depositSummary?.pending_usd)),
				},
			],
			footer: `Average credit time: ${formatMinutes(toNumber(depositSummary?.average_credit_minutes))}`,
			title: "Deposit operations",
			total: formatUsd(toNumber(depositSummary?.pending_usd)),
		},
		{
			breakdown: [
				{
					count: toNumber(withdrawalSummary?.aml_review_count),
					label: "AML review",
					value: formatUsd(toNumber(withdrawalSummary?.aml_review_usd)),
				},
				{
					count: toNumber(withdrawalSummary?.processing_count),
					label: "Processing payout",
					value: formatUsd(toNumber(withdrawalSummary?.processing_usd)),
				},
				{
					count: toNumber(withdrawalSummary?.pending_count),
					label: "Pending release",
					value: formatUsd(toNumber(withdrawalSummary?.pending_usd)),
				},
			],
			footer: `Average processing time: ${formatHours(toNumber(withdrawalSummary?.average_processing_hours))}`,
			title: "Withdrawal operations",
			total: formatUsd(toNumber(withdrawalSummary?.pending_usd)),
		},
	];

	const investmentOverview: AdminInvestmentOverview = {
		activePlans: toNumber(investmentSummary?.active_plans).toLocaleString("en-US"),
		maturingToday: toNumber(investmentSummary?.maturing_today),
		mostPopularPlan:
			popularPlan && toNumber(popularPlan.active_investors) > 0
				? popularPlan.name
				: "No active plan yet",
		profitCreditedToday: formatUsd(
			toNumber(investmentSummary?.total_profit_credited_usd),
		),
		totalInvested: formatUsdCompact(
			toNumber(investmentSummary?.total_invested_usd),
		),
	};

	const queue: AdminQueueItem[] = [];

	if (withdrawalQueue) {
		queue.push({
			age: hoursAgo(withdrawalQueue.created_at),
			amount: formatUsd(toNumber(withdrawalQueue.amount_usd)),
			href: "/nexcoin-admin-priv/withdrawals-management",
			id: withdrawalQueue.id,
			priority:
				withdrawalQueue.status === "aml_review" ||
				withdrawalQueue.risk === "high"
					? "Urgent"
					: "High",
			reference: withdrawalQueue.reference,
			title:
				withdrawalQueue.status === "aml_review"
					? "Withdrawal in AML review"
					: "Withdrawal review",
			type: "Withdrawal",
			user: adminName(withdrawalQueue.user_name),
		});
	}

	if (depositQueue) {
		queue.push({
			age: hoursAgo(depositQueue.created_at),
			amount: formatUsd(toNumber(depositQueue.amount_usd)),
			href: "/nexcoin-admin-priv/deposits-management",
			id: depositQueue.id,
			priority:
				depositQueue.status === "needs_review" ? "High" : "Normal",
			reference: depositQueue.reference,
			title:
				depositQueue.status === "needs_review"
					? "Deposit needs review"
					: `${depositQueue.network} deposit confirming`,
			type: "Deposit",
			user: adminName(depositQueue.user_name),
		});
	}

	if (kycQueue) {
		queue.push({
			age: hoursAgo(kycQueue.created_at),
			href: "/nexcoin-admin-priv/kyc-review",
			id: kycQueue.id,
			priority:
				kycQueue.status === "needs_resubmission" ? "High" : "Normal",
			reference: kycQueue.reference,
			title:
				kycQueue.document_quality === "poor" ||
				kycQueue.status === "needs_resubmission"
					? "Additional ID document needed"
					: "KYC submission waiting review",
			type: "KYC",
			user: adminName(kycQueue.user_name),
		});
	}

	if (supportQueue) {
		queue.push({
			age: hoursAgo(supportQueue.created_at),
			href: "/nexcoin-admin-priv/support",
			id: supportQueue.id,
			priority: mapQueuePriority(
				supportQueue.priority.toLowerCase() === "urgent"
					? "urgent"
					: supportQueue.priority.toLowerCase() === "high"
						? "high"
						: "normal",
			),
			reference: supportQueue.reference,
			title: supportQueue.subject,
			type: "Support",
			user: adminName(supportQueue.user_name),
		});
	}

	const activity: AdminActivity[] = (transactionActivityResult.data ?? [])
		.map((row) => ({
			createdAt: row.created_at,
			id: row.id,
			reference: row.reference,
			status: mapActivityStatus(row.status),
			title:
				row.type === "Deposit"
					? "Deposit activity updated"
					: row.type === "Withdrawal"
						? "Withdrawal activity updated"
						: `${row.type} activity updated`,
			user: adminName(row.user_name),
		}))
		.sort((left, right) => {
			return (
				new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
			);
		});

	const riskAlerts: AdminRiskAlert[] = [];

	if (toNumber(withdrawalSummary?.aml_review_count) > 0) {
		riskAlerts.push({
			description: `${toNumber(withdrawalSummary?.aml_review_count).toLocaleString("en-US")} withdrawals are sitting in AML review and need a decision before the queue grows older.`,
			href: "/nexcoin-admin-priv/withdrawals-management",
			id: "risk-withdrawal-aml-review",
			severity: "Urgent",
			title: "Withdrawal AML review backlog",
		});
	}

	if (toNumber(kycSummary.summary?.pendingReview) > 0) {
		riskAlerts.push({
			description: `${toNumber(kycSummary.summary?.pendingReview).toLocaleString("en-US")} KYC submissions are still waiting for review, including document-quality resubmissions.`,
			href: "/nexcoin-admin-priv/kyc-review",
			id: "risk-kyc-pending-review",
			severity: "High",
			title: "KYC review backlog",
		});
	}

	if (toNumber(supportSummary.summary?.slaAtRisk) > 0) {
		riskAlerts.push({
			description: `${toNumber(supportSummary.summary?.slaAtRisk).toLocaleString("en-US")} support tickets are approaching SLA breach and need admin follow-up.`,
			href: "/nexcoin-admin-priv/support",
			id: "risk-support-sla",
			severity: "Normal",
			title: "Support SLA risk",
		});
	}

	return {
		activity,
		financialSnapshots,
		investmentOverview,
		metrics,
		queue,
		riskAlerts,
		shiftNotes: [
			`${toNumber(depositSummary?.confirming_count).toLocaleString("en-US")} crypto deposits are waiting for confirmation or review.`,
			`${toNumber(withdrawalSummary?.aml_review_count).toLocaleString("en-US")} withdrawals are still in AML review.`,
			`KYC queue average review time is ${formatMinutes(toNumber(kycSummary.summary?.averageReviewMinutes))}.`,
			`${toNumber(supportSummary.summary?.slaAtRisk).toLocaleString("en-US")} support tickets are at risk of missing SLA.`,
		],
	};
}
