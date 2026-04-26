import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminTransactionType =
	| "Adjustment"
	| "Deposit"
	| "Fee"
	| "Investment"
	| "Profit"
	| "Referral"
	| "Withdrawal";

export type AdminTransactionStatus =
	| "Completed"
	| "Credited"
	| "Failed"
	| "Pending"
	| "Processing"
	| "Rejected"
	| "Reviewed";

export type AdminTransactionDirection = "In" | "Out";

export type AdminTransactionExceptionSeverity = "High" | "Low" | "Medium";

export type AdminTransactionTimelineItem = {
	createdAt: string;
	id: string;
	label: string;
};

export type AdminTransaction = {
	amount: number;
	amountUsd: number;
	assetSymbol: string;
	createdAt: string;
	direction: AdminTransactionDirection;
	exception?: string;
	feeUsd: number;
	id: string;
	internalNotes: string[];
	linkedReference: string;
	method: string;
	network: string;
	reference: string;
	reviewed: boolean;
	status: AdminTransactionStatus;
	timeline: AdminTransactionTimelineItem[];
	txHash?: string;
	type: AdminTransactionType;
	userEmail: string;
	userName: string;
	walletAddress?: string;
};

export type AdminTransactionException = {
	count: number;
	description: string;
	id: string;
	severity: AdminTransactionExceptionSeverity;
	title: string;
};

export type AdminTransactionReconciliationItem = {
	count: number;
	id: string;
	label: string;
	valueUsd: number;
};

export type AdminTransactionsData = {
	exceptions: AdminTransactionException[];
	reconciliation: AdminTransactionReconciliationItem[];
	summary: {
		failedRejectedCount: number;
		feesCollectedUsd: number;
		ledgerEntries: number;
		pendingProcessingCount: number;
		totalInflowUsd: number;
		totalOutflowUsd: number;
	};
	transactions: AdminTransaction[];
};

type SummaryRow = {
	failed_rejected_count: number | string;
	fees_collected_usd: number | string;
	ledger_entries: number | string;
	pending_processing_count: number | string;
	total_inflow_usd: number | string;
	total_outflow_usd: number | string;
};

type ReconciliationRow = {
	bucket: string;
	count: number | string;
	label: string;
	value_usd: number | string;
};

type ExceptionRow = {
	code: string;
	count: number | string;
	description: string;
	severity: string;
	title: string;
};

type TransactionRow = {
	amount: number | string;
	amount_usd: number | string;
	asset_symbol: string;
	created_at: string;
	direction: string;
	exception: string | null;
	fee_usd: number | string;
	id: string;
	internal_notes: Array<{ note?: string }> | string[] | null;
	linked_reference: string;
	method: string;
	network: string;
	reference: string;
	reviewed: boolean;
	status: string;
	timeline:
		| Array<{ createdAt?: string; created_at?: string; id?: string; label?: string }>
		| null;
	tx_hash: string | null;
	type: string;
	user_email: string | null;
	user_name: string | null;
	wallet_address: string | null;
};

function toNumber(value: number | string | null | undefined) {
	if (typeof value === "number") return value;
	if (typeof value === "string" && value.length > 0) return Number(value);
	return 0;
}

function mapStatus(value: string): AdminTransactionStatus {
	switch (value) {
		case "completed":
			return "Completed";
		case "credited":
			return "Credited";
		case "failed":
			return "Failed";
		case "processing":
			return "Processing";
		case "rejected":
			return "Rejected";
		case "reviewed":
			return "Reviewed";
		default:
			return "Pending";
	}
}

function mapDirection(value: string): AdminTransactionDirection {
	return value === "Out" ? "Out" : "In";
}

function mapType(value: string): AdminTransactionType {
	switch (value) {
		case "Withdrawal":
			return "Withdrawal";
		default:
			return "Deposit";
	}
}

function mapSeverity(value: string): AdminTransactionExceptionSeverity {
	switch (value) {
		case "high":
			return "High";
		case "medium":
			return "Medium";
		default:
			return "Low";
	}
}

function mapInternalNotes(
	value: TransactionRow["internal_notes"],
): string[] {
	if (!Array.isArray(value)) return [];

	return value.flatMap((item) => {
		if (typeof item === "string") return [item];
		if (item && typeof item.note === "string") return [item.note];
		return [];
	});
}

function mapTimeline(
	value: TransactionRow["timeline"],
): AdminTransactionTimelineItem[] {
	if (!Array.isArray(value)) return [];

	return value
		.map((item, index) => {
			const createdAt =
				typeof item?.createdAt === "string"
					? item.createdAt
					: typeof item?.created_at === "string"
						? item.created_at
						: "";
			const label = typeof item?.label === "string" ? item.label : "";

			if (!createdAt || !label) return null;

			return {
				createdAt,
				id:
					typeof item?.id === "string"
						? item.id
						: `transaction-timeline-${index}-${createdAt}`,
				label,
			};
		})
		.filter((item): item is AdminTransactionTimelineItem => item !== null)
		.sort((left, right) => {
			return (
				new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
			);
		});
}

export async function getAdminTransactionsData(
	supabase: SupabaseClient,
): Promise<AdminTransactionsData> {
	const [summaryResult, reconciliationResult, exceptionsResult, transactionsResult] =
		await Promise.all([
			supabase
				.rpc("get_admin_transaction_management_summary")
				.single<SummaryRow>(),
			supabase.rpc("get_admin_transaction_reconciliation"),
			supabase.rpc("get_admin_transaction_exceptions"),
			supabase
				.from("admin_transaction_management_view")
				.select(
					"id,reference,linked_reference,user_name,user_email,type,direction,status,asset_symbol,amount,amount_usd,fee_usd,network,method,wallet_address,tx_hash,reviewed,exception,internal_notes,timeline,created_at",
				)
				.order("created_at", { ascending: false })
				.returns<TransactionRow[]>(),
		]);

	if (summaryResult.error) throw new Error(summaryResult.error.message);
	if (reconciliationResult.error) {
		throw new Error(reconciliationResult.error.message);
	}
	if (exceptionsResult.error) throw new Error(exceptionsResult.error.message);
	if (transactionsResult.error) throw new Error(transactionsResult.error.message);

	const summary = summaryResult.data;

	return {
		summary: {
			failedRejectedCount: toNumber(summary?.failed_rejected_count),
			feesCollectedUsd: toNumber(summary?.fees_collected_usd),
			ledgerEntries: toNumber(summary?.ledger_entries),
			pendingProcessingCount: toNumber(summary?.pending_processing_count),
			totalInflowUsd: toNumber(summary?.total_inflow_usd),
			totalOutflowUsd: toNumber(summary?.total_outflow_usd),
		},
		reconciliation: ((reconciliationResult.data ?? []) as ReconciliationRow[]).map(
			(item) => ({
				count: toNumber(item.count),
				id: item.bucket,
				label: item.label,
				valueUsd: toNumber(item.value_usd),
			}),
		),
		exceptions: ((exceptionsResult.data ?? []) as ExceptionRow[]).map((item) => ({
			count: toNumber(item.count),
			description: item.description,
			id: item.code,
			severity: mapSeverity(item.severity),
			title: item.title,
		})),
		transactions: (transactionsResult.data ?? []).map((transaction) => ({
			amount: toNumber(transaction.amount),
			amountUsd: toNumber(transaction.amount_usd),
			assetSymbol: transaction.asset_symbol,
			createdAt: transaction.created_at,
			direction: mapDirection(transaction.direction),
			exception: transaction.exception ?? undefined,
			feeUsd: toNumber(transaction.fee_usd),
			id: transaction.id,
			internalNotes: mapInternalNotes(transaction.internal_notes),
			linkedReference: transaction.linked_reference,
			method: transaction.method,
			network: transaction.network,
			reference: transaction.reference,
			reviewed: transaction.reviewed,
			status: mapStatus(transaction.status),
			timeline: mapTimeline(transaction.timeline),
			txHash: transaction.tx_hash ?? undefined,
			type: mapType(transaction.type),
			userEmail: transaction.user_email ?? "",
			userName: transaction.user_name ?? "Unknown user",
			walletAddress: transaction.wallet_address ?? undefined,
		})),
	};
}
