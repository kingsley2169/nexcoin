import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminDepositStatus =
	| "Confirming"
	| "Credited"
	| "Needs Review"
	| "Pending"
	| "Rejected";

export type AdminDepositRisk = "High" | "Low" | "Medium";

export type AdminReceivingWalletAsset = "BTC" | "ETH" | "USDT";

export type AdminReceivingWallet = {
	address: string;
	asset: AdminReceivingWalletAsset;
	id: string;
	isActive: boolean;
	label: string;
	network: string;
	updatedAt: string;
};

export type AdminDepositTimelineItem = {
	createdAt: string;
	id: string;
	label: string;
};

export type AdminDeposit = {
	amount: number;
	amountUsd: number;
	assetSymbol: string;
	confirmations: number;
	confirmationsRequired: number;
	createdAt: string;
	id: string;
	internalNotes: string[];
	network: string;
	reference: string;
	risk: AdminDepositRisk;
	riskNotes: string[];
	senderAddress?: string;
	status: AdminDepositStatus;
	timeline: AdminDepositTimelineItem[];
	txHash?: string;
	userEmail: string;
	userName: string;
	walletAddress?: string;
};

export type AdminDepositsManagementData = {
	deposits: AdminDeposit[];
	receivingWallets: AdminReceivingWallet[];
	rules: string[];
	summary: {
		averageCreditTime: string;
		confirmingCount: number;
		confirmingUsd: number;
		creditedTodayUsd: number;
		needsReviewCount: number;
		needsReviewUsd: number;
		pendingCount: number;
		pendingUsd: number;
		rejectedTodayUsd: number;
	};
};

type SummaryRow = {
	average_credit_minutes: number | string;
	confirming_count: number | string;
	confirming_usd: number | string;
	credited_today_usd: number | string;
	needs_review_count: number | string;
	needs_review_usd: number | string;
	pending_count: number | string;
	pending_usd: number | string;
	rejected_today_usd: number | string;
};

type DepositRow = {
	amount: number | string;
	amount_usd: number | string;
	asset_symbol: string;
	confirmations: number;
	confirmations_required: number;
	created_at: string;
	id: string;
	internal_notes: Array<{ note?: string }> | string[] | null;
	network: string;
	reference: string;
	risk: string | null;
	risk_notes: string[] | null;
	sender_address: string | null;
	status: string;
	timeline:
		| Array<{ createdAt?: string; created_at?: string; id?: string; label?: string }>
		| null;
	tx_hash: string | null;
	user_email: string | null;
	user_name: string | null;
	wallet_address: string | null;
};

type ReceivingWalletRow = {
	address: string;
	asset: string;
	id: string;
	is_active: boolean;
	label: string;
	network: string;
	updated_at: string;
};

function toNumber(value: number | string | null | undefined) {
	if (typeof value === "number") return value;
	if (typeof value === "string" && value.length > 0) return Number(value);
	return 0;
}

function mapStatus(value: string): AdminDepositStatus {
	switch (value) {
		case "confirming":
			return "Confirming";
		case "credited":
			return "Credited";
		case "needs_review":
			return "Needs Review";
		case "rejected":
			return "Rejected";
		default:
			return "Pending";
	}
}

function mapRisk(value: string | null): AdminDepositRisk {
	switch (value) {
		case "high":
			return "High";
		case "medium":
			return "Medium";
		default:
			return "Low";
	}
}

function mapWalletAsset(value: string): AdminReceivingWalletAsset {
	switch (value) {
		case "btc":
			return "BTC";
		case "eth":
			return "ETH";
		default:
			return "USDT";
	}
}

function mapInternalNotes(
	value: DepositRow["internal_notes"],
): string[] {
	if (!Array.isArray(value)) return [];

	return value.flatMap((item) => {
		if (typeof item === "string") return [item];
		if (item && typeof item.note === "string") return [item.note];
		return [];
	});
}

function mapTimeline(
	value: DepositRow["timeline"],
): AdminDepositTimelineItem[] {
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
						: `deposit-timeline-${index}-${createdAt}`,
				label,
			};
		})
		.filter((item): item is AdminDepositTimelineItem => item !== null)
		.sort((left, right) => {
			return (
				new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
			);
		});
}

export async function getAdminDepositsManagementData(
	supabase: SupabaseClient,
): Promise<AdminDepositsManagementData> {
	const [summaryResult, depositsResult, walletsResult] = await Promise.all([
		supabase
			.rpc("get_admin_deposit_management_summary")
			.single<SummaryRow>(),
		supabase
			.from("admin_deposit_management_view")
			.select(
				"id,reference,user_name,user_email,asset_symbol,network,amount,amount_usd,confirmations,confirmations_required,tx_hash,sender_address,wallet_address,status,risk,risk_notes,internal_notes,timeline,created_at",
			)
			.order("created_at", { ascending: false })
			.returns<DepositRow[]>(),
		supabase
			.from("deposit_receiving_wallets")
			.select("id,asset,network,label,address,is_active,updated_at")
			.order("updated_at", { ascending: false })
			.returns<ReceivingWalletRow[]>(),
	]);

	if (summaryResult.error) throw new Error(summaryResult.error.message);
	if (depositsResult.error) throw new Error(depositsResult.error.message);
	if (walletsResult.error) throw new Error(walletsResult.error.message);

	const summary = summaryResult.data;

	return {
		summary: {
			averageCreditTime: `${Math.round(
				toNumber(summary?.average_credit_minutes),
			)} min`,
			confirmingCount: toNumber(summary?.confirming_count),
			confirmingUsd: toNumber(summary?.confirming_usd),
			creditedTodayUsd: toNumber(summary?.credited_today_usd),
			needsReviewCount: toNumber(summary?.needs_review_count),
			needsReviewUsd: toNumber(summary?.needs_review_usd),
			pendingCount: toNumber(summary?.pending_count),
			pendingUsd: toNumber(summary?.pending_usd),
			rejectedTodayUsd: toNumber(summary?.rejected_today_usd),
		},
		receivingWallets: (walletsResult.data ?? []).map((wallet) => ({
			address: wallet.address,
			asset: mapWalletAsset(wallet.asset),
			id: wallet.id,
			isActive: wallet.is_active,
			label: wallet.label,
			network: wallet.network,
			updatedAt: wallet.updated_at,
		})),
		deposits: (depositsResult.data ?? []).map((deposit) => ({
			amount: toNumber(deposit.amount),
			amountUsd: toNumber(deposit.amount_usd),
			assetSymbol: deposit.asset_symbol,
			confirmations: deposit.confirmations,
			confirmationsRequired: deposit.confirmations_required,
			createdAt: deposit.created_at,
			id: deposit.id,
			internalNotes: mapInternalNotes(deposit.internal_notes),
			network: deposit.network,
			reference: deposit.reference,
			risk: mapRisk(deposit.risk),
			riskNotes: deposit.risk_notes ?? [],
			senderAddress: deposit.sender_address ?? undefined,
			status: mapStatus(deposit.status),
			timeline: mapTimeline(deposit.timeline),
			txHash: deposit.tx_hash ?? undefined,
			userEmail: deposit.user_email ?? "",
			userName: deposit.user_name ?? "Unknown user",
			walletAddress: deposit.wallet_address ?? undefined,
		})),
		rules: [
			"Credit crypto deposits only after the required confirmation threshold.",
			"Only credit deposits received at an active receiving wallet.",
			"Reject duplicate transaction hashes or unsupported wallet networks.",
			"Escalate high-risk deposits before crediting balances.",
		],
	};
}
