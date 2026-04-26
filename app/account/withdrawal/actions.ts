"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

type ActionResult =
	| { ok: true; reference: string }
	| { ok: false; error: string };

type CreateWithdrawalInput = {
	addressId: string;
	amount: number;
	amountUsd: number;
	feeCrypto: number;
	feeUsd: number;
	rateUsd: number;
};

type CreatedWithdrawalRow = {
	id: string;
	reference: string;
};

export async function createWithdrawal(
	input: CreateWithdrawalInput,
): Promise<ActionResult> {
	if (!input.addressId) {
		return { ok: false, error: "Choose a saved withdrawal address." };
	}

	if (!Number.isFinite(input.amount) || input.amount <= 0) {
		return { ok: false, error: "Enter a valid withdrawal amount." };
	}

	if (!Number.isFinite(input.amountUsd) || input.amountUsd <= 0) {
		return { ok: false, error: "Enter a valid USD amount." };
	}

	if (!Number.isFinite(input.rateUsd) || input.rateUsd <= 0) {
		return {
			ok: false,
			error: "Exchange rate unavailable. Refresh and retry.",
		};
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to request a withdrawal." };
	}

	const { data, error } = await supabase
		.rpc("create_crypto_withdrawal_request", {
			destination_address_id: input.addressId,
			amount: input.amount,
			amount_usd: input.amountUsd,
			rate_usd: input.rateUsd,
			fee: input.feeCrypto,
			fee_usd: input.feeUsd,
		})
		.single<CreatedWithdrawalRow>();

	if (error || !data) {
		return {
			ok: false,
			error: error?.message ?? "Could not submit the withdrawal.",
		};
	}

	revalidatePath("/account/withdrawal");
	revalidatePath("/account/transactions");
	return { ok: true, reference: data.reference };
}
