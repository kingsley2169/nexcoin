export type TicketStatus = "open" | "awaiting_reply" | "resolved" | "closed";

export type TicketCategory =
	| "account"
	| "deposits"
	| "withdrawals"
	| "kyc"
	| "plans"
	| "security"
	| "other";

export type TicketPriority = "low" | "normal" | "high";

export type TicketMessage = {
	author: "user" | "support";
	authorName: string;
	body: string;
	createdAt: string;
	id: string;
};

export type SupportTicket = {
	category: TicketCategory;
	createdAt: string;
	id: string;
	lastMessageFrom: "user" | "support";
	messageCount: number;
	messages: TicketMessage[];
	priority: TicketPriority;
	reference: string;
	status: TicketStatus;
	subject: string;
	unread: boolean;
	updatedAt: string;
};

export type SupportSummary = {
	avgResponseHours: number;
	awaitingReply: number;
	open: number;
	resolvedThisMonth: number;
};

export const ticketStatusLabels: Record<TicketStatus, string> = {
	awaiting_reply: "Awaiting reply",
	closed: "Closed",
	open: "Open",
	resolved: "Resolved",
};

export const ticketCategoryLabels: Record<TicketCategory, string> = {
	account: "Account",
	deposits: "Deposits",
	kyc: "KYC",
	other: "Other",
	plans: "Plans",
	security: "Security",
	withdrawals: "Withdrawals",
};

export const ticketPriorityLabels: Record<TicketPriority, string> = {
	high: "High",
	low: "Low",
	normal: "Normal",
};

export const supportTickets: SupportTicket[] = [
	{
		category: "withdrawals",
		createdAt: "2026-04-19T09:12:00Z",
		id: "tkt-2041",
		lastMessageFrom: "support",
		messageCount: 3,
		messages: [
			{
				author: "user",
				authorName: "You",
				body: "Hi team, my withdrawal request for $1,200 is still pending after 28 hours. Can you check the status? Reference is in my transaction history.",
				createdAt: "2026-04-19T09:12:00Z",
				id: "msg-2041-1",
			},
			{
				author: "support",
				authorName: "Nexcoin Support",
				body: "Thanks for getting in touch — I'm reviewing the withdrawal now. Can you confirm the destination wallet address you submitted so I can match it to our records?",
				createdAt: "2026-04-19T13:45:00Z",
				id: "msg-2041-2",
			},
			{
				author: "support",
				authorName: "Nexcoin Support",
				body: "We've located your withdrawal. It was held for an AML verification step. Once you confirm the destination wallet in your reply, we'll finalise the payout within the hour.",
				createdAt: "2026-04-20T18:45:00Z",
				id: "msg-2041-3",
			},
		],
		priority: "high",
		reference: "NX-2041",
		status: "awaiting_reply",
		subject: "Withdrawal stuck in pending for more than 24 hours",
		unread: true,
		updatedAt: "2026-04-20T18:45:00Z",
	},
	{
		category: "kyc",
		createdAt: "2026-04-18T14:03:00Z",
		id: "tkt-2038",
		lastMessageFrom: "support",
		messageCount: 2,
		messages: [
			{
				author: "user",
				authorName: "You",
				body: "My KYC has been in review for two days — is there anything else you need from my side to move it forward?",
				createdAt: "2026-04-18T14:03:00Z",
				id: "msg-2038-1",
			},
			{
				author: "support",
				authorName: "Nexcoin Support",
				body: "We need a clearer scan of the back of your ID document — the last upload was too dark to read. Please re-upload from the KYC verification page and reply here once done.",
				createdAt: "2026-04-19T10:22:00Z",
				id: "msg-2038-2",
			},
		],
		priority: "normal",
		reference: "NX-2038",
		status: "open",
		subject: "Additional document requested for KYC verification",
		unread: false,
		updatedAt: "2026-04-19T10:22:00Z",
	},
	{
		category: "plans",
		createdAt: "2026-04-17T07:34:00Z",
		id: "tkt-2035",
		lastMessageFrom: "support",
		messageCount: 4,
		messages: [
			{
				author: "user",
				authorName: "You",
				body: "Quick question: does the Advanced plan cap how often I can reinvest once a cycle matures?",
				createdAt: "2026-04-17T07:34:00Z",
				id: "msg-2035-1",
			},
			{
				author: "support",
				authorName: "Nexcoin Support",
				body: "The Advanced plan has no standard reinvestment limit — you can start a new investment immediately after each maturity cycle using the balance or fresh funds.",
				createdAt: "2026-04-17T09:10:00Z",
				id: "msg-2035-2",
			},
			{
				author: "user",
				authorName: "You",
				body: "Does the same apply if I add new funds in the middle of an active cycle?",
				createdAt: "2026-04-18T08:30:00Z",
				id: "msg-2035-3",
			},
			{
				author: "support",
				authorName: "Nexcoin Support",
				body: "New deposits don't affect the current cycle — they'll be available for the next investment you start. Marking this resolved, feel free to reopen if anything else comes up.",
				createdAt: "2026-04-18T16:08:00Z",
				id: "msg-2035-4",
			},
		],
		priority: "normal",
		reference: "NX-2035",
		status: "resolved",
		subject: "Advanced plan reinvestment limit clarification",
		unread: false,
		updatedAt: "2026-04-18T16:08:00Z",
	},
	{
		category: "deposits",
		createdAt: "2026-04-15T20:19:00Z",
		id: "tkt-2029",
		lastMessageFrom: "support",
		messageCount: 5,
		messages: [
			{
				author: "user",
				authorName: "You",
				body: "My BTC deposit confirmed on-chain over an hour ago but hasn't shown up in my account balance.",
				createdAt: "2026-04-15T20:19:00Z",
				id: "msg-2029-1",
			},
			{
				author: "support",
				authorName: "Nexcoin Support",
				body: "Thanks for flagging. Can you share the transaction hash so I can locate it on our end?",
				createdAt: "2026-04-15T21:00:00Z",
				id: "msg-2029-2",
			},
			{
				author: "user",
				authorName: "You",
				body: "Hash: 000000000000000000027f4c8e1a0b9d3e6f1b2c4a5d8e9f0a1b2c3d4e5f6a7b",
				createdAt: "2026-04-15T21:30:00Z",
				id: "msg-2029-3",
			},
			{
				author: "support",
				authorName: "Nexcoin Support",
				body: "Found it. Our gateway was slow to pick up the confirmation — crediting your account manually now.",
				createdAt: "2026-04-16T07:15:00Z",
				id: "msg-2029-4",
			},
			{
				author: "support",
				authorName: "Nexcoin Support",
				body: "All set, the deposit is now reflected in your available balance. Apologies for the delay — resolving this ticket.",
				createdAt: "2026-04-16T11:42:00Z",
				id: "msg-2029-5",
			},
		],
		priority: "high",
		reference: "NX-2029",
		status: "resolved",
		subject: "Bitcoin deposit confirmed late, credited manually",
		unread: false,
		updatedAt: "2026-04-16T11:42:00Z",
	},
	{
		category: "security",
		createdAt: "2026-04-12T12:00:00Z",
		id: "tkt-2017",
		lastMessageFrom: "support",
		messageCount: 6,
		messages: [
			{
				author: "user",
				authorName: "You",
				body: "I got an email about a login from a new device in Berlin. It wasn't me.",
				createdAt: "2026-04-12T12:00:00Z",
				id: "msg-2017-1",
			},
			{
				author: "support",
				authorName: "Nexcoin Support",
				body: "Thanks for reporting. I've terminated that session and temporarily locked the account. Can you confirm whether you used a VPN or travelled recently?",
				createdAt: "2026-04-12T12:40:00Z",
				id: "msg-2017-2",
			},
			{
				author: "user",
				authorName: "You",
				body: "No VPN and no travel. I'm in Lagos.",
				createdAt: "2026-04-12T13:05:00Z",
				id: "msg-2017-3",
			},
			{
				author: "support",
				authorName: "Nexcoin Support",
				body: "Understood. Please reset your password immediately and enable 2FA if you haven't already.",
				createdAt: "2026-04-12T13:30:00Z",
				id: "msg-2017-4",
			},
			{
				author: "user",
				authorName: "You",
				body: "Done — changed the password and enabled 2FA.",
				createdAt: "2026-04-13T08:45:00Z",
				id: "msg-2017-5",
			},
			{
				author: "support",
				authorName: "Nexcoin Support",
				body: "Great. I've reviewed the account activity and no unauthorised transactions were performed. Closing this ticket — reach out if you notice anything unusual.",
				createdAt: "2026-04-13T09:17:00Z",
				id: "msg-2017-6",
			},
		],
		priority: "high",
		reference: "NX-2017",
		status: "closed",
		subject: "Unrecognized login from new device",
		unread: false,
		updatedAt: "2026-04-13T09:17:00Z",
	},
	{
		category: "account",
		createdAt: "2026-04-10T18:41:00Z",
		id: "tkt-2011",
		lastMessageFrom: "support",
		messageCount: 2,
		messages: [
			{
				author: "user",
				authorName: "You",
				body: "I need to update the email address tied to my account.",
				createdAt: "2026-04-10T18:41:00Z",
				id: "msg-2011-1",
			},
			{
				author: "support",
				authorName: "Nexcoin Support",
				body: "For email changes we run a verification step. I've sent a confirmation link to the new address — click it and the change will be finalised.",
				createdAt: "2026-04-11T07:55:00Z",
				id: "msg-2011-2",
			},
		],
		priority: "low",
		reference: "NX-2011",
		status: "closed",
		subject: "Request to update registered email address",
		unread: false,
		updatedAt: "2026-04-11T07:55:00Z",
	},
];

export function findSupportTicket(reference: string) {
	const normalized = reference.toUpperCase();

	return supportTickets.find(
		(ticket) => ticket.reference.toUpperCase() === normalized,
	);
}

export const supportSummary: SupportSummary = {
	avgResponseHours: 4.2,
	awaitingReply: 1,
	open: 2,
	resolvedThisMonth: 2,
};
