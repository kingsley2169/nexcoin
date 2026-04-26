"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

type CreatePlanInput = {
	description?: string;
	durationHours: number;
	highlight?: boolean;
	maxDepositUsd?: number | null;
	minDepositUsd: number;
	name: string;
	returnRatePercent: number;
	risk: "balanced" | "conservative" | "high";
	tag?: string;
};

type UpdatePlanInput = {
	durationHours: number;
	id: string;
	maxDepositUsd: number | null;
	minDepositUsd: number;
	returnRatePercent: number;
};

function slugify(value: string) {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 48);
}

async function getAuthedSupabase() {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return { supabase, user: null };
	return { supabase, user };
}

function revalidateInvestmentPlanPaths() {
	revalidatePath("/nexcoin-admin-priv");
	revalidatePath("/nexcoin-admin-priv/investment-plans");
	revalidatePath("/account/plans");
	revalidatePath("/plans");
}

export async function createInvestmentPlan(
	input: CreatePlanInput,
): Promise<ActionResult> {
	const name = input.name.trim();
	const description = input.description?.trim() ?? "";
	const tag = input.tag?.trim() || null;
	const slug = slugify(name);

	if (name.length < 2) {
		return { ok: false, error: "Plan name must be at least 2 characters." };
	}

	if (!slug) {
		return { ok: false, error: "Plan name needs letters or numbers." };
	}

	if (!Number.isFinite(input.minDepositUsd) || input.minDepositUsd < 0) {
		return { ok: false, error: "Enter a valid minimum deposit." };
	}

	if (
		input.maxDepositUsd !== null &&
		input.maxDepositUsd !== undefined &&
		(!Number.isFinite(input.maxDepositUsd) ||
			input.maxDepositUsd < input.minDepositUsd)
	) {
		return {
			ok: false,
			error: "Maximum deposit must be empty or greater than the minimum.",
		};
	}

	if (
		!Number.isFinite(input.returnRatePercent) ||
		input.returnRatePercent < 0 ||
		input.returnRatePercent > 1000
	) {
		return { ok: false, error: "Enter a valid return rate." };
	}

	if (!Number.isFinite(input.durationHours) || input.durationHours <= 0) {
		return { ok: false, error: "Enter a valid plan duration in hours." };
	}

	const { supabase, user } = await getAuthedSupabase();

	if (!user) {
		return { ok: false, error: "Sign in to create investment plans." };
	}

	const { error } = await supabase.rpc("admin_create_investment_plan", {
		description,
		display_order: 0,
		duration_hours: input.durationHours,
		features: [],
		highlight: input.highlight ?? false,
		max_deposit_usd: input.maxDepositUsd ?? null,
		min_deposit_usd: input.minDepositUsd,
		name,
		return_rate_percent: input.returnRatePercent,
		risk: input.risk,
		slug,
		status: "draft",
		tag,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidateInvestmentPlanPaths();
	return { ok: true };
}

export async function updateInvestmentPlan(
	input: UpdatePlanInput,
): Promise<ActionResult> {
	if (!input.id) {
		return { ok: false, error: "Missing plan." };
	}

	if (!Number.isFinite(input.minDepositUsd) || input.minDepositUsd < 0) {
		return { ok: false, error: "Enter a valid minimum deposit." };
	}

	if (
		input.maxDepositUsd !== null &&
		(!Number.isFinite(input.maxDepositUsd) ||
			input.maxDepositUsd < input.minDepositUsd)
	) {
		return {
			ok: false,
			error: "Maximum deposit must be empty or greater than the minimum.",
		};
	}

	if (
		!Number.isFinite(input.returnRatePercent) ||
		input.returnRatePercent < 0 ||
		input.returnRatePercent > 1000
	) {
		return { ok: false, error: "Enter a valid return rate." };
	}

	if (!Number.isFinite(input.durationHours) || input.durationHours <= 0) {
		return { ok: false, error: "Enter a valid duration in hours." };
	}

	const { supabase, user } = await getAuthedSupabase();

	if (!user) {
		return { ok: false, error: "Sign in to update plans." };
	}

	const { error } = await supabase.rpc("admin_update_investment_plan", {
		clear_max_deposit: input.maxDepositUsd === null,
		new_duration_hours: input.durationHours,
		new_max_deposit_usd: input.maxDepositUsd,
		new_min_deposit_usd: input.minDepositUsd,
		new_return_rate_percent: input.returnRatePercent,
		plan_id: input.id,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidateInvestmentPlanPaths();
	return { ok: true };
}

export async function setInvestmentPlanStatus(input: {
	id: string;
	status: "active" | "draft" | "paused";
}): Promise<ActionResult> {
	if (!input.id) {
		return { ok: false, error: "Missing plan." };
	}

	const { supabase, user } = await getAuthedSupabase();

	if (!user) {
		return { ok: false, error: "Sign in to update plan status." };
	}

	const { error } = await supabase.rpc("admin_set_investment_plan_status", {
		new_status: input.status,
		plan_id: input.id,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidateInvestmentPlanPaths();
	return { ok: true };
}

export async function archiveInvestmentPlan(planId: string): Promise<ActionResult> {
	if (!planId) {
		return { ok: false, error: "Missing plan." };
	}

	const { supabase, user } = await getAuthedSupabase();

	if (!user) {
		return { ok: false, error: "Sign in to archive plans." };
	}

	const { error } = await supabase.rpc("admin_archive_investment_plan", {
		plan_id: planId,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidateInvestmentPlanPaths();
	return { ok: true };
}
