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

export const referralProgram: ReferralProgram = {
	currentTierId: "tier-2",
	earnings: [
		{
			amountUsd: 75,
			createdAt: "2026-04-14T12:05:00Z",
			id: "ref-earn-1",
			reference: "TX-9036",
			sourceMaskedName: "lynn.k",
			status: "Credited",
			type: "Investment commission",
		},
		{
			amountUsd: 50,
			createdAt: "2026-04-04T11:18:00Z",
			id: "ref-earn-2",
			reference: "TX-9027",
			sourceMaskedName: "marc.j",
			status: "Credited",
			type: "Signup bonus",
		},
		{
			amountUsd: 120,
			createdAt: "2026-03-28T09:42:00Z",
			id: "ref-earn-3",
			reference: "TX-8912",
			sourceMaskedName: "priya.s",
			status: "Credited",
			type: "Investment commission",
		},
		{
			amountUsd: 32.4,
			createdAt: "2026-03-22T16:10:00Z",
			id: "ref-earn-4",
			reference: "TX-8874",
			sourceMaskedName: "priya.s",
			status: "Credited",
			type: "Profit share",
		},
		{
			amountUsd: 25,
			createdAt: "2026-03-15T08:45:00Z",
			id: "ref-earn-5",
			reference: "TX-8821",
			sourceMaskedName: "devon.r",
			status: "Credited",
			type: "Signup bonus",
		},
		{
			amountUsd: 180,
			createdAt: "2026-04-19T19:25:00Z",
			id: "ref-earn-6",
			reference: "TX-9060",
			sourceMaskedName: "lynn.k",
			status: "Pending",
			type: "Investment commission",
		},
	],
	inviteTemplates: [
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
	],
	nextTierProgress: {
		current: 7,
		target: 15,
	},
	programTermsUrl: "/legal#referrals",
	referralCode: "ALEX2169",
	referralLink: "https://nexcoin.com/signup?ref=alex2169",
	referredUsers: [
		{
			amountInvestedUsd: 4000,
			earningsUsd: 332.4,
			id: "ref-1",
			joinedAt: "2026-02-08T10:12:00Z",
			maskedEmail: "pr**ya.s@gmail.com",
			maskedName: "Priya S.",
			status: "Active investor",
		},
		{
			amountInvestedUsd: 2500,
			earningsUsd: 255,
			id: "ref-2",
			joinedAt: "2026-03-04T09:45:00Z",
			maskedEmail: "ly**n.k@proton.me",
			maskedName: "Lynn K.",
			status: "Active investor",
		},
		{
			amountInvestedUsd: 1000,
			earningsUsd: 75,
			id: "ref-3",
			joinedAt: "2026-03-28T14:22:00Z",
			maskedEmail: "ma**c.j@outlook.com",
			maskedName: "Marc J.",
			status: "Active investor",
		},
		{
			amountInvestedUsd: 0,
			earningsUsd: 25,
			id: "ref-4",
			joinedAt: "2026-03-14T08:30:00Z",
			maskedEmail: "de**n.r@yahoo.com",
			maskedName: "Devon R.",
			status: "Verified",
		},
		{
			amountInvestedUsd: 0,
			earningsUsd: 0,
			id: "ref-5",
			joinedAt: "2026-04-02T19:10:00Z",
			maskedEmail: "sa**h.t@gmail.com",
			maskedName: "Sarah T.",
			status: "Signed up",
		},
		{
			amountInvestedUsd: 0,
			earningsUsd: 0,
			id: "ref-6",
			joinedAt: "2026-04-08T11:05:00Z",
			maskedEmail: "ke**n.m@gmail.com",
			maskedName: "Kevin M.",
			status: "Signed up",
		},
		{
			amountInvestedUsd: 0,
			earningsUsd: 0,
			id: "ref-7",
			joinedAt: "2026-04-15T16:40:00Z",
			maskedEmail: "ta**a.o@icloud.com",
			maskedName: "Tara O.",
			status: "Invited",
		},
	],
	stats: {
		activeInvestors: 3,
		pendingUsd: 180,
		totalEarnedUsd: 682.4,
		totalReferred: 7,
	},
	tiers: [
		{
			commissionPercent: 5,
			id: "tier-1",
			minActiveReferrals: 0,
			name: "Starter",
			perks: [
				"5% commission on referred deposits",
				"$25 signup bonus per verified referral",
			],
		},
		{
			commissionPercent: 12,
			id: "tier-2",
			minActiveReferrals: 3,
			name: "Tier 2",
			perks: [
				"12% commission on referred investments",
				"$50 signup bonus per verified referral",
				"2% profit share on active referrals",
			],
		},
		{
			commissionPercent: 20,
			id: "tier-3",
			minActiveReferrals: 15,
			name: "Pioneer",
			perks: [
				"20% commission on referred investments",
				"$100 signup bonus per verified referral",
				"5% profit share on active referrals",
				"Early access to new investment plans",
			],
		},
	],
};
