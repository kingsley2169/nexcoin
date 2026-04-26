import type { SupabaseClient } from "@supabase/supabase-js";

export type WalletStatus = "Active" | "Default" | "Review";

export type WalletAsset = {
	address: string;
	color: string;
	createdAt: string;
	id: string;
	isDefault: boolean;
	label: string;
	lastUsedAt: string;
	name: string;
	network: string;
	status: WalletStatus;
	symbol: string;
};

export type WalletActivityStatus = "Completed" | "Pending" | "Saved";

export type WalletActivity = {
	assetSymbol: string;
	createdAt: string;
	id: string;
	label: string;
	reference: string;
	status: WalletActivityStatus;
	type: "Wallet" | "Deposit" | "Withdrawal";
};

export type WalletsData = {
	activities: WalletActivity[];
	assets: WalletAsset[];
	notes: string[];
};

type WalletRow = {
	id: string;
	asset: string;
	symbol: string;
	name: string | null;
	color: string | null;
	label: string;
	network: string;
	address: string;
	is_default: boolean;
	created_at: string;
	last_used_at: string;
	status: string;
};

type WalletActivityRow = {
	id: string;
	asset_symbol: string;
	created_at: string;
	label: string;
	reference: string;
	status: string;
	type: string;
};

const notes = [
	"Save only wallets you control or trust before using them for withdrawals.",
	"Always confirm the asset and network before sending funds to a saved wallet.",
	"Nexcoin staff will never ask for your private keys, seed phrase, or wallet recovery phrase.",
	"Review saved wallet labels carefully so you can pick the right destination during withdrawals.",
];

function normalizeStatus(value: string): WalletStatus {
	switch (value) {
		case "Active":
		case "Default":
		case "Review":
			return value;
		default:
			return "Active";
	}
}

function normalizeActivityStatus(value: string): WalletActivityStatus {
	switch (value) {
		case "Completed":
		case "Pending":
		case "Saved":
			return value;
		default:
			return "Saved";
	}
}

function normalizeActivityType(value: string): WalletActivity["type"] {
	switch (value) {
		case "Wallet":
		case "Deposit":
		case "Withdrawal":
			return value;
		default:
			return "Wallet";
	}
}

export async function getWalletsData(
	supabase: SupabaseClient,
	_userId: string,
): Promise<WalletsData> {
	void _userId;

	const [walletsResult, activityResult] = await Promise.all([
		supabase
			.from("user_wallets_view")
			.select(
				"id,asset,symbol,name,color,label,network,address,is_default,created_at,last_used_at,status",
			)
			.returns<WalletRow[]>(),
		supabase
			.from("user_wallet_activity_view")
			.select("id,asset_symbol,created_at,label,reference,status,type")
			.limit(20)
			.returns<WalletActivityRow[]>(),
	]);

	if (walletsResult.error) throw new Error(walletsResult.error.message);
	if (activityResult.error) throw new Error(activityResult.error.message);

	const assets: WalletAsset[] = (walletsResult.data ?? []).map((row) => ({
		address: row.address,
		color: row.color ?? "#5F9EA0",
		createdAt: row.created_at,
		id: row.id,
		isDefault: row.is_default,
		label: row.label,
		lastUsedAt: row.last_used_at,
		name: row.name ?? row.symbol,
		network: row.network,
		status: normalizeStatus(row.status),
		symbol: row.symbol,
	}));

	const activities: WalletActivity[] = (activityResult.data ?? []).map(
		(row) => ({
			assetSymbol: row.asset_symbol,
			createdAt: row.created_at,
			id: row.id,
			label: row.label,
			reference: row.reference,
			status: normalizeActivityStatus(row.status),
			type: normalizeActivityType(row.type),
		}),
	);

	return { activities, assets, notes };
}
