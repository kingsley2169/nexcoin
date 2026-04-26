import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminUserTransactionSourceType =
	| "crypto_deposit"
	| "crypto_withdrawal";

export type AdminUserTransactionType = "Deposit" | "Withdrawal";

export type AdminUserTransactionDirection = "In" | "Out";

export type AdminUserTransactionStatus =
	| "Completed"
	| "Credited"
	| "Failed"
	| "Pending"
	| "Processing"
	| "Rejected"
	| "Reviewed";

export type AdminUserTransaction = {
	amount: number;
	amountUsd: number;
	assetSymbol: string;
	createdAt: string;
	direction: AdminUserTransactionDirection;
	feeUsd: number;
	id: string;
	method: string;
	network: string;
	reference: string;
	sourceId: string;
	sourceType: AdminUserTransactionSourceType;
	status: AdminUserTransactionStatus;
	txHash?: string;
	type: AdminUserTransactionType;
	walletAddress?: string;
};

type TransactionRow = {
	amount: number | string;
	amount_usd: number | string;
	asset_symbol: string;
	created_at: string;
	direction: string;
	fee_usd: number | string;
	id: string;
	method: string;
	network: string;
	reference: string;
	source_id: string;
	source_type: string;
	status: string;
	tx_hash: string | null;
	type: string;
	wallet_address: string | null;
};

function toNumber(value: number | string | null | undefined) {
	if (typeof value === "number") return value;
	if (typeof value === "string" && value.length > 0) return Number(value);
	return 0;
}

function mapStatus(value: string): AdminUserTransactionStatus {
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

function mapDirection(value: string): AdminUserTransactionDirection {
	return value === "Out" ? "Out" : "In";
}

function mapType(value: string): AdminUserTransactionType {
	return value === "Withdrawal" ? "Withdrawal" : "Deposit";
}

function mapSourceType(value: string): AdminUserTransactionSourceType {
	return value === "crypto_withdrawal"
		? "crypto_withdrawal"
		: "crypto_deposit";
}

export async function getAdminUserTransactions(
	supabase: SupabaseClient,
	userId: string,
): Promise<AdminUserTransaction[]> {
	const { data, error } = await supabase
		.from("admin_transaction_management_view")
		.select(
			"id,source_type,source_id,reference,type,direction,status,asset_symbol,amount,amount_usd,fee_usd,network,method,wallet_address,tx_hash,created_at",
		)
		.eq("user_id", userId)
		.order("created_at", { ascending: false })
		.returns<TransactionRow[]>();

	if (error) throw new Error(error.message);

	return (data ?? []).map((row) => ({
		amount: toNumber(row.amount),
		amountUsd: toNumber(row.amount_usd),
		assetSymbol: row.asset_symbol,
		createdAt: row.created_at,
		direction: mapDirection(row.direction),
		feeUsd: toNumber(row.fee_usd),
		id: row.id,
		method: row.method,
		network: row.network,
		reference: row.reference,
		sourceId: row.source_id,
		sourceType: mapSourceType(row.source_type),
		status: mapStatus(row.status),
		txHash: row.tx_hash ?? undefined,
		type: mapType(row.type),
		walletAddress: row.wallet_address ?? undefined,
	}));
}
