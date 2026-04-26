import type { SupabaseClient } from "@supabase/supabase-js";

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

type TicketRow = {
	category: string;
	created_at: string;
	id: string;
	last_message_from: string;
	message_count: number;
	priority: string;
	reference: string;
	status: string;
	subject: string;
	unread: boolean;
	updated_at: string;
};

type ThreadRow = {
	author: string;
	author_name: string;
	body: string | null;
	created_at: string;
	row_id: string;
	row_type: string;
};

type SummaryRow = {
	avg_response_hours: number | string;
	awaiting_reply: number | string;
	open: number | string;
	resolved_this_month: number | string;
};

function toNumber(value: number | string | null | undefined) {
	if (typeof value === "number") return value;
	if (typeof value === "string" && value.length > 0) return Number(value);
	return 0;
}

function mapStatus(value: string): TicketStatus {
	switch (value) {
		case "awaiting_reply":
			return "awaiting_reply";
		case "resolved":
			return "resolved";
		case "closed":
			return "closed";
		default:
			return "open";
	}
}

function mapCategory(value: string): TicketCategory {
	switch (value) {
		case "deposits":
		case "withdrawals":
		case "kyc":
		case "plans":
		case "security":
		case "account":
			return value;
		default:
			return "other";
	}
}

function mapPriority(value: string): TicketPriority {
	switch (value) {
		case "low":
			return "low";
		case "high":
			return "high";
		default:
			return "normal";
	}
}

function mapMessageAuthor(value: string): "user" | "support" {
	return value === "user" ? "user" : "support";
}

function mapTicketRow(row: TicketRow): Omit<SupportTicket, "messages"> {
	return {
		category: mapCategory(row.category),
		createdAt: row.created_at,
		id: row.id,
		lastMessageFrom: mapMessageAuthor(row.last_message_from),
		messageCount: row.message_count,
		priority: mapPriority(row.priority),
		reference: row.reference,
		status: mapStatus(row.status),
		subject: row.subject,
		unread: row.unread,
		updatedAt: row.updated_at,
	};
}

export async function getSupportData(
	supabase: SupabaseClient,
): Promise<{ summary: SupportSummary; tickets: SupportTicket[] }> {
	const [summaryResult, ticketsResult] = await Promise.all([
		supabase
			.from("user_support_summary_view")
			.select("open,awaiting_reply,resolved_this_month,avg_response_hours")
			.maybeSingle<SummaryRow>(),
		supabase
			.from("user_tickets_view")
			.select(
				"id,reference,subject,category,priority,status,created_at,updated_at,message_count,last_message_from,unread",
			)
			.returns<TicketRow[]>(),
	]);

	if (summaryResult.error) throw new Error(summaryResult.error.message);
	if (ticketsResult.error) throw new Error(ticketsResult.error.message);

	const summary: SupportSummary = {
		avgResponseHours: toNumber(summaryResult.data?.avg_response_hours),
		awaitingReply: toNumber(summaryResult.data?.awaiting_reply),
		open: toNumber(summaryResult.data?.open),
		resolvedThisMonth: toNumber(summaryResult.data?.resolved_this_month),
	};

	const tickets: SupportTicket[] = (ticketsResult.data ?? []).map((row) => ({
		...mapTicketRow(row),
		messages: [],
	}));

	return { summary, tickets };
}

export async function getSupportThread(
	supabase: SupabaseClient,
	reference: string,
): Promise<SupportTicket | null> {
	const normalized = reference.toUpperCase();

	const { data: ticketData, error: ticketError } = await supabase
		.from("user_tickets_view")
		.select(
			"id,reference,subject,category,priority,status,created_at,updated_at,message_count,last_message_from,unread",
		)
		.eq("reference", normalized)
		.maybeSingle<TicketRow>();

	if (ticketError) throw new Error(ticketError.message);
	if (!ticketData) return null;

	const { data: threadRows, error: threadError } = await supabase
		.from("user_ticket_thread_view")
		.select("row_id,row_type,author,author_name,body,created_at")
		.eq("ticket_id", ticketData.id)
		.order("created_at", { ascending: true })
		.returns<ThreadRow[]>();

	if (threadError) throw new Error(threadError.message);

	const messages: TicketMessage[] = (threadRows ?? [])
		.filter((row) => row.row_type === "message" && row.body !== null)
		.map((row) => ({
			author: mapMessageAuthor(row.author),
			authorName:
				row.author_name ||
				(mapMessageAuthor(row.author) === "user" ? "You" : "Nexcoin Support"),
			body: row.body ?? "",
			createdAt: row.created_at,
			id: row.row_id,
		}));

	return {
		...mapTicketRow(ticketData),
		messages,
	};
}
