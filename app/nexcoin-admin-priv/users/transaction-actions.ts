"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
	type AdminUserTransaction,
	getAdminUserTransactions,
} from "@/lib/admin-user-transactions";
import { createClient } from "@/utils/supabase/server";

type ActionResult<T = undefined> =
	| { ok: true; data?: T }
	| { ok: false; error: string };

type SourceType = "crypto_deposit" | "crypto_withdrawal";

export async function fetchUserTransactions(
	userId: string,
): Promise<ActionResult<AdminUserTransaction[]>> {
	if (!userId) {
		return { ok: false, error: "Missing user." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to manage transactions." };
	}

	try {
		const transactions = await getAdminUserTransactions(supabase, userId);
		return { ok: true, data: transactions };
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to load transactions.";
		return { ok: false, error: message };
	}
}

export async function revertUserTransaction(
	sourceType: SourceType,
	sourceId: string,
	newStatus: string,
	reason?: string,
): Promise<ActionResult> {
	if (!sourceId) {
		return { ok: false, error: "Missing transaction." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to manage transactions." };
	}

	const { error } = await supabase.rpc("admin_revert_user_transaction", {
		p_source_type: sourceType,
		p_source_id: sourceId,
		p_new_status: newStatus,
		p_reason: reason?.trim() || null,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/nexcoin-admin-priv");
	revalidatePath("/nexcoin-admin-priv/users");
	revalidatePath("/nexcoin-admin-priv/transactions");
	return { ok: true };
}

export async function adjustUserTransaction(
	sourceType: SourceType,
	sourceId: string,
	newAmount: number,
	newAmountUsd: number,
	reason?: string,
): Promise<ActionResult> {
	if (!sourceId) {
		return { ok: false, error: "Missing transaction." };
	}

	if (!Number.isFinite(newAmount) || newAmount <= 0) {
		return { ok: false, error: "Amount must be greater than zero." };
	}

	if (!Number.isFinite(newAmountUsd) || newAmountUsd <= 0) {
		return { ok: false, error: "USD amount must be greater than zero." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to manage transactions." };
	}

	const { error } = await supabase.rpc("admin_adjust_user_transaction", {
		p_source_type: sourceType,
		p_source_id: sourceId,
		p_new_amount: newAmount,
		p_new_amount_usd: newAmountUsd,
		p_reason: reason?.trim() || null,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/nexcoin-admin-priv");
	revalidatePath("/nexcoin-admin-priv/users");
	revalidatePath("/nexcoin-admin-priv/transactions");
	return { ok: true };
}
type InvestmentPlanOption = {
	id: string;
	name: string;
	returnRatePercent: number;
	durationHours: number;
	status: string;
};

export type AssetNetworkOption = {
	asset: string;
	network: string;
};

export async function fetchAssetNetworkOptions(): Promise<
	ActionResult<AssetNetworkOption[]>
> {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to manage transactions." };
	}

	const { data, error } = await supabase
		.from("deposit_receiving_wallets")
		.select("asset, network")
		.eq("is_active", true)
		.is("archived_at", null);

	if (error) {
		return { ok: false, error: error.message };
	}

	const seen = new Set<string>();
	const options: AssetNetworkOption[] = [];
	for (const row of (data ?? []) as { asset: string; network: string }[]) {
		const key = `${row.asset}::${row.network}`;
		if (seen.has(key)) continue;
		seen.add(key);
		options.push({ asset: row.asset, network: row.network });
	}

	options.sort((a, b) =>
		a.asset === b.asset
			? a.network.localeCompare(b.network)
			: a.asset.localeCompare(b.asset),
	);

	return { ok: true, data: options };
}

export async function fetchAvailableInvestmentPlans(): Promise<
	ActionResult<InvestmentPlanOption[]>
> {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to manage investments." };
	}

	try {
		const { data, error } = await supabase
			.from("investment_plans")
			.select("id, name, return_rate_percent, duration_hours, status")
			.in("status", ["active", "paused", "draft"])
			.order("name");

		if (error) {
			return { ok: false, error: error.message };
		}

		const plans: InvestmentPlanOption[] = (data ?? []).map((plan: any) => ({
			durationHours: plan.duration_hours,
			id: plan.id,
			name: plan.name,
			returnRatePercent: plan.return_rate_percent,
			status: plan.status,
		}));

		return { ok: true, data: plans };
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to fetch plans.";
		return { ok: false, error: message };
	}
}
export async function addManualTransaction(
	userId: string,
	type: "deposit" | "withdrawal",
	amount: number,
	amountUsd: number,
	assetSymbol: string,
	method: string,
	network: string,
	walletAddress?: string,
	txHash?: string,
	createdAt?: string,
	status?: string,
	feeUsd?: number,
	reason?: string,
): Promise<ActionResult<string>> {
	if (!userId) {
		return { ok: false, error: "Missing user." };
	}

	if (!["deposit", "withdrawal"].includes(type)) {
		return { ok: false, error: "Type must be deposit or withdrawal." };
	}

	if (!Number.isFinite(amount) || amount <= 0) {
		return { ok: false, error: "Amount must be greater than zero." };
	}

	if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
		return { ok: false, error: "USD amount must be greater than zero." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to manage transactions." };
	}

	try {
		const { data, error } = await supabase.rpc("admin_add_manual_transaction", {
			p_user_id: userId,
			p_type: type,
			p_amount: amount,
			p_amount_usd: amountUsd,
			p_asset_symbol: assetSymbol,
			p_method: method,
			p_network: network,
			p_wallet_address: walletAddress || null,
			p_tx_hash: txHash || null,
			p_created_at: createdAt ? new Date(createdAt).toISOString() : undefined,
			p_status: status || "credited",
			p_fee_usd: feeUsd || 0,
			p_reason: reason?.trim() || null,
		});

		if (error) {
			return { ok: false, error: error.message };
		}

		revalidatePath("/nexcoin-admin-priv");
		revalidatePath("/nexcoin-admin-priv/users");
		revalidatePath("/nexcoin-admin-priv/transactions");
		return { ok: true, data: data as string };
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to add manual transaction.";
		return { ok: false, error: message };
	}
}

export async function addManualInvestment(
	userId: string,
	planId: string,
	amountUsd: number,
	projectedProfitUsd: number,
	profitCreditedUsd?: number,
	status?: string,
	startAt?: string,
	endAt?: string,
	reason?: string,
): Promise<ActionResult<string>> {
	if (!userId) {
		return { ok: false, error: "Missing user." };
	}

	if (!planId) {
		return { ok: false, error: "Missing plan." };
	}

	if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
		return { ok: false, error: "Investment amount must be greater than zero." };
	}

	if (!Number.isFinite(projectedProfitUsd) || projectedProfitUsd < 0) {
		return { ok: false, error: "Projected profit must be non-negative." };
	}

	const pCreditedUsd = profitCreditedUsd ?? 0;
	if (!Number.isFinite(pCreditedUsd) || pCreditedUsd < 0 || pCreditedUsd > projectedProfitUsd) {
		return { ok: false, error: "Profit credited must be between 0 and projected profit." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to manage investments." };
	}

	try {
		const { data, error } = await supabase.rpc("admin_add_manual_investment", {
			p_user_id: userId,
			p_plan_id: planId,
			p_amount_usd: amountUsd,
			p_projected_profit_usd: projectedProfitUsd,
			p_profit_credited_usd: pCreditedUsd,
			p_status: status || "active",
			p_start_at: startAt ? new Date(startAt).toISOString() : undefined,
			p_end_at: endAt ? new Date(endAt).toISOString() : undefined,
			p_reason: reason?.trim() || null,
		});

		if (error) {
			return { ok: false, error: error.message };
		}

		revalidatePath("/nexcoin-admin-priv");
		revalidatePath("/nexcoin-admin-priv/users");
		revalidatePath("/nexcoin-admin-priv/investment-plans");
		return { ok: true, data: data as string };
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to add manual investment.";
		return { ok: false, error: message };
	}
}
