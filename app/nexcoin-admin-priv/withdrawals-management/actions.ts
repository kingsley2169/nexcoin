"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

type WithdrawalDbStatus =
	| "aml_review"
	| "approved"
	| "completed"
	| "pending"
	| "processing"
	| "rejected";

type UpdateWithdrawalStatusInput = {
	payoutTxHash?: string;
	reason?: string;
	status: WithdrawalDbStatus;
	withdrawalId: string;
};

export async function updateWithdrawalStatus(
	input: UpdateWithdrawalStatusInput,
): Promise<ActionResult> {
	if (!input.withdrawalId) {
		return { ok: false, error: "Missing withdrawal." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to update withdrawals." };
	}

	const { error } = await supabase.rpc("admin_update_crypto_withdrawal_status", {
		withdrawal_id: input.withdrawalId,
		new_status: input.status,
		reason: input.reason?.trim() || null,
		payout_tx_hash: input.payoutTxHash?.trim() || null,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/nexcoin-admin-priv");
	revalidatePath("/nexcoin-admin-priv/withdrawals-management");
	return { ok: true };
}

export async function addWithdrawalNote(
	withdrawalId: string,
	note: string,
): Promise<ActionResult> {
	if (!withdrawalId) {
		return { ok: false, error: "Missing withdrawal." };
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

	const { error } = await supabase.rpc("admin_add_crypto_withdrawal_note", {
		withdrawal_id: withdrawalId,
		note: note.trim(),
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/nexcoin-admin-priv");
	revalidatePath("/nexcoin-admin-priv/withdrawals-management");
	return { ok: true };
}
