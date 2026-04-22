export type NotificationCategory =
	| "account"
	| "investment"
	| "security"
	| "support"
	| "transaction";

export type NotificationPriority = "high" | "normal";

export type NotificationChannel = "Email" | "In-app" | "SMS";

export type NotificationItem = {
	actionHref?: string;
	actionLabel?: string;
	body: string;
	category: NotificationCategory;
	channels: NotificationChannel[];
	createdAt: string;
	id: string;
	isRead: boolean;
	priority: NotificationPriority;
	title: string;
};

export type NotificationPreference = {
	description: string;
	email: boolean;
	id: string;
	inApp: boolean;
	label: string;
	sms: boolean;
};

export type NotificationsData = {
	items: NotificationItem[];
	preferences: NotificationPreference[];
};

export const notificationCategoryLabels: Record<NotificationCategory, string> = {
	account: "Account",
	investment: "Investment",
	security: "Security",
	support: "Support",
	transaction: "Transaction",
};

export const notificationsData: NotificationsData = {
	items: [
		{
			actionHref: "/account/withdrawal",
			actionLabel: "Review withdrawal",
			body: "Your Bitcoin withdrawal request is pending AML review. No action is required unless support asks for confirmation in your ticket.",
			category: "transaction",
			channels: ["Email", "In-app"],
			createdAt: "2026-04-20T14:06:00Z",
			id: "ntf-1009",
			isRead: false,
			priority: "high",
			title: "Withdrawal request under review",
		},
		{
			actionHref: "/account/wallets",
			actionLabel: "Open wallet",
			body: "A 250 USDT TRC-20 deposit is waiting for network confirmations before it can be credited to your available balance.",
			category: "transaction",
			channels: ["In-app"],
			createdAt: "2026-04-20T12:16:00Z",
			id: "ntf-1008",
			isRead: false,
			priority: "normal",
			title: "USDT deposit confirming",
		},
		{
			actionHref: "/account/portfolio",
			actionLabel: "View portfolio",
			body: "Growth Plan credited 42.18 USDT in daily profit. The credit is reflected in your portfolio and transaction history.",
			category: "investment",
			channels: ["Email", "In-app"],
			createdAt: "2026-04-20T08:30:00Z",
			id: "ntf-1007",
			isRead: false,
			priority: "normal",
			title: "Daily profit credited",
		},
		{
			actionHref: "/account/security",
			actionLabel: "Check security",
			body: "A new sign-in was detected from Chrome on macOS. If this was not you, update your password and contact support.",
			category: "security",
			channels: ["Email", "In-app", "SMS"],
			createdAt: "2026-04-19T21:48:00Z",
			id: "ntf-1006",
			isRead: false,
			priority: "high",
			title: "New account sign-in",
		},
		{
			actionHref: "/account/support/NX-2041",
			actionLabel: "Open ticket",
			body: "Support replied to your withdrawal review ticket and asked you to confirm the destination wallet address.",
			category: "support",
			channels: ["Email", "In-app"],
			createdAt: "2026-04-19T16:25:00Z",
			id: "ntf-1005",
			isRead: true,
			priority: "normal",
			title: "Support replied to your ticket",
		},
		{
			actionHref: "/account/profile",
			actionLabel: "Review profile",
			body: "Your account profile details were saved successfully. Keep your contact information current for recovery and verification.",
			category: "account",
			channels: ["In-app"],
			createdAt: "2026-04-18T10:12:00Z",
			id: "ntf-1004",
			isRead: true,
			priority: "normal",
			title: "Profile updated",
		},
		{
			actionHref: "/account/plans",
			actionLabel: "View plans",
			body: "Your Advanced Plan is 62% through its current cycle. Expected maturity remains Apr 24, 2026.",
			category: "investment",
			channels: ["In-app"],
			createdAt: "2026-04-17T09:00:00Z",
			id: "ntf-1003",
			isRead: true,
			priority: "normal",
			title: "Investment cycle progress",
		},
		{
			actionHref: "/account/referrals",
			actionLabel: "View referrals",
			body: "A 75 USDT referral credit was added after Lynn K. funded an account through your invite link.",
			category: "account",
			channels: ["Email", "In-app"],
			createdAt: "2026-04-14T12:08:00Z",
			id: "ntf-1002",
			isRead: true,
			priority: "normal",
			title: "Referral bonus credited",
		},
		{
			actionHref: "/account/transactions",
			actionLabel: "View transaction",
			body: "A Bitcoin deposit of 0.05 BTC was credited after 3 network confirmations.",
			category: "transaction",
			channels: ["Email", "In-app"],
			createdAt: "2026-04-10T10:16:00Z",
			id: "ntf-1001",
			isRead: true,
			priority: "normal",
			title: "Bitcoin deposit credited",
		},
	],
	preferences: [
		{
			description: "Deposits, withdrawals, fees, and wallet confirmation updates.",
			email: true,
			id: "transactions",
			inApp: true,
			label: "Transaction updates",
			sms: true,
		},
		{
			description: "Profit credits, plan maturity, active plan progress, and reinvestment reminders.",
			email: true,
			id: "investments",
			inApp: true,
			label: "Investment updates",
			sms: false,
		},
		{
			description: "New sign-ins, password changes, verification requests, and sensitive account events.",
			email: true,
			id: "security",
			inApp: true,
			label: "Security alerts",
			sms: true,
		},
		{
			description: "Replies from support, ticket status changes, and document review messages.",
			email: true,
			id: "support",
			inApp: true,
			label: "Support messages",
			sms: false,
		},
	],
};
