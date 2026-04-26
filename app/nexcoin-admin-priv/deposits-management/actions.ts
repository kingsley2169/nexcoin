"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

type DepositStatusInput = {
	depositId: string;
	reason?: string;
	status: "confirming" | "credited" | "needs_review" | "pending" | "rejected";
};

type ReceivingWalletAsset = "btc" | "eth" | "usdt";

type CreateReceivingWalletInput = {
	address: string;
	asset: ReceivingWalletAsset;
	label: string;
	network: string;
};

export async function updateDepositStatus(
	input: DepositStatusInput,
): Promise<ActionResult> {
	if (!input.depositId) {
		return { ok: false, error: "Missing deposit." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to update deposits." };
	}

	const { error } = await supabase.rpc("admin_update_crypto_deposit_status", {
		deposit_id: input.depositId,
		new_status: input.status,
		reason: input.reason?.trim() || null,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/nexcoin-admin-priv");
	revalidatePath("/nexcoin-admin-priv/deposits-management");
	return { ok: true };
}

export async function createReceivingWallet(
	input: CreateReceivingWalletInput,
): Promise<ActionResult> {
	const label = input.label.trim();
	const network = input.network.trim();
	const address = input.address.trim();

	if (!input.asset) {
		return { ok: false, error: "Select a supported asset." };
	}

	if (label.length < 2) {
		return { ok: false, error: "Label must be at least 2 characters." };
	}

	if (network.length < 2) {
		return { ok: false, error: "Network is required." };
	}

	if (address.length < 20) {
		return { ok: false, error: "Wallet address looks too short." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to add receiving wallets." };
	}

	const { error } = await supabase.rpc("admin_create_receiving_wallet", {
		asset: input.asset,
		network,
		label,
		address,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/nexcoin-admin-priv");
	revalidatePath("/nexcoin-admin-priv/deposits-management");
	return { ok: true };
}

export async function removeReceivingWallet(
	walletId: string,
): Promise<ActionResult> {
	if (!walletId) {
		return { ok: false, error: "Missing wallet to remove." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to remove receiving wallets." };
	}

	const { error } = await supabase.rpc("admin_remove_receiving_wallet", {
		wallet_id: walletId,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/nexcoin-admin-priv");
	revalidatePath("/nexcoin-admin-priv/deposits-management");
	return { ok: true };
}

export async function setReceivingWalletActive(
	walletId: string,
	isActive: boolean,
): Promise<ActionResult> {
	if (!walletId) {
		return { ok: false, error: "Missing wallet." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to update receiving wallets." };
	}

	const { error } = await supabase.rpc("admin_update_receiving_wallet", {
		wallet_id: walletId,
		new_is_active: isActive,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/nexcoin-admin-priv");
	revalidatePath("/nexcoin-admin-priv/deposits-management");
	return { ok: true };
}

export async function addDepositNote(
	depositId: string,
	note: string,
): Promise<ActionResult> {
	if (!depositId) {
		return { ok: false, error: "Missing deposit." };
	}

	if (!note.trim()) {
		return { ok: false, error: "Enter a note before saving." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to save notes." };
	}

	const { error } = await supabase.rpc("admin_add_crypto_deposit_note", {
		deposit_id: depositId,
		note: note.trim(),
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/nexcoin-admin-priv");
	revalidatePath("/nexcoin-admin-priv/deposits-management");
	return { ok: true };
}
