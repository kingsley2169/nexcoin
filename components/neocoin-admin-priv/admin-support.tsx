"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
	type AdminSupportCategory,
	type AdminSupportData,
	type AdminSupportPriority,
	type AdminSupportStatus,
	type AdminSupportTicket,
} from "@/lib/admin-support";
import {
	replyAdminSupportTicket,
	updateSupportTicket,
} from "@/app/nexcoin-admin-priv/support/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_TO_DB: Record<
	AdminSupportStatus,
	"awaiting_user" | "closed" | "open" | "pending_admin" | "resolved"
> = {
	"Awaiting User": "awaiting_user",
	Closed: "closed",
	Open: "open",
	"Pending Admin": "pending_admin",
	Resolved: "resolved",
};

const PRIORITY_TO_DB: Record<
	AdminSupportPriority,
	"high" | "low" | "medium" | "urgent"
> = {
	High: "high",
	Low: "low",
	Medium: "medium",
	Urgent: "urgent",
};

type AdminSupportProps = {
	data: AdminSupportData;
};

type StatusFilter = AdminSupportStatus | "all";
type PriorityFilter = AdminSupportPriority | "all";
type CategoryFilter = AdminSupportCategory | "all";
type DateFilter = "7d" | "30d" | "90d" | "all";

const statusFilters: { label: string; value: StatusFilter }[] = [
	{ label: "All status", value: "all" },
	{ label: "Open", value: "Open" },
	{ label: "Pending Admin", value: "Pending Admin" },
	{ label: "Awaiting User", value: "Awaiting User" },
	{ label: "Resolved", value: "Resolved" },
	{ label: "Closed", value: "Closed" },
];

const priorityFilters: { label: string; value: PriorityFilter }[] = [
	{ label: "All priority", value: "all" },
	{ label: "Urgent", value: "Urgent" },
	{ label: "High", value: "High" },
	{ label: "Medium", value: "Medium" },
	{ label: "Low", value: "Low" },
];

const categoryFilters: { label: string; value: CategoryFilter }[] = [
	{ label: "All categories", value: "all" },
	{ label: "Deposit", value: "Deposit" },
	{ label: "Withdrawal", value: "Withdrawal" },
	{ label: "KYC", value: "KYC" },
	{ label: "Investment", value: "Investment" },
	{ label: "Account", value: "Account" },
	{ label: "Security", value: "Security" },
	{ label: "General", value: "General" },
];

const dateFilters: { label: string; value: DateFilter }[] = [
	{ label: "7D", value: "7d" },
	{ label: "30D", value: "30d" },
	{ label: "90D", value: "90d" },
	{ label: "All", value: "all" },
];

const statusClasses: Record<AdminSupportStatus, string> = {
	"Awaiting User": "bg-[#eef6f5] text-[#3c7f80]",
	Closed: "bg-[#eef1f1] text-[#5d6163]",
	Open: "bg-[#fff1e0] text-[#a66510]",
	"Pending Admin": "bg-[#fde8e8] text-[#b1423a]",
	Resolved: "bg-[#e6f3ec] text-[#2e8f5b]",
};

const priorityClasses: Record<AdminSupportPriority, string> = {
	High: "bg-[#fde8e8] text-[#b1423a]",
	Low: "bg-[#e6f3ec] text-[#2e8f5b]",
	Medium: "bg-[#fff1e0] text-[#a66510]",
	Urgent: "bg-[#b1423a] text-white",
};

const categoryClasses: Record<AdminSupportCategory, string> = {
	Account: "bg-[#eef6f5] text-[#3c7f80]",
	Deposit: "bg-[#e6f3ec] text-[#2e8f5b]",
	General: "bg-[#eef1f1] text-[#5d6163]",
	Investment: "bg-[#eef6f5] text-[#3c7f80]",
	KYC: "bg-[#fff1e0] text-[#a66510]",
	Security: "bg-[#fde8e8] text-[#b1423a]",
	Withdrawal: "bg-[#fde8e8] text-[#b1423a]",
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
	month: "short",
	year: "numeric",
});

function formatDateTime(iso: string) {
	return dateTimeFormatter.format(new Date(iso));
}

function getInitials(name: string) {
	return name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

function getWaitingLabel(iso: string) {
	const now = new Date("2026-04-22T12:00:00Z");
	const minutes = Math.max(
		1,
		Math.round((now.getTime() - new Date(iso).getTime()) / (1000 * 60)),
	);

	if (minutes < 60) {
		return `${minutes}m waiting`;
	}

	const hours = Math.round(minutes / 60);

	return hours >= 24 ? `${Math.round(hours / 24)}d waiting` : `${hours}h waiting`;
}

function getSlaLabel(iso: string) {
	const now = new Date("2026-04-22T12:00:00Z");
	const minutes = Math.round((new Date(iso).getTime() - now.getTime()) / (1000 * 60));

	if (minutes < 0) {
		return "SLA breached";
	}

	if (minutes < 60) {
		return `${minutes}m left`;
	}

	return `${Math.round(minutes / 60)}h left`;
}

function SearchIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			aria-hidden="true"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
		>
			<path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16ZM21 21l-4.35-4.35" />
		</svg>
	);
}

export function AdminSupport({ data }: AdminSupportProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const tickets = data.tickets;
	const [selectedId, setSelectedId] = useState(data.tickets[0]?.id ?? "");
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
	const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
	const [agentFilter, setAgentFilter] = useState("all");
	const [dateFilter, setDateFilter] = useState<DateFilter>("30d");
	const [reply, setReply] = useState("");
	const [internalNote, setInternalNote] = useState("");
	const [replySaved, setReplySaved] = useState(false);
	const [isTicketOpen, setIsTicketOpen] = useState(false);
	const [notice, setNotice] = useState<
		{ tone: "error" | "success"; message: string } | null
	>(null);

	const selectedTicket =
		tickets.find((ticket) => ticket.id === selectedId) ?? tickets[0];

	const agentFilters = useMemo(
		() => ["all", ...Array.from(new Set(tickets.map((ticket) => ticket.agent)))],
		[tickets],
	);

	const filteredTickets = useMemo(() => {
		const trimmed = query.trim().toLowerCase();
		const now = new Date("2026-04-22T12:00:00Z");
		const dayWindow =
			dateFilter === "7d"
				? 7
				: dateFilter === "30d"
					? 30
					: dateFilter === "90d"
						? 90
						: null;

		return tickets.filter((ticket) => {
			if (statusFilter !== "all" && ticket.status !== statusFilter) {
				return false;
			}

			if (priorityFilter !== "all" && ticket.priority !== priorityFilter) {
				return false;
			}

			if (categoryFilter !== "all" && ticket.category !== categoryFilter) {
				return false;
			}

			if (agentFilter !== "all" && ticket.agent !== agentFilter) {
				return false;
			}

			if (dayWindow) {
				const ageMs = now.getTime() - new Date(ticket.createdAt).getTime();
				const ageDays = ageMs / (1000 * 60 * 60 * 24);

				if (ageDays > dayWindow) {
					return false;
				}
			}

			if (trimmed) {
				const haystack = [
					ticket.reference,
					ticket.userName,
					ticket.userEmail,
					ticket.subject,
					ticket.agent,
					ticket.category,
					...ticket.messages.map((message) => message.body),
					...ticket.internalNotes,
				]
					.join(" ")
					.toLowerCase();

				if (!haystack.includes(trimmed)) {
					return false;
				}
			}

			return true;
		});
	}, [
		agentFilter,
		categoryFilter,
		dateFilter,
		priorityFilter,
		query,
		statusFilter,
		tickets,
	]);

	const updateTicket = (
		id: string,
		updates: Partial<Pick<AdminSupportTicket, "agent" | "priority" | "status">>,
		label: string,
	) => {
		if (isPending) return;

		const dbUpdates: {
			assignedAdminId?: string | null;
			priority?: "high" | "low" | "medium" | "urgent";
			status?: "awaiting_user" | "closed" | "open" | "pending_admin" | "resolved";
		} = {};

		if (updates.priority) {
			dbUpdates.priority = PRIORITY_TO_DB[updates.priority];
		}
		if (updates.status) {
			dbUpdates.status = STATUS_TO_DB[updates.status];
		}
		if (updates.agent !== undefined) {
			const matched = data.agents.find((agent) => agent.name === updates.agent);
			dbUpdates.assignedAdminId = matched?.id ?? null;
		}

		startTransition(async () => {
			const result = await updateSupportTicket({
				ticketId: id,
				...dbUpdates,
			});

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({ tone: "success", message: label });
			router.refresh();
		});
	};

	const sendReply = () => {
		const trimmedReply = reply.trim();
		const trimmedNote = internalNote.trim();

		if (!selectedTicket || (!trimmedReply && !trimmedNote) || isPending) {
			return;
		}

		startTransition(async () => {
			if (trimmedReply) {
				const replyResult = await replyAdminSupportTicket(
					selectedTicket.id,
					trimmedReply,
					"admin",
				);

				if (!replyResult.ok) {
					setNotice({ tone: "error", message: replyResult.error });
					return;
				}
			}

			if (trimmedNote) {
				const noteResult = await replyAdminSupportTicket(
					selectedTicket.id,
					trimmedNote,
					"internal",
				);

				if (!noteResult.ok) {
					setNotice({ tone: "error", message: noteResult.error });
					return;
				}
			}

			setReply("");
			setInternalNote("");
			setReplySaved(true);
			setNotice({ tone: "success", message: "Reply sent." });
			router.refresh();
			window.setTimeout(() => setReplySaved(false), 2500);
		});
	};

	const openTicket = (id: string) => {
		setSelectedId(id);
		setIsTicketOpen(true);
		setReplySaved(false);
	};

	const resetFilters = () => {
		setQuery("");
		setStatusFilter("all");
		setPriorityFilter("all");
		setCategoryFilter("all");
		setAgentFilter("all");
		setDateFilter("30d");
	};

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
				<div className="min-w-0">
					<h1 className="text-2xl font-semibold text-[#576363]">
						Support Management
					</h1>
					<p className="mt-1 max-w-3xl text-sm leading-6 text-[#5d6163]">
						Review user tickets, respond to account issues, escalate urgent
						cases, and track support SLAs.
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<Button type="button" onClick={() => setStatusFilter("Open")}>
						Open Tickets
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => setPriorityFilter("Urgent")}
					>
						Urgent
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => window.alert("Support report export is ready for backend wiring.")}
					>
						Export Report
					</Button>
				</div>
			</header>

			{notice ? (
				<div
					role="status"
					aria-live="polite"
					className={cn(
						"rounded-md border px-4 py-3 text-sm font-semibold",
						notice.tone === "success"
							? "border-[#c7ebd2] bg-[#e6f3ec] text-[#2e8f5b]"
							: "border-[#f2c5c0] bg-[#fff7f6] text-[#b1423a]",
					)}
				>
					{notice.message}
				</div>
			) : null}

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
				<SummaryCard
					hint="Waiting on staff"
					label="Open tickets"
					value={data.summary.openTickets.toString()}
					tone="warning"
				/>
				<SummaryCard
					hint="Immediate attention"
					label="Urgent tickets"
					value={data.summary.urgentTickets.toString()}
					tone="danger"
				/>
				<SummaryCard
					hint="Customer follow-up"
					label="Awaiting user"
					value={data.summary.awaitingUser.toString()}
				/>
				<SummaryCard
					hint="Completed today"
					label="Resolved today"
					value={data.summary.resolvedToday.toString()}
					tone="positive"
				/>
				<SummaryCard
					hint="Due soon"
					label="SLA at risk"
					value={data.summary.slaAtRisk.toString()}
					tone="danger"
				/>
				<SummaryCard
					hint="First response"
					label="Avg response"
					value={data.summary.avgResponse}
				/>
			</section>

			<div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_390px]">
				<section className="rounded-lg border border-[#d7e5e3] bg-white shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
					<div className="border-b border-[#d7e5e3] p-5">
						<div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
							<div className="min-w-0">
								<h2 className="text-lg font-semibold text-[#576363]">
									Ticket inbox
								</h2>
								<p className="mt-1 text-sm leading-6 text-[#5d6163]">
									{filteredTickets.length} tickets match current filters.
								</p>
							</div>
							<div className="flex h-10 w-full min-w-0 items-center rounded-md border border-[#cfdcda] bg-white px-3 focus-within:border-[#5F9EA0] focus-within:ring-4 focus-within:ring-[#5F9EA0]/15 sm:max-w-md xl:w-96">
								<SearchIcon className="h-4 w-4 text-[#5d6163]" />
								<label className="sr-only" htmlFor="admin-support-search">
									Search support tickets
								</label>
								<input
									id="admin-support-search"
									type="search"
									value={query}
									onChange={(event) => setQuery(event.target.value)}
									placeholder="Search reference, user, subject, message"
									className="ml-2 h-full min-w-0 flex-1 bg-transparent text-sm text-[#576363] outline-none placeholder:text-[#9aa5a4]"
								/>
							</div>
						</div>

						<FilterGroup
							filters={statusFilters}
							onChange={setStatusFilter}
							value={statusFilter}
						/>
						<FilterGroup
							filters={priorityFilters}
							onChange={setPriorityFilter}
							value={priorityFilter}
						/>
						<FilterGroup
							filters={categoryFilters}
							onChange={setCategoryFilter}
							value={categoryFilter}
						/>
						<FilterGroup
							filters={agentFilters.map((agent) => ({
								label: agent === "all" ? "All agents" : agent,
								value: agent,
							}))}
							onChange={setAgentFilter}
							value={agentFilter}
						/>
						<div className="mt-3 flex flex-wrap items-center gap-2">
							<FilterGroup
								filters={dateFilters}
								onChange={setDateFilter}
								value={dateFilter}
								wrapperClassName="mt-0"
							/>
							<Button type="button" variant="outline" onClick={resetFilters}>
								Reset filters
							</Button>
						</div>
					</div>

					<div className="divide-y divide-[#eef1f1]">
						{filteredTickets.length === 0 ? (
							<div className="p-8 text-center">
								<p className="font-semibold text-[#576363]">No tickets found</p>
								<p className="mt-2 text-sm text-[#5d6163]">
									Adjust filters or search terms.
								</p>
							</div>
						) : (
							filteredTickets.map((ticket) => (
								<TicketRow
									key={ticket.id}
									onOpen={openTicket}
									selected={selectedTicket?.id === ticket.id}
									ticket={ticket}
								/>
							))
						)}
					</div>
				</section>

				<div className="space-y-6 2xl:sticky 2xl:top-24 2xl:self-start">
					<SupportHealthPanel data={data} />
				</div>
			</div>

			{isTicketOpen && selectedTicket ? (
				<TicketModal onClose={() => setIsTicketOpen(false)} ticket={selectedTicket}>
					<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
						<TicketConversation ticket={selectedTicket} />
						<div className="xl:sticky xl:top-0 xl:self-start">
							<TicketDecisionPanel
								agents={data.agents}
								internalNote={internalNote}
								onInternalNoteChange={setInternalNote}
								onReplyChange={setReply}
								onSendReply={sendReply}
								onUpdateTicket={updateTicket}
								reply={reply}
								replySaved={replySaved}
								ticket={selectedTicket}
							/>
						</div>
					</div>
				</TicketModal>
			) : null}
		</div>
	);
}

function SummaryCard({
	hint,
	label,
	tone = "neutral",
	value,
}: {
	hint: string;
	label: string;
	tone?: "danger" | "neutral" | "positive" | "warning";
	value: string;
}) {
	return (
		<div className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<p className="text-sm text-[#5d6163]">{label}</p>
			<p className="mt-2 text-2xl font-semibold text-[#576363]">{value}</p>
			<p
				className={cn(
					"mt-2 text-sm",
					tone === "danger" && "text-[#b1423a]",
					tone === "positive" && "text-[#2e8f5b]",
					tone === "warning" && "text-[#a66510]",
					tone === "neutral" && "text-[#5d6163]",
				)}
			>
				{hint}
			</p>
		</div>
	);
}

function FilterGroup<T extends string>({
	filters,
	onChange,
	value,
	wrapperClassName,
}: {
	filters: { label: string; value: T }[];
	onChange: (value: T) => void;
	value: T;
	wrapperClassName?: string;
}) {
	return (
		<div className={cn("mt-3 flex flex-wrap gap-2", wrapperClassName)}>
			{filters.map((filter) => (
				<button
					key={filter.value}
					type="button"
					onClick={() => onChange(filter.value)}
					className={cn(
						"rounded-full px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15",
						value === filter.value
							? "bg-[#5F9EA0] text-white"
							: "bg-[#f7faf9] text-[#576363] hover:bg-[#eef6f5] hover:text-[#5F9EA0]",
					)}
				>
					{filter.label}
				</button>
			))}
		</div>
	);
}

function TicketRow({
	onOpen,
	selected,
	ticket,
}: {
	onOpen: (id: string) => void;
	selected: boolean;
	ticket: AdminSupportTicket;
}) {
	const lastMessage = ticket.messages[ticket.messages.length - 1];

	return (
		<div
			role="button"
			tabIndex={0}
			onClick={() => onOpen(ticket.id)}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					onOpen(ticket.id);
				}
			}}
			className={cn(
				"grid cursor-pointer gap-4 p-5 transition hover:bg-[#f7faf9] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15 lg:grid-cols-[minmax(260px,1fr)_minmax(190px,0.6fr)] 2xl:grid-cols-[minmax(280px,1fr)_minmax(170px,0.5fr)_minmax(190px,0.6fr)_auto]",
				selected && "bg-[#eef6f5]",
			)}
		>
			<div className="min-w-0">
				<div className="flex flex-wrap items-center gap-2">
					<p className="font-semibold text-[#576363]">{ticket.reference}</p>
					<span
						className={cn(
							"rounded-full px-2.5 py-1 text-xs font-semibold",
							categoryClasses[ticket.category],
						)}
					>
						{ticket.category}
					</span>
					<span
						className={cn(
							"rounded-full px-2.5 py-1 text-xs font-semibold",
							priorityClasses[ticket.priority],
						)}
					>
						{ticket.priority}
					</span>
				</div>
				<p className="mt-2 truncate font-semibold text-[#576363]">
					{ticket.subject}
				</p>
				<p className="mt-1 truncate text-sm text-[#5d6163]">
					{ticket.userName} - {ticket.userEmail}
				</p>
			</div>
			<div>
				<span
					className={cn(
						"rounded-full px-2.5 py-1 text-xs font-semibold",
						statusClasses[ticket.status],
					)}
				>
					{ticket.status}
				</span>
				<p className="mt-3 text-sm font-semibold text-[#576363]">
					{getSlaLabel(ticket.slaDueAt)}
				</p>
				<p className="mt-1 text-xs text-[#5d6163]">
					{getWaitingLabel(ticket.lastMessageAt)}
				</p>
			</div>
			<div className="min-w-0 lg:col-span-2 2xl:col-span-1">
				<p className="text-sm font-semibold text-[#576363]">{ticket.agent}</p>
				<p className="mt-1 truncate text-sm text-[#5d6163]">
					{lastMessage?.body ?? "No messages yet"}
				</p>
				<p className="mt-1 text-xs text-[#5d6163]">
					Last update {formatDateTime(ticket.lastMessageAt)}
				</p>
			</div>
			<div className="flex items-center gap-2 lg:justify-end">
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={(event) => {
						event.stopPropagation();
						onOpen(ticket.id);
					}}
				>
					Open
				</Button>
			</div>
		</div>
	);
}

function SupportHealthPanel({ data }: { data: AdminSupportData }) {
	return (
		<div className="space-y-6">
			<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<h2 className="text-lg font-semibold text-[#576363]">SLA at risk</h2>
				<div className="mt-4 space-y-3">
					{data.slaAlerts.map((alert) => (
						<div
							key={alert.id}
							className="rounded-lg border border-[#eef1f1] bg-[#f7faf9] p-4"
						>
							<div className="flex items-start justify-between gap-3">
								<p className="font-semibold text-[#576363]">
									{alert.reference}
								</p>
								<span className="rounded-full bg-[#fde8e8] px-2.5 py-1 text-xs font-semibold text-[#b1423a]">
									{getSlaLabel(alert.dueAt)}
								</span>
							</div>
							<p className="mt-2 text-sm leading-6 text-[#5d6163]">
								{alert.subject}
							</p>
						</div>
					))}
				</div>
			</section>

			<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<h2 className="text-lg font-semibold text-[#576363]">Agent workload</h2>
				<div className="mt-4 space-y-3">
					{data.agents.map((agent) => (
						<div key={agent.id}>
							<div className="flex items-center justify-between gap-3">
								<p className="font-semibold text-[#576363]">{agent.name}</p>
								<p className="text-sm text-[#5d6163]">
									{agent.openTickets} open
								</p>
							</div>
							<div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eef1f1]">
								<div
									className="h-full rounded-full bg-[#5F9EA0]"
									style={{ width: `${Math.min(agent.openTickets * 8, 100)}%` }}
								/>
							</div>
						</div>
					))}
				</div>
			</section>

			<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<h2 className="text-lg font-semibold text-[#576363]">Common issues</h2>
				<div className="mt-4 space-y-3">
					{data.issueCounts.map((issue) => (
						<div
							key={issue.id}
							className="flex items-center justify-between gap-3 border-b border-[#eef1f1] pb-3 last:border-b-0 last:pb-0"
						>
							<p className="font-semibold text-[#576363]">{issue.label}</p>
							<span className="rounded-full bg-[#f7faf9] px-2.5 py-1 text-xs font-semibold text-[#5F9EA0]">
								{issue.count}
							</span>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}

function TicketModal({
	children,
	onClose,
	ticket,
}: {
	children: React.ReactNode;
	onClose: () => void;
	ticket: AdminSupportTicket;
}) {
	return (
		<div
			className="fixed inset-0 z-[70] bg-[#1f2929]/45 p-3 backdrop-blur-sm sm:p-5"
			role="dialog"
			aria-modal="true"
			aria-labelledby="admin-support-modal-title"
		>
			<div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
			<section className="relative mx-auto flex max-h-[calc(100vh-24px)] max-w-7xl flex-col overflow-hidden rounded-lg border border-[#d7e5e3] bg-[#f7faf9] shadow-[0_28px_90px_rgba(31,41,41,0.28)] sm:max-h-[calc(100vh-40px)]">
				<header className="flex items-start justify-between gap-4 border-b border-[#d7e5e3] bg-white px-4 py-4 sm:px-6">
					<div className="min-w-0">
						<p className="text-sm text-[#5d6163]">Support ticket</p>
						<h2
							id="admin-support-modal-title"
							className="mt-1 truncate text-xl font-semibold text-[#576363]"
						>
							{ticket.reference} - {ticket.subject}
						</h2>
					</div>
					<Button type="button" variant="outline" onClick={onClose}>
						Close
					</Button>
				</header>
				<div className="overflow-y-auto p-4 sm:p-6">{children}</div>
			</section>
		</div>
	);
}

function TicketConversation({ ticket }: { ticket: AdminSupportTicket }) {
	return (
		<section className="space-y-6">
			<div className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div>
						<p className="text-sm text-[#5d6163]">Conversation</p>
						<h2 className="mt-1 text-xl font-semibold text-[#576363]">
							{ticket.userName}
						</h2>
						<p className="mt-1 text-sm text-[#5d6163]">
							{ticket.userEmail} - created {formatDateTime(ticket.createdAt)}
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<span
							className={cn(
								"rounded-full px-2.5 py-1 text-xs font-semibold",
								statusClasses[ticket.status],
							)}
						>
							{ticket.status}
						</span>
						<span
							className={cn(
								"rounded-full px-2.5 py-1 text-xs font-semibold",
								priorityClasses[ticket.priority],
							)}
						>
							{ticket.priority}
						</span>
					</div>
				</div>
			</div>

			<div className="space-y-4">
				{ticket.messages.map((message) => (
					<div
						key={message.id}
						className={cn(
							"rounded-lg border p-4 shadow-[0_18px_50px_rgba(87,99,99,0.08)]",
							message.type === "user" && "border-[#d7e5e3] bg-white",
							message.type === "admin" && "border-[#c9dcda] bg-[#eef6f5]",
							message.type === "internal" && "border-[#f4dac0] bg-[#fff8ee]",
						)}
					>
						<div className="flex items-start gap-3">
							<div
								className={cn(
									"flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm font-semibold",
									message.type === "user" && "bg-[#5F9EA0] text-white",
									message.type === "admin" && "bg-white text-[#5F9EA0]",
									message.type === "internal" && "bg-[#fff1e0] text-[#a66510]",
								)}
							>
								{getInitials(message.author)}
							</div>
							<div className="min-w-0 flex-1">
								<div className="flex flex-wrap items-center gap-2">
									<p className="font-semibold text-[#576363]">
										{message.author}
									</p>
									<span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#5d6163]">
										{message.type}
									</span>
								</div>
								<p className="mt-2 text-sm leading-6 text-[#5d6163]">
									{message.body}
								</p>
								<p className="mt-2 text-xs text-[#5d6163]">
									{formatDateTime(message.createdAt)}
								</p>
							</div>
						</div>
					</div>
				))}
			</div>

			<div className="grid gap-6 xl:grid-cols-2">
				<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
					<h2 className="text-lg font-semibold text-[#576363]">Attachments</h2>
					<div className="mt-4 space-y-3">
						{ticket.attachments.length === 0 ? (
							<p className="text-sm text-[#5d6163]">No attachments uploaded.</p>
						) : (
							ticket.attachments.map((attachment) => (
								<div
									key={attachment}
									className="flex items-center justify-between gap-3 rounded-md bg-[#f7faf9] px-3 py-2"
								>
									<p className="truncate text-sm font-semibold text-[#576363]">
										{attachment}
									</p>
									<span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#5F9EA0]">
										Proof
									</span>
								</div>
							))
						)}
					</div>
				</section>

				<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
					<h2 className="text-lg font-semibold text-[#576363]">Timeline</h2>
					<div className="mt-4 space-y-3">
						{ticket.timeline.map((item) => (
							<div key={item.id} className="border-l-2 border-[#d7e5e3] pl-3">
								<p className="text-sm font-medium text-[#576363]">
									{item.label}
								</p>
								<p className="mt-1 text-xs text-[#5d6163]">
									{formatDateTime(item.createdAt)}
								</p>
							</div>
						))}
					</div>
				</section>
			</div>
		</section>
	);
}

function TicketDecisionPanel({
	agents,
	internalNote,
	onInternalNoteChange,
	onReplyChange,
	onSendReply,
	onUpdateTicket,
	reply,
	replySaved,
	ticket,
}: {
	agents: AdminSupportData["agents"];
	internalNote: string;
	onInternalNoteChange: (value: string) => void;
	onReplyChange: (value: string) => void;
	onSendReply: () => void;
	onUpdateTicket: (
		id: string,
		updates: Partial<Pick<AdminSupportTicket, "agent" | "priority" | "status">>,
		label: string,
	) => void;
	reply: string;
	replySaved: boolean;
	ticket: AdminSupportTicket;
}) {
	const linkedRecords = Object.entries(ticket.linkedRecords).filter(([, value]) =>
		Boolean(value),
	);

	return (
		<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="text-sm text-[#5d6163]">Ticket controls</p>
					<h2 className="mt-1 text-lg font-semibold text-[#576363]">
						{ticket.reference}
					</h2>
				</div>
				<span
					className={cn(
						"rounded-full px-2.5 py-1 text-xs font-semibold",
						statusClasses[ticket.status],
					)}
				>
					{ticket.status}
				</span>
			</div>

			<div className="mt-5 grid gap-3 text-sm">
				<DetailLine label="User" value={ticket.userName} />
				<DetailLine label="Category" value={ticket.category} />
				<DetailLine label="Priority" value={ticket.priority} />
				<DetailLine label="Assigned" value={ticket.agent} />
				<DetailLine label="SLA" value={getSlaLabel(ticket.slaDueAt)} />
			</div>

			<div className="mt-5">
				<p className="text-sm font-semibold text-[#576363]">Assignment</p>
				<div className="mt-3 grid gap-2">
					{agents.map((agent) => (
						<Button
							key={agent.id}
							type="button"
							variant={ticket.agent === agent.name ? "primary" : "outline"}
							onClick={() =>
								onUpdateTicket(
									ticket.id,
									{ agent: agent.name },
									`Assigned to ${agent.name}`,
								)
							}
						>
							{agent.name}
						</Button>
					))}
				</div>
			</div>

			<div className="mt-5">
				<p className="text-sm font-semibold text-[#576363]">Related records</p>
				<div className="mt-3 space-y-2">
					{linkedRecords.length === 0 ? (
						<p className="rounded-md bg-[#f7faf9] px-3 py-2 text-sm text-[#5d6163]">
							No linked records.
						</p>
					) : (
						linkedRecords.map(([label, value]) => (
							<div
								key={label}
								className="flex items-center justify-between gap-3 rounded-md bg-[#f7faf9] px-3 py-2"
							>
								<p className="capitalize text-sm text-[#5d6163]">{label}</p>
								<p className="text-sm font-semibold text-[#576363]">{value}</p>
							</div>
						))
					)}
				</div>
			</div>

			<div className="mt-5">
				<p className="text-sm font-semibold text-[#576363]">Quick actions</p>
				<div className="mt-3 flex flex-wrap gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={() =>
							onUpdateTicket(
								ticket.id,
								{ status: "Pending Admin" },
								"Marked pending admin",
							)
						}
					>
						Pending admin
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() =>
							onUpdateTicket(
								ticket.id,
								{ status: "Awaiting User" },
								"Marked awaiting user",
							)
						}
					>
						Await user
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() =>
							onUpdateTicket(
								ticket.id,
								{ priority: "Urgent" },
								"Escalated to urgent",
							)
						}
					>
						Escalate
					</Button>
					<Button
						type="button"
						onClick={() =>
							onUpdateTicket(
								ticket.id,
								{ status: "Resolved" },
								"Resolved by admin",
							)
						}
					>
						Resolve
					</Button>
				</div>
			</div>

			<div className="mt-5">
				<label
					className="text-sm font-semibold text-[#576363]"
					htmlFor="admin-support-reply"
				>
					Reply
				</label>
				<textarea
					id="admin-support-reply"
					value={reply}
					onChange={(event) => onReplyChange(event.target.value)}
					placeholder="Write a reply to the user"
					className="mt-3 min-h-28 w-full rounded-md border border-[#cfdcda] bg-white px-3 py-2 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
				/>
				<label
					className="mt-4 block text-sm font-semibold text-[#576363]"
					htmlFor="admin-support-note"
				>
					Internal note
				</label>
				<textarea
					id="admin-support-note"
					value={internalNote}
					onChange={(event) => onInternalNoteChange(event.target.value)}
					placeholder="Add a private note"
					className="mt-3 min-h-24 w-full rounded-md border border-[#cfdcda] bg-white px-3 py-2 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
				/>
				<Button type="button" className="mt-3" onClick={onSendReply}>
					Send / save
				</Button>
				{replySaved ? (
					<p className="mt-2 text-sm font-semibold text-[#2e8f5b]">
						Update saved.
					</p>
				) : null}
			</div>
		</section>
	);
}

function DetailLine({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-start justify-between gap-4 border-b border-[#eef1f1] pb-2 last:border-b-0">
			<span className="text-[#5d6163]">{label}</span>
			<span className="min-w-0 text-right font-semibold text-[#576363]">
				{value}
			</span>
		</div>
	);
}
