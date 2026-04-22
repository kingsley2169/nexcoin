export type AdminMetricTone = "danger" | "neutral" | "positive" | "warning";

export type AdminQueuePriority = "High" | "Normal" | "Urgent";

export type AdminActivityStatus =
	| "Approved"
	| "Completed"
	| "Flagged"
	| "Pending"
	| "Resolved";

export type AdminMetric = {
	hint: string;
	label: string;
	tone: AdminMetricTone;
	value: string;
};

export type AdminQueueItem = {
	age: string;
	amount?: string;
	href: string;
	id: string;
	priority: AdminQueuePriority;
	reference: string;
	title: string;
	type: string;
	user: string;
};

export type AdminFinancialSnapshot = {
	breakdown: {
		count: number;
		label: string;
		value: string;
	}[];
	footer: string;
	title: string;
	total: string;
};

export type AdminInvestmentOverview = {
	activePlans: string;
	maturingToday: number;
	mostPopularPlan: string;
	profitCreditedToday: string;
	totalInvested: string;
};

export type AdminRiskAlert = {
	description: string;
	href: string;
	id: string;
	severity: AdminQueuePriority;
	title: string;
};

export type AdminActivity = {
	createdAt: string;
	id: string;
	reference: string;
	status: AdminActivityStatus;
	title: string;
	user: string;
};

export type AdminDashboardData = {
	activity: AdminActivity[];
	financialSnapshots: AdminFinancialSnapshot[];
	investmentOverview: AdminInvestmentOverview;
	metrics: AdminMetric[];
	queue: AdminQueueItem[];
	riskAlerts: AdminRiskAlert[];
	shiftNotes: string[];
};

export const adminDashboardData: AdminDashboardData = {
	metrics: [
		{
			hint: "+128 this month",
			label: "Total users",
			tone: "positive",
			value: "2,846",
		},
		{
			hint: "1,932 fully verified",
			label: "Verified users",
			tone: "positive",
			value: "67.9%",
		},
		{
			hint: "9 requests pending",
			label: "Pending deposits",
			tone: "warning",
			value: "$18,420",
		},
		{
			hint: "17 requests pending",
			label: "Pending withdrawals",
			tone: "danger",
			value: "$48,250",
		},
		{
			hint: "37 plans mature today",
			label: "Active investments",
			tone: "neutral",
			value: "$4.8M",
		},
		{
			hint: "6 high priority",
			label: "Open support tickets",
			tone: "warning",
			value: "23",
		},
	],
	queue: [
		{
			age: "18h",
			amount: "$1,166.77",
			href: "/nexcoin-admin-priv/withdrawals-management",
			id: "queue-1",
			priority: "Urgent",
			reference: "WD-1041",
			title: "Withdrawal review",
			type: "Withdrawal",
			user: "Alex Morgan",
		},
		{
			age: "14h",
			amount: "$250.00",
			href: "/nexcoin-admin-priv/deposits-management",
			id: "queue-2",
			priority: "High",
			reference: "DP-2294",
			title: "TRC-20 deposit confirming",
			type: "Deposit",
			user: "Maya Chen",
		},
		{
			age: "11h",
			href: "/neocoin-admin-priv/kyc",
			id: "queue-3",
			priority: "High",
			reference: "KYC-4821",
			title: "Additional ID document needed",
			type: "KYC",
			user: "Alex Morgan",
		},
		{
			age: "6h",
			href: "/neocoin-admin-priv/support",
			id: "queue-4",
			priority: "Normal",
			reference: "NX-2041",
			title: "Support reply waiting",
			type: "Support",
			user: "Daniel Brooks",
		},
	],
	financialSnapshots: [
		{
			breakdown: [
				{ count: 4, label: "Crypto confirming", value: "$9,250" },
				{ count: 3, label: "Manual payment review", value: "$6,400" },
				{ count: 2, label: "Rejected today", value: "$2,770" },
			],
			footer: "Average credit time: 38 minutes",
			title: "Deposit operations",
			total: "$18,420",
		},
		{
			breakdown: [
				{ count: 8, label: "AML review", value: "$21,840" },
				{ count: 6, label: "Processing payout", value: "$18,910" },
				{ count: 3, label: "Address confirmation", value: "$7,500" },
			],
			footer: "Average processing time: 13.2 hours",
			title: "Withdrawal operations",
			total: "$48,250",
		},
	],
	investmentOverview: {
		activePlans: "1,240",
		maturingToday: 37,
		mostPopularPlan: "Advanced Plan",
		profitCreditedToday: "$42,180",
		totalInvested: "$4.8M",
	},
	riskAlerts: [
		{
			description: "Three withdrawals were requested within 20 minutes after a password change.",
			href: "/nexcoin-admin-priv/withdrawals-management",
			id: "risk-1",
			severity: "Urgent",
			title: "Withdrawal cluster after security change",
		},
		{
			description: "Seven KYC resubmissions have unclear document backs and need staff review.",
			href: "/neocoin-admin-priv/kyc",
			id: "risk-2",
			severity: "High",
			title: "KYC resubmission backlog",
		},
		{
			description: "Manual PayPal payment proofs are waiting longer than the target review window.",
			href: "/nexcoin-admin-priv/deposits-management",
			id: "risk-3",
			severity: "Normal",
			title: "Manual deposit review delay",
		},
	],
	activity: [
		{
			createdAt: "2026-04-22T09:48:00Z",
			id: "activity-1",
			reference: "DP-2301",
			status: "Pending",
			title: "New Bitcoin deposit opened",
			user: "Lynn Foster",
		},
		{
			createdAt: "2026-04-22T09:20:00Z",
			id: "activity-2",
			reference: "KYC-4818",
			status: "Approved",
			title: "KYC approved",
			user: "Marcus Allen",
		},
		{
			createdAt: "2026-04-22T08:55:00Z",
			id: "activity-3",
			reference: "WD-1040",
			status: "Completed",
			title: "Withdrawal processed",
			user: "Grace Lee",
		},
		{
			createdAt: "2026-04-22T08:10:00Z",
			id: "activity-4",
			reference: "SEC-332",
			status: "Flagged",
			title: "New device sign-in flagged",
			user: "Victor Stone",
		},
		{
			createdAt: "2026-04-21T22:36:00Z",
			id: "activity-5",
			reference: "NX-2039",
			status: "Resolved",
			title: "Support ticket resolved",
			user: "Maya Chen",
		},
	],
	shiftNotes: [
		"4 manual deposits are waiting for payment proof review.",
		"3 withdrawals are held for AML review over 12 hours.",
		"KYC queue average age is 7 hours.",
		"Two support tickets mention delayed BTC deposits.",
	],
};
