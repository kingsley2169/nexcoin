import type { SupabaseClient } from "@supabase/supabase-js";

export type TransactionType =
	| "deposit"
	| "fee"
	| "investment"
	| "profit"
	| "referral"
	| "withdrawal";

export type TransactionStatus =
	| "accruing"
	| "completed"
	| "credited"
	| "failed"
	| "pending"
	| "processing";

export type TransactionDirection = "in" | "out";

export type Transaction = {
	amount: number;
	amountUsd: number;
	assetSymbol: string;
	createdAt: string;
	detail: string;
	direction: TransactionDirection;
	fee?: number;
	feeAsset?: string;
	fullAddress?: string;
	id: string;
	notes?: string;
	planName?: string;
	reference: string;
	status: TransactionStatus;
	txHash?: string;
	type: TransactionType;
};

export const transactionTypeLabels: Record<TransactionType, string> = {
	deposit: "Deposit",
	fee: "Fee",
	investment: "Investment",
	profit: "Profit",
	referral: "Referral",
	withdrawal: "Withdrawal",
};

export const transactionStatusLabels: Record<TransactionStatus, string> = {
	accruing: "Accruing",
	completed: "Completed",
	credited: "Credited",
	failed: "Failed",
	pending: "Pending",
	processing: "Processing",
};

type TransactionRow = {
	amount: number | string;
	amount_usd: number | string;
	asset_symbol: string;
	created_at: string;
	detail: string;
	direction: string;
	fee: number | string | null;
	fee_asset: string | null;
	full_address: string | null;
	id: string;
	notes: string | null;
	plan_name: string | null;
	reference: string;
	status: string;
	tx_hash: string | null;
	type: string;
};

function toNumber(value: number | string | null | undefined) {
	if (typeof value === "number") return value;
	if (typeof value === "string" && value.length > 0) return Number(value);
	return 0;
}

function mapType(value: string): TransactionType {
	switch (value) {
		case "deposit":
		case "fee":
		case "investment":
		case "profit":
		case "referral":
		case "withdrawal":
			return value;
		default:
			return "fee";
	}
}

function mapStatus(value: string): TransactionStatus {
	switch (value) {
		case "accruing":
		case "completed":
		case "credited":
		case "failed":
		case "pending":
		case "processing":
			return value;
		default:
			return "pending";
	}
}

function mapDirection(value: string): TransactionDirection {
	return value === "out" ? "out" : "in";
}

export async function getTransactions(
	supabase: SupabaseClient,
): Promise<Transaction[]> {
	const { data, error } = await supabase
		.from("user_transactions_view")
		.select(
			"id,reference,type,status,direction,amount,amount_usd,asset_symbol,detail,plan_name,fee,fee_asset,full_address,tx_hash,notes,created_at",
		)
		.order("created_at", { ascending: false })
		.returns<TransactionRow[]>();

	if (error) throw new Error(error.message);

	return (data ?? []).map((row) => ({
		amount: toNumber(row.amount),
		amountUsd: toNumber(row.amount_usd),
		assetSymbol: row.asset_symbol,
		createdAt: row.created_at,
		detail: row.detail,
		direction: mapDirection(row.direction),
		fee: row.fee !== null ? toNumber(row.fee) : undefined,
		feeAsset: row.fee_asset ?? undefined,
		fullAddress: row.full_address ?? undefined,
		id: row.id,
		notes: row.notes ?? undefined,
		planName: row.plan_name ?? undefined,
		reference: row.reference,
		status: mapStatus(row.status),
		txHash: row.tx_hash ?? undefined,
		type: mapType(row.type),
	}));
}
