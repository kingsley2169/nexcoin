"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function startInvestment(input: {
	amountUsd: number;
	planId: string;
}): Promise<ActionResult> {
	if (!input.planId) {
		return { ok: false, error: "Select a plan before continuing." };
	}

	if (!Number.isFinite(input.amountUsd) || input.amountUsd <= 0) {
		return { ok: false, error: "Enter a valid investment amount." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to start an investment." };
	}

	const { error } = await supabase.rpc("user_create_investment", {
		p_amount_usd: input.amountUsd,
		p_plan_id: input.planId,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/account");
	revalidatePath("/account/plans");
	revalidatePath("/account/portfolio");
	revalidatePath("/account/transactions");
	return { ok: true };
}

export async function cancelInvestment(
	investmentId: string,
): Promise<ActionResult> {
	if (!investmentId) {
		return { ok: false, error: "Missing investment." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to cancel an investment." };
	}

	const { error } = await supabase.rpc("user_cancel_pending_investment", {
		p_cancel_reason: null,
		p_investment_id: investmentId,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/account");
	revalidatePath("/account/plans");
	revalidatePath("/account/portfolio");
	revalidatePath("/account/transactions");
	return { ok: true };
}
