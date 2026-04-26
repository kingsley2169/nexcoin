import type { SupabaseClient } from "@supabase/supabase-js";

export type ReferralStatus =
	| "Active investor"
	| "Invited"
	| "Signed up"
	| "Verified";

export type ReferralTier = {
	commissionPercent: number;
	id: string;
	minActiveReferrals: number;
	name: string;
	perks: string[];
};

export type ReferredUser = {
	amountInvestedUsd: number;
	earningsUsd: number;
	id: string;
	joinedAt: string;
	maskedEmail: string;
	maskedName: string;
	status: ReferralStatus;
};

export type ReferralEarningType =
	| "Investment commission"
	| "Profit share"
	| "Signup bonus";

export type ReferralEarningStatus = "Credited" | "Pending";

export type ReferralEarning = {
	amountUsd: number;
	createdAt: string;
	id: string;
	reference: string;
	sourceMaskedName: string;
	status: ReferralEarningStatus;
	type: ReferralEarningType;
};

export type InviteTemplate = {
	body: string;
	id: string;
	label: string;
};

export type ReferralProgram = {
	currentTierId: string;
	earnings: ReferralEarning[];
	inviteTemplates: InviteTemplate[];
	nextTierProgress: {
		current: number;
		target: number;
	};
	programTermsUrl: string;
	referralCode: string;
	referralLink: string;
	referredUsers: ReferredUser[];
	stats: {
		activeInvestors: number;
		pendingUsd: number;
		totalEarnedUsd: number;
		totalReferred: number;
	};
	tiers: ReferralTier[];
};

const inviteTemplates: InviteTemplate[] = [
	{
		body: "I've been using Nexcoin for crypto investing and wanted to pass along my referral link — we both earn a bonus when you sign up and fund an account. Here's the link: {{link}}",
		id: "tmpl-1",
		label: "Casual — friend",
	},
	{
		body: "Hey, if you're exploring crypto investment platforms, Nexcoin has been solid for me. Use my link for a signup bonus: {{link}}. Code: {{code}}.",
		id: "tmpl-2",
		label: "Short — social DM",
	},
	{
		body: "Happy to share: Nexcoin runs structured crypto investment plans with daily profit accrual and straightforward withdrawals. If you'd like to try it, use my referral link ({{link}}) — we both get a bonus once you fund your account.",
		id: "tmpl-3",
		label: "Longer — email",
	},
];

type SummaryRow = {
	active_investors_count: number | string;
	current_tier_id: string | null;
	pending_usd: number | string;
	next_tier_current: number | string | null;
	next_tier_target: number | string | null;
	program_terms_url: string;
	referral_code: string | null;
	referral_link: string | null;
	total_earned_usd: number | string;
	total_referred: number | string;
};

type TierRow = {
	commission_percent: number | string;
	id: string;
	min_active_referrals: number | string;
	name: string;
	perks: string[] | null;
};

type ReferredRow = {
	amount_invested_usd: number | string;
	display_status: string;
	earnings_usd: number | string;
	id: string;
	joined_at: string;
	masked_email: string;
	masked_name: string;
};

type EarningRow = {
	amount_usd: number | string;
	created_at: string;
	id: string;
	source_masked_name: string;
	status_label: string;
	transaction_reference: string;
	type_label: string;
};

function toNumber(value: number | string | null | undefined) {
	if (typeof value === "number") return value;
	if (typeof value === "string" && value.length > 0) return Number(value);
	return 0;
}

function mapStatus(value: string): ReferralStatus {
	switch (value) {
		case "Active investor":
			return "Active investor";
		case "Verified":
			return "Verified";
		case "Signed up":
			return "Signed up";
		default:
			return "Invited";
	}
}

function mapEarningType(value: string): ReferralEarningType {
	switch (value) {
		case "Profit share":
			return "Profit share";
		case "Signup bonus":
			return "Signup bonus";
		default:
			return "Investment commission";
	}
}

function mapEarningStatus(value: string): ReferralEarningStatus {
	return value === "Credited" ? "Credited" : "Pending";
}

export async function getReferralProgramData(
	supabase: SupabaseClient,
): Promise<ReferralProgram> {
	const [summaryResult, tiersResult, referredResult, earningsResult] =
		await Promise.all([
			supabase
				.from("user_referral_summary_view")
				.select(
					"referral_code,referral_link,current_tier_id,next_tier_current,next_tier_target,total_referred,active_investors_count,total_earned_usd,pending_usd,program_terms_url",
				)
				.maybeSingle<SummaryRow>(),
			supabase
				.from("referral_tiers")
				.select("id,name,min_active_referrals,commission_percent,perks")
				.order("display_order", { ascending: true })
				.returns<TierRow[]>(),
			supabase
				.from("user_referred_users_view")
				.select(
					"id,masked_name,masked_email,display_status,amount_invested_usd,earnings_usd,joined_at",
				)
				.returns<ReferredRow[]>(),
			supabase
				.from("user_referral_earnings_view")
				.select(
					"id,transaction_reference,type_label,amount_usd,status_label,source_masked_name,created_at",
				)
				.returns<EarningRow[]>(),
		]);

	if (summaryResult.error) throw new Error(summaryResult.error.message);
	if (tiersResult.error) throw new Error(tiersResult.error.message);
	if (referredResult.error) throw new Error(referredResult.error.message);
	if (earningsResult.error) throw new Error(earningsResult.error.message);

	const summary = summaryResult.data;
	const tiers: ReferralTier[] = (tiersResult.data ?? []).map((row) => ({
		commissionPercent: toNumber(row.commission_percent),
		id: row.id,
		minActiveReferrals: toNumber(row.min_active_referrals),
		name: row.name,
		perks: row.perks ?? [],
	}));

	const referredUsers: ReferredUser[] = (referredResult.data ?? []).map(
		(row) => ({
			amountInvestedUsd: toNumber(row.amount_invested_usd),
			earningsUsd: toNumber(row.earnings_usd),
			id: row.id,
			joinedAt: row.joined_at,
			maskedEmail: row.masked_email,
			maskedName: row.masked_name,
			status: mapStatus(row.display_status),
		}),
	);

	const earnings: ReferralEarning[] = (earningsResult.data ?? []).map(
		(row) => ({
			amountUsd: toNumber(row.amount_usd),
			createdAt: row.created_at,
			id: row.id,
			reference: row.transaction_reference,
			sourceMaskedName: row.source_masked_name,
			status: mapEarningStatus(row.status_label),
			type: mapEarningType(row.type_label),
		}),
	);

	const currentTierId =
		summary?.current_tier_id ?? tiers[0]?.id ?? "tier-1";

	const activeInvestors = toNumber(summary?.active_investors_count);
	const nextTierTargetRaw = summary?.next_tier_target;
	const nextTierTarget =
		nextTierTargetRaw === null || nextTierTargetRaw === undefined
			? activeInvestors
			: toNumber(nextTierTargetRaw);
	const nextTierCurrent =
		summary?.next_tier_current === null ||
		summary?.next_tier_current === undefined
			? activeInvestors
			: toNumber(summary.next_tier_current);

	return {
		currentTierId,
		earnings,
		inviteTemplates,
		nextTierProgress: {
			current: nextTierCurrent,
			target: nextTierTarget,
		},
		programTermsUrl: summary?.program_terms_url ?? "/legal#referrals",
		referralCode: summary?.referral_code ?? "",
		referralLink: summary?.referral_link ?? "",
		referredUsers,
		stats: {
			activeInvestors,
			pendingUsd: toNumber(summary?.pending_usd),
			totalEarnedUsd: toNumber(summary?.total_earned_usd),
			totalReferred: toNumber(summary?.total_referred),
		},
		tiers,
	};
}
