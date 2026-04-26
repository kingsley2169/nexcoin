import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminWithdrawalStatus =
	| "AML Review"
	| "Approved"
	| "Completed"
	| "Pending"
	| "Processing"
	| "Rejected";

export type AdminWithdrawalRisk = "High" | "Low" | "Medium";

export type AdminWithdrawalKycStatus =
	| "Approved"
	| "Pending"
	| "Rejected"
	| "Unverified";

export type AdminWithdrawalCheckStatus = "Failed" | "Passed" | "Warning";

export type AdminWithdrawalCheck = {
	label: string;
	status: AdminWithdrawalCheckStatus;
};

export type AdminWithdrawalTimelineItem = {
	createdAt: string;
	id: string;
	label: string;
};

export type AdminWithdrawal = {
	accountStatus: "Active" | "Flagged" | "Suspended";
	amount: number;
	amountUsd: number;
	assetSymbol: string;
	checks: AdminWithdrawalCheck[];
	createdAt: string;
	destinationAddress: string;
	destinationLabel: string;
	fee: number;
	id: string;
	internalNotes: string[];
	kycStatus: AdminWithdrawalKycStatus;
	netAmount: number;
	network: string;
	reference: string;
	risk: AdminWithdrawalRisk;
	securityNotes: string[];
	status: AdminWithdrawalStatus;
	timeline: AdminWithdrawalTimelineItem[];
	txHash?: string;
	userEmail: string;
	userName: string;
};

export type AdminWithdrawalsManagementData = {
	rules: string[];
	summary: {
		amlReviewCount: number;
		amlReviewUsd: number;
		averageProcessingTime: string;
		completedTodayUsd: number;
		pendingCount: number;
		pendingUsd: number;
		processingCount: number;
		processingUsd: number;
		rejectedTodayUsd: number;
	};
	withdrawals: AdminWithdrawal[];
};

type SummaryRow = {
	aml_review_count: number | string;
	aml_review_usd: number | string;
	average_processing_hours: number | string;
	completed_today_usd: number | string;
	pending_count: number | string;
	pending_usd: number | string;
	processing_count: number | string;
	processing_usd: number | string;
	rejected_today_usd: number | string;
};

type WithdrawalRow = {
	account_status: string | null;
	amount: number | string;
	amount_usd: number | string;
	asset_symbol: string;
	checks:
		| Array<{
				id?: string;
				label?: string;
				status?: string;
		  }>
		| null;
	created_at: string;
	destination_address: string;
	destination_label: string;
	fee: number | string;
	id: string;
	internal_notes:
		| Array<{
				note?: string;
		  }>
		| null;
	kyc_status: string | null;
	net_amount: number | string;
	network: string;
	reference: string;
	risk: string | null;
	security_notes: string[] | null;
	status: string;
	timeline:
		| Array<{
				createdAt?: string;
				id?: string;
				label?: string;
		  }>
		| null;
	tx_hash: string | null;
	user_email: string | null;
	user_name: string | null;
};

const rules = [
	"Approve withdrawals only after required KYC, 2FA, and destination checks pass.",
	"Hold requests with recent password changes, new device logins, or large amount thresholds.",
	"Reject withdrawals with failed identity checks or unsupported destination networks.",
	"Record internal notes before approving high-risk payouts.",
];

function toNumber(value: number | string | null | undefined) {
	if (typeof value === "number") return value;
	if (typeof value === "string" && value.length > 0) return Number(value);
	return 0;
}

function mapStatus(value: string): AdminWithdrawalStatus {
	switch (value) {
		case "approved":
			return "Approved";
		case "aml_review":
			return "AML Review";
		case "completed":
			return "Completed";
		case "processing":
			return "Processing";
		case "rejected":
			return "Rejected";
		default:
			return "Pending";
	}
}

function mapRisk(value: string | null): AdminWithdrawalRisk {
	switch (value) {
		case "high":
			return "High";
		case "medium":
			return "Medium";
		default:
			return "Low";
	}
}

function mapKyc(value: string | null): AdminWithdrawalKycStatus {
	switch (value) {
		case "approved":
			return "Approved";
		case "pending":
		case "in_review":
		case "needs_resubmission":
			return "Pending";
		case "rejected":
			return "Rejected";
		default:
			return "Unverified";
	}
}

function mapAccountStatus(
	value: string | null,
): AdminWithdrawal["accountStatus"] {
	switch (value) {
		case "flagged":
			return "Flagged";
		case "suspended":
			return "Suspended";
		default:
			return "Active";
	}
}

function mapCheckStatus(value: string | undefined): AdminWithdrawalCheckStatus {
	switch (value) {
		case "passed":
			return "Passed";
		case "failed":
			return "Failed";
		default:
			return "Warning";
	}
}

function formatProcessingHours(hours: number) {
	if (hours <= 0) return "—";
	if (hours < 1) return `${Math.round(hours * 60)} min`;
	if (hours < 24) return `${hours.toFixed(1)} h`;
	return `${(hours / 24).toFixed(1)} d`;
}

export async function getAdminWithdrawalsManagementData(
	supabase: SupabaseClient,
): Promise<AdminWithdrawalsManagementData> {
	const [summaryResult, withdrawalsResult] = await Promise.all([
		supabase
			.rpc("get_admin_withdrawal_management_summary")
			.single<SummaryRow>(),
		supabase
			.from("admin_withdrawal_management_view")
			.select(
				"id,reference,user_name,user_email,account_status,kyc_status,asset_symbol,network,amount,amount_usd,fee,net_amount,destination_label,destination_address,status,risk,security_notes,tx_hash,internal_notes,timeline,checks,created_at",
			)
			.order("created_at", { ascending: false })
			.returns<WithdrawalRow[]>(),
	]);

	if (summaryResult.error) throw new Error(summaryResult.error.message);
	if (withdrawalsResult.error) throw new Error(withdrawalsResult.error.message);

	const summary = summaryResult.data;

	const withdrawals: AdminWithdrawal[] = (withdrawalsResult.data ?? []).map(
		(row) => ({
			accountStatus: mapAccountStatus(row.account_status),
			amount: toNumber(row.amount),
			amountUsd: toNumber(row.amount_usd),
			assetSymbol: row.asset_symbol,
			checks: (row.checks ?? []).map((check) => ({
				label: check.label ?? "",
				status: mapCheckStatus(check.status),
			})),
			createdAt: row.created_at,
			destinationAddress: row.destination_address,
			destinationLabel: row.destination_label,
			fee: toNumber(row.fee),
			id: row.id,
			internalNotes: (row.internal_notes ?? [])
				.map((item) => item.note ?? "")
				.filter((value) => value.length > 0),
			kycStatus: mapKyc(row.kyc_status),
			netAmount: toNumber(row.net_amount),
			network: row.network,
			reference: row.reference,
			risk: mapRisk(row.risk),
			securityNotes: row.security_notes ?? [],
			status: mapStatus(row.status),
			timeline: (row.timeline ?? [])
				.map((item, index) => ({
					createdAt: item.createdAt ?? "",
					id: item.id ?? `${row.id}-timeline-${index}`,
					label: item.label ?? "",
				}))
				.filter((item) => item.createdAt && item.label)
				.sort(
					(left, right) =>
						new Date(left.createdAt).getTime() -
						new Date(right.createdAt).getTime(),
				),
			txHash: row.tx_hash ?? undefined,
			userEmail: row.user_email ?? "",
			userName: row.user_name ?? "Unknown user",
		}),
	);

	return {
		rules,
		summary: {
			amlReviewCount: toNumber(summary?.aml_review_count),
			amlReviewUsd: toNumber(summary?.aml_review_usd),
			averageProcessingTime: formatProcessingHours(
				toNumber(summary?.average_processing_hours),
			),
			completedTodayUsd: toNumber(summary?.completed_today_usd),
			pendingCount: toNumber(summary?.pending_count),
			pendingUsd: toNumber(summary?.pending_usd),
			processingCount: toNumber(summary?.processing_count),
			processingUsd: toNumber(summary?.processing_usd),
			rejectedTodayUsd: toNumber(summary?.rejected_today_usd),
		},
		withdrawals,
	};
}
