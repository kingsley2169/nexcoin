export type AdminDepositStatus =
	| "Confirming"
	| "Credited"
	| "Needs Review"
	| "Pending"
	| "Rejected";

export type AdminDepositMethod = "Cash" | "Crypto" | "E-currency" | "PayPal";

export type AdminDepositRisk = "High" | "Low" | "Medium";

export type AdminDepositTimelineItem = {
	createdAt: string;
	id: string;
	label: string;
};

export type AdminDeposit = {
	amount: number;
	amountUsd: number;
	assetSymbol: string;
	confirmations: number;
	confirmationsRequired: number;
	createdAt: string;
	id: string;
	internalNotes: string[];
	method: AdminDepositMethod;
	network: string;
	paymentProofStatus: "Missing" | "Not required" | "Uploaded";
	reference: string;
	risk: AdminDepositRisk;
	riskNotes: string[];
	status: AdminDepositStatus;
	timeline: AdminDepositTimelineItem[];
	txHash?: string;
	userEmail: string;
	userName: string;
	walletAddress?: string;
};

export type AdminDepositsManagementData = {
	deposits: AdminDeposit[];
	rules: string[];
	summary: {
		averageCreditTime: string;
		confirmingCryptoCount: number;
		confirmingCryptoUsd: number;
		creditedTodayUsd: number;
		manualReviewCount: number;
		manualReviewUsd: number;
		pendingCount: number;
		pendingUsd: number;
		rejectedTodayUsd: number;
	};
};

export const adminDepositsManagementData: AdminDepositsManagementData = {
	summary: {
		averageCreditTime: "38 min",
		confirmingCryptoCount: 4,
		confirmingCryptoUsd: 9250,
		creditedTodayUsd: 58200,
		manualReviewCount: 3,
		manualReviewUsd: 6400,
		pendingCount: 9,
		pendingUsd: 18420,
		rejectedTodayUsd: 2770,
	},
	deposits: [
		{
			amount: 250,
			amountUsd: 250,
			assetSymbol: "USDT",
			confirmations: 12,
			confirmationsRequired: 20,
			createdAt: "2026-04-20T12:15:00Z",
			id: "deposit-2294",
			internalNotes: ["Waiting for final TRC-20 confirmations."],
			method: "Crypto",
			network: "TRC-20",
			paymentProofStatus: "Not required",
			reference: "DP-2294",
			risk: "Medium",
			riskNotes: ["Confirmation count is below platform threshold."],
			status: "Confirming",
			timeline: [
				{ createdAt: "2026-04-20T12:15:00Z", id: "tl-1", label: "Deposit opened" },
				{ createdAt: "2026-04-20T12:18:00Z", id: "tl-2", label: "Tx hash detected" },
				{ createdAt: "2026-04-20T13:10:00Z", id: "tl-3", label: "12 confirmations received" },
			],
			txHash: "4f8b2c1a9e7d3b5f6a2c8e4d1b9a7f3e5c2d8b6a",
			userEmail: "maya.chen@example.com",
			userName: "Maya Chen",
			walletAddress: "TXv9m6JnF4qH81sKc2Bx7RwzP5uE3aLq9Nc",
		},
		{
			amount: 0.18,
			amountUsd: 11667.69,
			assetSymbol: "BTC",
			confirmations: 3,
			confirmationsRequired: 3,
			createdAt: "2026-04-22T09:48:00Z",
			id: "deposit-2301",
			internalNotes: ["Large BTC deposit from trusted user."],
			method: "Crypto",
			network: "Bitcoin",
			paymentProofStatus: "Not required",
			reference: "DP-2301",
			risk: "Low",
			riskNotes: ["Amount and wallet match generated request."],
			status: "Pending",
			timeline: [
				{ createdAt: "2026-04-22T09:48:00Z", id: "tl-4", label: "Deposit opened" },
				{ createdAt: "2026-04-22T09:55:00Z", id: "tl-5", label: "3 confirmations received" },
			],
			txHash: "0000000000000000000a7f3c8b5e2d1f9a4c6b8e3d2f5a7c9b1e4d8f6a3c2b5d",
			userEmail: "lynn.foster@example.com",
			userName: "Lynn Foster",
			walletAddress: "bc1qnxcn92h8r6m4q7ty3f5jz0wkvnlua62rdg8f7s",
		},
		{
			amount: 3000,
			amountUsd: 3000,
			assetSymbol: "USD",
			confirmations: 0,
			confirmationsRequired: 0,
			createdAt: "2026-04-21T17:22:00Z",
			id: "deposit-2299",
			internalNotes: ["Payment screenshot attached, sender name needs match review."],
			method: "PayPal",
			network: "Manual payment",
			paymentProofStatus: "Uploaded",
			reference: "DP-2299",
			risk: "High",
			riskNotes: ["Sender name differs from Nexcoin profile.", "Manual proof requires staff verification."],
			status: "Needs Review",
			timeline: [
				{ createdAt: "2026-04-21T17:22:00Z", id: "tl-6", label: "Payment proof uploaded" },
				{ createdAt: "2026-04-21T18:05:00Z", id: "tl-7", label: "Manual review started" },
			],
			userEmail: "victor.stone@example.com",
			userName: "Victor Stone",
		},
		{
			amount: 2500,
			amountUsd: 2500,
			assetSymbol: "USDT",
			confirmations: 20,
			confirmationsRequired: 20,
			createdAt: "2026-04-17T15:18:00Z",
			id: "deposit-2287",
			internalNotes: ["Automatically credited after confirmation threshold."],
			method: "Crypto",
			network: "TRC-20",
			paymentProofStatus: "Not required",
			reference: "DP-2287",
			risk: "Low",
			riskNotes: ["No risk flags."],
			status: "Credited",
			timeline: [
				{ createdAt: "2026-04-17T15:18:00Z", id: "tl-8", label: "Deposit opened" },
				{ createdAt: "2026-04-17T16:02:00Z", id: "tl-9", label: "Deposit credited" },
			],
			txHash: "9e3c7a1b5d2f8c4e6a9b3d1f7c2e5a8b4d6f3c9e",
			userEmail: "daniel.brooks@example.com",
			userName: "Daniel Brooks",
			walletAddress: "TXv9m6JnF4qH81sKc2Bx7RwzP5uE3aLq9Nc",
		},
		{
			amount: 300,
			amountUsd: 300,
			assetSymbol: "USD",
			confirmations: 0,
			confirmationsRequired: 0,
			createdAt: "2026-04-05T18:40:00Z",
			id: "deposit-2238",
			internalNotes: ["Payment proof could not be verified."],
			method: "PayPal",
			network: "Manual payment",
			paymentProofStatus: "Missing",
			reference: "DP-2238",
			risk: "High",
			riskNotes: ["Missing proof after staff request."],
			status: "Rejected",
			timeline: [
				{ createdAt: "2026-04-05T18:40:00Z", id: "tl-10", label: "Deposit opened" },
				{ createdAt: "2026-04-06T09:15:00Z", id: "tl-11", label: "Deposit rejected" },
			],
			userEmail: "grace.lee@example.com",
			userName: "Grace Lee",
		},
	],
	rules: [
		"Credit crypto deposits only after the required confirmation threshold.",
		"Manual payment proof must match the user's account name and reference.",
		"Reject duplicate transaction hashes or unsupported wallet networks.",
		"Escalate high-risk deposits before crediting balances.",
	],
};
