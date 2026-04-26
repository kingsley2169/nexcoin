import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminSupportStatus =
	| "Awaiting User"
	| "Closed"
	| "Open"
	| "Pending Admin"
	| "Resolved";

export type AdminSupportPriority = "High" | "Low" | "Medium" | "Urgent";

export type AdminSupportCategory =
	| "Account"
	| "Deposit"
	| "General"
	| "Investment"
	| "KYC"
	| "Security"
	| "Withdrawal";

export type AdminSupportMessage = {
	author: string;
	body: string;
	createdAt: string;
	id: string;
	type: "admin" | "internal" | "user";
};

export type AdminSupportTimelineItem = {
	createdAt: string;
	id: string;
	label: string;
};

export type AdminSupportTicket = {
	agent: string;
	attachments: string[];
	category: AdminSupportCategory;
	createdAt: string;
	id: string;
	internalNotes: string[];
	lastMessageAt: string;
	linkedRecords: {
		deposit?: string;
		kyc?: string;
		transaction?: string;
		withdrawal?: string;
	};
	messages: AdminSupportMessage[];
	priority: AdminSupportPriority;
	reference: string;
	slaDueAt: string;
	status: AdminSupportStatus;
	subject: string;
	timeline: AdminSupportTimelineItem[];
	userEmail: string;
	userName: string;
};

export type AdminSupportData = {
	agents: {
		active: number;
		id: string;
		name: string;
		openTickets: number;
	}[];
	issueCounts: {
		count: number;
		id: string;
		label: string;
	}[];
	slaAlerts: {
		dueAt: string;
		id: string;
		reference: string;
		subject: string;
	}[];
	summary: {
		avgResponse: string;
		awaitingUser: number;
		openTickets: number;
		resolvedToday: number;
		slaAtRisk: number;
		urgentTickets: number;
	};
	tickets: AdminSupportTicket[];
};

type TicketRow = {
	agent: string | null;
	attachments: string[] | null;
	category: string;
	created_at: string;
	id: string;
	internal_notes: string[] | null;
	last_message_at: string | null;
	linked_records: Record<string, string> | null;
	messages:
		| Array<{
				author?: string;
				body?: string;
				createdAt?: string;
				id?: string;
				type?: string;
		  }>
		| null;
	priority: string;
	reference: string;
	sla_due_at: string | null;
	status: string;
	subject: string;
	timeline:
		| Array<{
				createdAt?: string;
				id?: string;
				label?: string;
		  }>
		| null;
	user_email: string | null;
	user_name: string | null;
};

type SummaryPayload = {
	agents: Array<{
		active: number | string;
		id: string;
		name: string;
		openTickets: number | string;
	}>;
	issueCounts: Array<{
		count: number | string;
		id: string;
		label: string;
	}>;
	slaAlerts: Array<{
		dueAt: string;
		id: string;
		reference: string;
		subject: string;
	}>;
	summary: {
		averageFirstResponseMinutes: number | string;
		awaitingUser: number | string;
		openTickets: number | string;
		resolvedToday: number | string;
		slaAtRisk: number | string;
		urgentTickets: number | string;
	};
};

function toNumber(value: number | string | null | undefined) {
	if (typeof value === "number") return value;
	if (typeof value === "string" && value.length > 0) return Number(value);
	return 0;
}

function mapStatus(value: string): AdminSupportStatus {
	switch (value) {
		case "Awaiting User":
			return "Awaiting User";
		case "Closed":
			return "Closed";
		case "Pending Admin":
			return "Pending Admin";
		case "Resolved":
			return "Resolved";
		default:
			return "Open";
	}
}

function mapPriority(value: string): AdminSupportPriority {
	switch (value) {
		case "High":
			return "High";
		case "Low":
			return "Low";
		case "Urgent":
			return "Urgent";
		default:
			return "Medium";
	}
}

function mapCategory(value: string): AdminSupportCategory {
	switch (value) {
		case "Account":
			return "Account";
		case "Deposit":
			return "Deposit";
		case "Investment":
			return "Investment";
		case "Kyc":
		case "KYC":
			return "KYC";
		case "Security":
			return "Security";
		case "Withdrawal":
			return "Withdrawal";
		default:
			return "General";
	}
}

function mapMessageType(value: string): AdminSupportMessage["type"] {
	switch (value) {
		case "admin":
			return "admin";
		case "internal":
			return "internal";
		default:
			return "user";
	}
}

function formatAverageMinutes(minutes: number) {
	if (minutes <= 0) return "—";
	if (minutes < 60) return `${Math.round(minutes)} min`;
	const hours = minutes / 60;
	if (hours < 24) return `${hours.toFixed(1)} h`;
	return `${(hours / 24).toFixed(1)} d`;
}

export async function getAdminSupportData(
	supabase: SupabaseClient,
): Promise<AdminSupportData> {
	const [summaryResult, ticketsResult] = await Promise.all([
		supabase.rpc("get_admin_support_management_summary"),
		supabase
			.from("admin_support_management_view")
			.select(
				"id,reference,user_name,user_email,agent,category,priority,status,subject,sla_due_at,last_message_at,created_at,attachments,linked_records,messages,internal_notes,timeline",
			)
			.order("created_at", { ascending: false })
			.returns<TicketRow[]>(),
	]);

	if (summaryResult.error) throw new Error(summaryResult.error.message);
	if (ticketsResult.error) throw new Error(ticketsResult.error.message);

	const summaryPayload = (summaryResult.data ?? {}) as SummaryPayload;

	const tickets: AdminSupportTicket[] = (ticketsResult.data ?? []).map(
		(row) => ({
			agent: row.agent ?? "Unassigned",
			attachments: row.attachments ?? [],
			category: mapCategory(row.category),
			createdAt: row.created_at,
			id: row.id,
			internalNotes: row.internal_notes ?? [],
			lastMessageAt: row.last_message_at ?? row.created_at,
			linkedRecords: {
				deposit: row.linked_records?.deposit,
				kyc: row.linked_records?.kyc,
				transaction: row.linked_records?.transaction,
				withdrawal: row.linked_records?.withdrawal,
			},
			messages: (row.messages ?? [])
				.filter((message) => typeof message.body === "string")
				.map((message, index) => ({
					author: message.author ?? "Admin User",
					body: message.body ?? "",
					createdAt: message.createdAt ?? row.created_at,
					id: message.id ?? `${row.id}-message-${index}`,
					type: mapMessageType(message.type ?? ""),
				})),
			priority: mapPriority(row.priority),
			reference: row.reference,
			slaDueAt: row.sla_due_at ?? row.created_at,
			status: mapStatus(row.status),
			subject: row.subject,
			timeline: (row.timeline ?? [])
				.map((item, index) => ({
					createdAt: item.createdAt ?? "",
					id: item.id ?? `${row.id}-event-${index}`,
					label: item.label ?? "",
				}))
				.filter((item) => item.createdAt && item.label)
				.sort(
					(left, right) =>
						new Date(right.createdAt).getTime() -
						new Date(left.createdAt).getTime(),
				),
			userEmail: row.user_email ?? "",
			userName: row.user_name ?? "Unknown user",
		}),
	);

	return {
		agents: (summaryPayload.agents ?? []).map((agent) => ({
			active: toNumber(agent.active),
			id: agent.id,
			name: agent.name,
			openTickets: toNumber(agent.openTickets),
		})),
		issueCounts: (summaryPayload.issueCounts ?? []).map((entry) => ({
			count: toNumber(entry.count),
			id: entry.id,
			label: entry.label,
		})),
		slaAlerts: (summaryPayload.slaAlerts ?? []).map((alert) => ({
			dueAt: alert.dueAt,
			id: alert.id,
			reference: alert.reference,
			subject: alert.subject,
		})),
		summary: {
			avgResponse: formatAverageMinutes(
				toNumber(summaryPayload.summary?.averageFirstResponseMinutes),
			),
			awaitingUser: toNumber(summaryPayload.summary?.awaitingUser),
			openTickets: toNumber(summaryPayload.summary?.openTickets),
			resolvedToday: toNumber(summaryPayload.summary?.resolvedToday),
			slaAtRisk: toNumber(summaryPayload.summary?.slaAtRisk),
			urgentTickets: toNumber(summaryPayload.summary?.urgentTickets),
		},
		tickets,
	};
}
