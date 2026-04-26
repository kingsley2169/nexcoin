import type { SupabaseClient } from "@supabase/supabase-js";

export type WithdrawableAsset = {
	balance: number;
	feeFlat: number;
	feePercent: number;
	id: string;
	minWithdrawal: number;
	name: string;
	network: string;
	rateUsd: number;
	symbol: string;
};

export type SavedAddress = {
	address: string;
	assetId: string;
	id: string;
	isDefault: boolean;
	label: string;
	network: string;
};

export type WithdrawalStatus =
	| "Completed"
	| "Pending"
	| "Processing"
	| "Rejected";

export type WithdrawalRequest = {
	addressMasked: string;
	amount: number;
	assetSymbol: string;
	createdAt: string;
	id: string;
	reference: string;
	status: WithdrawalStatus;
};

export type WithdrawalLimits = {
	availableBalanceUsd: number;
	dailyLimitUsd: number;
	dailyUsedUsd: number;
	monthlyLimitUsd: number;
	monthlyUsedUsd: number;
	pendingUsd: number;
	processingTime: string;
};

export type WithdrawalData = {
	assets: WithdrawableAsset[];
	limits: WithdrawalLimits;
	recentWithdrawals: WithdrawalRequest[];
	savedAddresses: SavedAddress[];
	securityNotes: string[];
};

type SummaryRow = {
	asset_id: string;
	available_balance_usd: number | string;
	daily_limit_usd: number | string;
	daily_used_usd: number | string;
	estimated_available_balance: number | string;
	fee_flat: number | string;
	fee_percent: number | string;
	min_withdrawal: number | string;
	monthly_limit_usd: number | string;
	monthly_used_usd: number | string;
	name: string;
	network: string;
	pending_usd: number | string;
	placeholder_rate_usd: number | string;
	processing_time_label: string;
	symbol: string;
};

type SavedAddressRow = {
	address: string;
	asset_id: string;
	id: string;
	is_default: boolean;
	label: string;
	network: string;
};

type RecentWithdrawalRow = {
	amount: number | string;
	asset: string;
	created_at: string;
	destination_address_snapshot: string;
	id: string;
	reference: string;
	status: string;
};

const securityNotes = [
	"Withdrawals use the same asset and network as your most recent deposit when AML review is required.",
	"A 24-hour cool-down applies after any password change or new 2FA device.",
	"Nexcoin staff will never ask for your private keys, seed phrase, or 2FA codes.",
	"Save addresses to reduce typos and pre-approve destinations for faster payouts.",
];

function toNumber(value: number | string | null | undefined) {
	if (typeof value === "number") return value;
	if (typeof value === "string" && value.length > 0) return Number(value);
	return 0;
}

function maskAddress(address: string) {
	if (address.length <= 14) return address;
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function mapStatus(value: string): WithdrawalStatus {
	switch (value) {
		case "completed":
			return "Completed";
		case "approved":
		case "processing":
			return "Processing";
		case "rejected":
			return "Rejected";
		default:
			return "Pending";
	}
}

export async function getWithdrawalData(
	supabase: SupabaseClient,
): Promise<WithdrawalData> {
	const [summaryResult, addressesResult, withdrawalsResult] = await Promise.all([
		supabase
			.from("user_withdrawal_summary_view")
			.select(
				"asset_id,symbol,name,network,min_withdrawal,fee_flat,fee_percent,placeholder_rate_usd,available_balance_usd,estimated_available_balance,daily_limit_usd,monthly_limit_usd,daily_used_usd,monthly_used_usd,pending_usd,processing_time_label",
			)
			.returns<SummaryRow[]>(),
		supabase
			.from("user_saved_addresses_view")
			.select("id,asset_id,label,network,address,is_default")
			.returns<SavedAddressRow[]>(),
		supabase
			.from("crypto_withdrawals")
			.select(
				"id,reference,asset,amount,destination_address_snapshot,status,created_at",
			)
			.order("created_at", { ascending: false })
			.limit(10)
			.returns<RecentWithdrawalRow[]>(),
	]);

	if (summaryResult.error) throw new Error(summaryResult.error.message);
	if (addressesResult.error) throw new Error(addressesResult.error.message);
	if (withdrawalsResult.error) throw new Error(withdrawalsResult.error.message);

	const summaryRows = summaryResult.data ?? [];
	const firstRow = summaryRows[0];

	const assets: WithdrawableAsset[] = summaryRows.map((row) => ({
		balance: toNumber(row.estimated_available_balance),
		feeFlat: toNumber(row.fee_flat),
		feePercent: toNumber(row.fee_percent),
		id: row.asset_id,
		minWithdrawal: toNumber(row.min_withdrawal),
		name: row.name,
		network: row.network,
		rateUsd: toNumber(row.placeholder_rate_usd),
		symbol: row.symbol,
	}));

	const limits: WithdrawalLimits = {
		availableBalanceUsd: toNumber(firstRow?.available_balance_usd),
		dailyLimitUsd: toNumber(firstRow?.daily_limit_usd),
		dailyUsedUsd: summaryRows.reduce(
			(sum, row) => Math.max(sum, toNumber(row.daily_used_usd)),
			0,
		),
		monthlyLimitUsd: toNumber(firstRow?.monthly_limit_usd),
		monthlyUsedUsd: summaryRows.reduce(
			(sum, row) => Math.max(sum, toNumber(row.monthly_used_usd)),
			0,
		),
		pendingUsd: summaryRows.reduce(
			(sum, row) => sum + toNumber(row.pending_usd),
			0,
		),
		processingTime:
			firstRow?.processing_time_label ?? "Up to 24 hours on business days",
	};

	const savedAddresses: SavedAddress[] = (addressesResult.data ?? []).map(
		(row) => ({
			address: row.address,
			assetId: row.asset_id,
			id: row.id,
			isDefault: row.is_default,
			label: row.label,
			network: row.network,
		}),
	);

	const recentWithdrawals: WithdrawalRequest[] = (
		withdrawalsResult.data ?? []
	).map((row) => ({
		addressMasked: maskAddress(row.destination_address_snapshot),
		amount: toNumber(row.amount),
		assetSymbol: row.asset.toUpperCase(),
		createdAt: row.created_at,
		id: row.id,
		reference: row.reference,
		status: mapStatus(row.status),
	}));

	return {
		assets,
		limits,
		recentWithdrawals,
		savedAddresses,
		securityNotes,
	};
}
