"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function claimReferralEarning(
	earningId: string,
): Promise<ActionResult> {
	if (!earningId) {
		return { ok: false, error: "Missing earning." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to claim earnings." };
	}

	const { error } = await supabase.rpc("user_claim_pending_referral_earning", {
		p_earning_id: earningId,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/account/referrals");
	revalidatePath("/account/transactions");
	return { ok: true };
}
