"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

type WalletAssetKey = "BTC" | "ETH" | "USDT";

type AddWalletInput = {
	asset: WalletAssetKey;
	network: string;
	label: string;
	address: string;
	makeDefault?: boolean;
};

type ActionResult = { ok: true } | { ok: false; error: string };

const ASSET_ENUM: Record<WalletAssetKey, "btc" | "eth" | "usdt"> = {
	BTC: "btc",
	ETH: "eth",
	USDT: "usdt",
};

export async function addWallet(input: AddWalletInput): Promise<ActionResult> {
	const label = input.label.trim();
	const network = input.network.trim();
	const address = input.address.trim();
	const asset = ASSET_ENUM[input.asset];

	if (!asset) {
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
		return { ok: false, error: "Sign in to save a wallet." };
	}

	const { error } = await supabase.rpc("user_add_withdrawal_address", {
		p_asset: asset,
		p_network: network,
		p_label: label,
		p_address: address,
		p_make_default: input.makeDefault ?? false,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/account/wallets");
	return { ok: true };
}

export async function removeWallet(walletId: string): Promise<ActionResult> {
	if (!walletId) {
		return { ok: false, error: "Missing wallet to remove." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to remove a wallet." };
	}

	const { error } = await supabase.rpc("user_remove_withdrawal_address", {
		p_address_id: walletId,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/account/wallets");
	return { ok: true };
}

export async function setDefaultWallet(
	walletId: string,
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
		return { ok: false, error: "Sign in to update wallets." };
	}

	const { error } = await supabase.rpc("user_set_default_withdrawal_address", {
		p_address_id: walletId,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/account/wallets");
	return { ok: true };
}
