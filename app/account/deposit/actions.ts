"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

type SubmitDepositInput = {
	walletId: string;
	amount: number;
	amountUsd: number;
	rateUsd: number;
	txHash: string;
	senderAddress?: string;
};

type SubmitDepositResult =
	| { ok: true; reference: string }
	| { ok: false; error: string };

type CreateDepositRow = {
	id: string;
	reference: string;
};

export async function submitDeposit(
	input: SubmitDepositInput,
): Promise<SubmitDepositResult> {
	const { walletId, amount, amountUsd, rateUsd } = input;
	const txHash = input.txHash.trim();
	const senderAddress = input.senderAddress?.trim() ?? "";

	if (!walletId) {
		return { ok: false, error: "Select a crypto asset before submitting." };
	}

	if (!Number.isFinite(amount) || amount <= 0) {
		return { ok: false, error: "Enter a valid deposit amount." };
	}

	if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
		return { ok: false, error: "Enter a valid USD amount." };
	}

	if (!Number.isFinite(rateUsd) || rateUsd <= 0) {
		return { ok: false, error: "Exchange rate unavailable. Refresh and retry." };
	}

	if (txHash.length < 10) {
		return {
			ok: false,
			error: "Paste the transaction hash from your wallet or block explorer.",
		};
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to submit a deposit." };
	}

	const { data: created, error: createError } = await supabase
		.rpc("create_crypto_deposit_request", {
			wallet_id: walletId,
			amount,
			amount_usd: amountUsd,
			rate_usd: rateUsd,
		})
		.single<CreateDepositRow>();

	if (createError || !created) {
		return {
			ok: false,
			error: createError?.message ?? "Could not open the deposit request.",
		};
	}

	const { error: markError } = await supabase.rpc("user_mark_deposit_sent", {
		p_deposit_id: created.id,
		p_tx_hash: txHash,
		p_sender_address: senderAddress || null,
	});

	if (markError) {
		return {
			ok: false,
			error: markError.message,
		};
	}

	revalidatePath("/account/deposit");

	return { ok: true, reference: created.reference };
}
