import type { SupabaseClient } from "@supabase/supabase-js";

export type DepositAssetStatus = "Active" | "Maintenance";

export type DepositStatus =
	| "Confirming"
	| "Credited"
	| "Needs Review"
	| "Pending"
	| "Rejected";

export type CryptoDepositAsset = {
	address: string;
	color: string;
	confirmationsRequired: number;
	id: string;
	minDeposit: number;
	name: string;
	network: string;
	rateUsd: number;
	status: DepositAssetStatus;
	symbol: string;
};

export type RecentDeposit = {
	amount: number;
	amountUsd: number;
	assetSymbol: string;
	createdAt: string;
	id: string;
	method: string;
	reference: string;
	status: DepositStatus;
};

export type DepositData = {
	assets: CryptoDepositAsset[];
	recentDeposits: RecentDeposit[];
	rules: string[];
	summary: {
		availableBalanceUsd: number;
		lastDepositLabel: string;
		pendingDepositsUsd: number;
		supportedAssets: number;
	};
};

type DepositAssetRow = {
	wallet_id: string;
	asset: string;
	symbol: string;
	name: string;
	network: string;
	address: string;
	color: string;
	min_deposit: number | string;
	confirmations_required: number;
	placeholder_rate_usd: number | string;
	status: string;
};

type RecentDepositRow = {
	id: string;
	reference: string;
	asset_symbol: string;
	method: string;
	amount: number | string;
	amount_usd: number | string;
	created_at: string;
	status: string;
};

type BalanceRow = {
	available_balance_usd: number | string | null;
};

const COINGECKO_IDS: Record<string, string> = {
	BTC: "bitcoin",
	ETH: "ethereum",
	USDT: "tether",
};

type CoinGeckoResponse = Record<string, { usd?: number }>;

async function fetchLiveRates(): Promise<Record<string, number>> {
	const ids = Object.values(COINGECKO_IDS).join(",");
	const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;

	try {
		const response = await fetch(url, { next: { revalidate: 30 } });
		if (!response.ok) return {};
		const data = (await response.json()) as CoinGeckoResponse;

		const rates: Record<string, number> = {};
		for (const [symbol, id] of Object.entries(COINGECKO_IDS)) {
			const price = data[id]?.usd;
			if (typeof price === "number" && Number.isFinite(price) && price > 0) {
				rates[symbol] = price;
			}
		}
		return rates;
	} catch {
		return {};
	}
}

const rules = [
	"Send only the selected asset through the matching network.",
	"Crypto deposits are credited after the required number of confirmations.",
	"Deposits are only accepted in Bitcoin, Ethereum, and USDT.",
	"Nexcoin staff will never ask for private keys, seed phrases, or wallet recovery details.",
	"Deposited funds must follow platform investment and withdrawal rules.",
];

function toNumber(value: number | string | null | undefined) {
	if (typeof value === "number") return value;
	const parsed = Number(value ?? 0);
	return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStatus(value: string): DepositStatus {
	switch (value) {
		case "Pending":
		case "Confirming":
		case "Credited":
		case "Rejected":
		case "Needs Review":
			return value;
		default:
			return "Pending";
	}
}

function formatAssetAmount(value: number) {
	const trimmed = Number.parseFloat(value.toFixed(8));
	return Number.isFinite(trimmed) ? trimmed.toString() : "0";
}

export async function getDepositData(
	supabase: SupabaseClient,
	userId: string,
): Promise<DepositData> {
	const [assetsResult, depositsResult, balanceResult, liveRates] =
		await Promise.all([
			supabase
				.from("user_deposit_assets_view")
				.select(
					"wallet_id,asset,symbol,name,network,address,color,min_deposit,confirmations_required,placeholder_rate_usd,status",
				)
				.returns<DepositAssetRow[]>(),
			supabase
				.from("user_recent_deposits_view")
				.select(
					"id,reference,asset_symbol,method,amount,amount_usd,created_at,status",
				)
				.limit(10)
				.returns<RecentDepositRow[]>(),
			supabase
				.from("user_balance_snapshots")
				.select("available_balance_usd")
				.eq("user_id", userId)
				.maybeSingle<BalanceRow>(),
			fetchLiveRates(),
		]);

	if (assetsResult.error) throw new Error(assetsResult.error.message);
	if (depositsResult.error) throw new Error(depositsResult.error.message);
	if (balanceResult.error) throw new Error(balanceResult.error.message);

	const assets: CryptoDepositAsset[] = (assetsResult.data ?? []).map((row) => {
		const symbol = row.symbol.toUpperCase();
		const liveRate = liveRates[symbol];
		const fallbackRate = toNumber(row.placeholder_rate_usd);

		return {
			address: row.address,
			color: row.color,
			confirmationsRequired: row.confirmations_required,
			id: row.wallet_id,
			minDeposit: toNumber(row.min_deposit),
			name: row.name,
			network: row.network,
			rateUsd: liveRate ?? fallbackRate,
			status: row.status === "active" ? "Active" : "Maintenance",
			symbol: row.symbol,
		};
	});

	const recentDeposits: RecentDeposit[] = (depositsResult.data ?? []).map(
		(row) => ({
			amount: toNumber(row.amount),
			amountUsd: toNumber(row.amount_usd),
			assetSymbol: row.asset_symbol,
			createdAt: row.created_at,
			id: row.id,
			method: row.method,
			reference: row.reference,
			status: normalizeStatus(row.status),
		}),
	);

	const pendingDepositsUsd = recentDeposits
		.filter(
			(deposit) =>
				deposit.status === "Pending" ||
				deposit.status === "Confirming" ||
				deposit.status === "Needs Review",
		)
		.reduce((total, deposit) => total + deposit.amountUsd, 0);

	const lastCredited = recentDeposits.find(
		(deposit) => deposit.status === "Credited",
	);
	const lastDepositLabel = lastCredited
		? `${formatAssetAmount(lastCredited.amount)} ${lastCredited.assetSymbol}`
		: "No deposits yet";

	return {
		assets,
		recentDeposits,
		rules,
		summary: {
			availableBalanceUsd: toNumber(balanceResult.data?.available_balance_usd),
			lastDepositLabel,
			pendingDepositsUsd,
			supportedAssets: assets.length,
		},
	};
}
