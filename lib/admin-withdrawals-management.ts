export type AdminWithdrawalStatus =
	| "AML Review"
	| "Approved"
	| "Completed"
	| "Pending"
	| "Processing"
	| "Rejected";

export type AdminWithdrawalRisk = "High" | "Low" | "Medium";

export type AdminWithdrawalKycStatus =
	| "Approved"
	| "Pending"
	| "Rejected"
	| "Unverified";

export type AdminWithdrawalCheckStatus = "Failed" | "Passed" | "Warning";

export type AdminWithdrawalCheck = {
	label: string;
	status: AdminWithdrawalCheckStatus;
};

export type AdminWithdrawalTimelineItem = {
	createdAt: string;
	id: string;
	label: string;
};

export type AdminWithdrawal = {
	accountStatus: "Active" | "Flagged" | "Suspended";
	amount: number;
	amountUsd: number;
	assetSymbol: string;
	checks: AdminWithdrawalCheck[];
	createdAt: string;
	destinationAddress: string;
	destinationLabel: string;
	fee: number;
	id: string;
	internalNotes: string[];
	kycStatus: AdminWithdrawalKycStatus;
	netAmount: number;
	network: string;
	reference: string;
	risk: AdminWithdrawalRisk;
	securityNotes: string[];
	status: AdminWithdrawalStatus;
	timeline: AdminWithdrawalTimelineItem[];
	txHash?: string;
	userEmail: string;
	userName: string;
};

export type AdminWithdrawalsManagementData = {
	rules: string[];
	summary: {
		amlReviewCount: number;
		amlReviewUsd: number;
		averageProcessingTime: string;
		completedTodayUsd: number;
		pendingCount: number;
		pendingUsd: number;
		processingCount: number;
		processingUsd: number;
		rejectedTodayUsd: number;
	};
	withdrawals: AdminWithdrawal[];
};

export const adminWithdrawalsManagementData: AdminWithdrawalsManagementData = {
	summary: {
		amlReviewCount: 8,
		amlReviewUsd: 21840,
		averageProcessingTime: "13.2 h",
		completedTodayUsd: 62400,
		pendingCount: 17,
		pendingUsd: 48250,
		processingCount: 6,
		processingUsd: 18910,
		rejectedTodayUsd: 3200,
	},
	withdrawals: [
		{
			accountStatus: "Flagged",
			amount: 0.018,
			amountUsd: 1166.77,
			assetSymbol: "BTC",
			checks: [
				{ label: "KYC approved", status: "Warning" },
				{ label: "2FA confirmed", status: "Passed" },
				{ label: "Destination address saved", status: "Passed" },
				{ label: "Recent password change", status: "Passed" },
				{ label: "Deposit method alignment", status: "Passed" },
			],
			createdAt: "2026-04-20T14:02:00Z",
			destinationAddress: "bc1qxyz2r9xk7t8h4ydp3qmn6v8tw2l9j5s7d3f0wlh",
			destinationLabel: "Ledger Hardware",
			fee: 0.0005,
			id: "withdrawal-1041",
			internalNotes: ["Hold until KYC document update is reviewed."],
			kycStatus: "Pending",
			netAmount: 0.0175,
			network: "Bitcoin",
			reference: "WD-1041",
			risk: "Medium",
			securityNotes: ["Account is flagged because KYC is pending."],
			status: "Pending",
			timeline: [
				{ createdAt: "2026-04-20T14:02:00Z", id: "tl-1", label: "Withdrawal requested" },
				{ createdAt: "2026-04-20T14:03:00Z", id: "tl-2", label: "2FA confirmed" },
				{ createdAt: "2026-04-20T14:08:00Z", id: "tl-3", label: "AML review started" },
			],
			userEmail: "alex.morgan@example.com",
			userName: "Alex Morgan",
		},
		{
			accountStatus: "Active",
			amount: 0.42,
			amountUsd: 1335.71,
			assetSymbol: "ETH",
			checks: [
				{ label: "KYC approved", status: "Passed" },
				{ label: "2FA confirmed", status: "Passed" },
				{ label: "Destination address saved", status: "Passed" },
				{ label: "Amount threshold", status: "Passed" },
			],
			createdAt: "2026-04-18T09:45:00Z",
			destinationAddress: "0xa1b2c3d4e5f67890abcdef1234567890abcd9f3d",
			destinationLabel: "Main ETH Wallet",
			fee: 0.003,
			id: "withdrawal-1039",
			internalNotes: ["Completed automatically after admin approval."],
			kycStatus: "Approved",
			netAmount: 0.417,
			network: "Ethereum (ERC-20)",
			reference: "WD-1039",
			risk: "Low",
			securityNotes: ["No risk flags."],
			status: "Completed",
			timeline: [
				{ createdAt: "2026-04-18T09:45:00Z", id: "tl-4", label: "Withdrawal requested" },
				{ createdAt: "2026-04-18T10:02:00Z", id: "tl-5", label: "Approved by admin" },
				{ createdAt: "2026-04-18T10:20:00Z", id: "tl-6", label: "Completed on-chain" },
			],
			txHash: "0x7a3f9c2b1e8d4a6f5c9b0e7d3a1f2c4b8e5d6a9f",
			userEmail: "maya.chen@example.com",
			userName: "Maya Chen",
		},
		{
			accountStatus: "Flagged",
			amount: 12000,
			amountUsd: 12000,
			assetSymbol: "USDT",
			checks: [
				{ label: "KYC approved", status: "Passed" },
				{ label: "2FA confirmed", status: "Passed" },
				{ label: "New device login", status: "Warning" },
				{ label: "Amount threshold", status: "Warning" },
				{ label: "Destination address saved", status: "Passed" },
			],
			createdAt: "2026-04-22T08:20:00Z",
			destinationAddress: "TXy4NnFv8qK2j9Rp7sL3uD6gH1mA5zXp4aBc",
			destinationLabel: "Binance Exchange",
			fee: 1,
			id: "withdrawal-1045",
			internalNotes: ["Large withdrawal after new device sign-in. Awaiting support confirmation."],
			kycStatus: "Approved",
			netAmount: 11999,
			network: "Tron (TRC-20)",
			reference: "WD-1045",
			risk: "High",
			securityNotes: ["New device sign-in detected within 24 hours.", "Amount exceeds manual-review threshold."],
			status: "AML Review",
			timeline: [
				{ createdAt: "2026-04-22T08:20:00Z", id: "tl-7", label: "Withdrawal requested" },
				{ createdAt: "2026-04-22T08:25:00Z", id: "tl-8", label: "AML hold applied" },
			],
			userEmail: "victor.stone@example.com",
			userName: "Victor Stone",
		},
		{
			accountStatus: "Active",
			amount: 320,
			amountUsd: 320,
			assetSymbol: "USDT",
			checks: [
				{ label: "KYC approved", status: "Passed" },
				{ label: "2FA confirmed", status: "Passed" },
				{ label: "Destination address saved", status: "Passed" },
			],
			createdAt: "2026-04-15T17:18:00Z",
			destinationAddress: "TXy4NnFv8qK2j9Rp7sL3uD6gH1mA5zXp4aBc",
			destinationLabel: "Binance Exchange",
			fee: 1,
			id: "withdrawal-1033",
			internalNotes: ["Payout is being batched with other TRC-20 requests."],
			kycStatus: "Approved",
			netAmount: 319,
			network: "Tron (TRC-20)",
			reference: "WD-1033",
			risk: "Low",
			securityNotes: ["No risk flags."],
			status: "Processing",
			timeline: [
				{ createdAt: "2026-04-15T17:18:00Z", id: "tl-9", label: "Withdrawal requested" },
				{ createdAt: "2026-04-15T18:00:00Z", id: "tl-10", label: "Approved by admin" },
				{ createdAt: "2026-04-15T18:15:00Z", id: "tl-11", label: "Payout processing" },
			],
			userEmail: "daniel.brooks@example.com",
			userName: "Daniel Brooks",
		},
	],
	rules: [
		"Approve withdrawals only after required KYC, 2FA, and destination checks pass.",
		"Hold requests with recent password changes, new device logins, or large amount thresholds.",
		"Reject withdrawals with failed identity checks or unsupported destination networks.",
		"Record internal notes before approving high-risk payouts.",
	],
};
