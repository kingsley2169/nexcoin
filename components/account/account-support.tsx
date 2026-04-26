"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
	type SupportSummary,
	type SupportTicket,
	type TicketCategory,
	type TicketPriority,
	type TicketStatus,
	ticketCategoryLabels,
	ticketPriorityLabels,
	ticketStatusLabels,
} from "@/lib/support-tickets";
import { createSupportTicket } from "@/app/account/support/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORY_TO_DB: Record<
	TicketCategory,
	"account" | "deposit" | "general" | "investment" | "kyc" | "security" | "withdrawal"
> = {
	account: "account",
	deposits: "deposit",
	kyc: "kyc",
	other: "general",
	plans: "investment",
	security: "security",
	withdrawals: "withdrawal",
};

const PRIORITY_TO_DB: Record<
	TicketPriority,
	"high" | "low" | "medium"
> = {
	high: "high",
	low: "low",
	normal: "medium",
};

type AccountSupportProps = {
	summary: SupportSummary;
	tickets: SupportTicket[];
};

type StatusFilter = TicketStatus | "all";
type CategoryFilter = TicketCategory | "all";

const statusFilters: { label: string; value: StatusFilter }[] = [
	{ label: "All", value: "all" },
	{ label: "Open", value: "open" },
	{ label: "Awaiting reply", value: "awaiting_reply" },
	{ label: "Resolved", value: "resolved" },
	{ label: "Closed", value: "closed" },
];

const statusBadgeClasses: Record<TicketStatus, string> = {
	awaiting_reply: "bg-[#fff1e0] text-[#a66510]",
	closed: "bg-[#eef1f1] text-[#5d6163]",
	open: "bg-[#e5f3f1] text-[#3c7f80]",
	resolved: "bg-[#e6f3ec] text-[#2e8f5b]",
};

const priorityBadgeClasses: Record<TicketPriority, string> = {
	high: "bg-[#fde8e8] text-[#b1423a]",
	low: "bg-[#eef1f1] text-[#5d6163]",
	normal: "bg-[#eef6f5] text-[#3c7f80]",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
	month: "short",
});

function formatTicketDate(iso: string) {
	return dateFormatter.format(new Date(iso));
}

export function AccountSupport({ summary, tickets }: AccountSupportProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const ticketList = tickets;
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
	const [query, setQuery] = useState("");
	const [isComposerOpen, setIsComposerOpen] = useState(false);
	const [notice, setNotice] = useState<
		{ tone: "success" | "error"; message: string } | null
	>(null);

	const visibleTickets = useMemo(() => {
		const trimmed = query.trim().toLowerCase();

		return ticketList.filter((ticket) => {
			if (statusFilter !== "all" && ticket.status !== statusFilter) {
				return false;
			}

			if (categoryFilter !== "all" && ticket.category !== categoryFilter) {
				return false;
			}

			if (trimmed.length > 0) {
				const haystack = `${ticket.reference} ${ticket.subject}`.toLowerCase();

				if (!haystack.includes(trimmed)) {
					return false;
				}
			}

			return true;
		});
	}, [categoryFilter, query, statusFilter, ticketList]);

	function handleCreateTicket(draft: {
		category: TicketCategory;
		message: string;
		priority: TicketPriority;
		relatedReference: string;
		subject: string;
	}) {
		if (isPending) return;

		startTransition(async () => {
			const result = await createSupportTicket({
				category: CATEGORY_TO_DB[draft.category],
				messageBody: draft.message,
				priority: PRIORITY_TO_DB[draft.priority],
				relatedReference: draft.relatedReference,
				subject: draft.relatedReference.trim()
					? `${draft.subject.trim()} (Ref: ${draft.relatedReference.trim()})`
					: draft.subject.trim(),
			});

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setNotice({
				tone: "success",
				message: `Ticket ${result.data?.reference ?? ""} opened.`,
			});
			setIsComposerOpen(false);
			router.refresh();
		});
	}

	return (
		<div className="space-y-8">
			<section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
				<div className="max-w-2xl">
					<p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5F9EA0]">
						Support
					</p>
					<h1 className="mt-3 text-3xl font-semibold text-[#576363] sm:text-4xl">
						Support Tickets
					</h1>
					<p className="mt-3 text-sm leading-6 text-[#5d6163] sm:text-base">
						Create a ticket for deposit, withdrawal, verification, and account
						questions. Track the full history of every request here.
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<Button size="md" onClick={() => setIsComposerOpen(true)}>
						New Ticket
					</Button>
					<Link
						href="/faq"
						className={buttonVariants({ size: "md", variant: "outline" })}
					>
						Browse FAQ
					</Link>
				</div>
			</section>

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

			<section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
				<SummaryCard
					hint="Tickets you have open right now"
					label="Open"
					value={String(summary.open)}
				/>
				<SummaryCard
					hint="Waiting on your next reply"
					label="Awaiting reply"
					value={String(summary.awaitingReply)}
				/>
				<SummaryCard
					hint="Closed out in the last 30 days"
					label="Resolved this month"
					value={String(summary.resolvedThisMonth)}
				/>
				<SummaryCard
					hint="Average time to first support reply"
					label="Avg. response time"
					value={`${summary.avgResponseHours.toFixed(1)} h`}
				/>
			</section>

			<section className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<div className="flex flex-col gap-4 border-b border-[#eef1f0] pb-5 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex flex-wrap gap-2">
						{statusFilters.map((filter) => {
							const isActive = statusFilter === filter.value;

							return (
								<button
									key={filter.value}
									type="button"
									onClick={() => setStatusFilter(filter.value)}
									className={cn(
										"rounded-full px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15",
										isActive
											? "bg-[#5F9EA0] text-white"
											: "bg-[#f7faf9] text-[#576363] hover:bg-[#eef6f5] hover:text-[#5F9EA0]",
									)}
								>
									{filter.label}
								</button>
							);
						})}
					</div>

					<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
						<label className="sr-only" htmlFor="support-search">
							Search tickets
						</label>
						<div className="flex h-10 min-w-60 items-center rounded-md border border-[#cfdcda] bg-white px-3 focus-within:border-[#5F9EA0] focus-within:ring-4 focus-within:ring-[#5F9EA0]/15">
							<SearchIcon className="h-4 w-4 text-[#5d6163]" />
							<input
								id="support-search"
								type="search"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Search by subject or reference"
								className="ml-2 h-full min-w-0 flex-1 bg-transparent text-sm text-[#576363] outline-none placeholder:text-[#9aa5a4]"
							/>
						</div>
						<label className="sr-only" htmlFor="support-category">
							Filter by category
						</label>
						<select
							id="support-category"
							value={categoryFilter}
							onChange={(event) =>
								setCategoryFilter(event.target.value as CategoryFilter)
							}
							className="h-10 rounded-md border border-[#cfdcda] bg-white px-3 text-sm font-medium text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
						>
							<option value="all">All categories</option>
							{(Object.keys(ticketCategoryLabels) as TicketCategory[]).map(
								(category) => (
									<option key={category} value={category}>
										{ticketCategoryLabels[category]}
									</option>
								),
							)}
						</select>
					</div>
				</div>

				<div className="mt-5">
					{visibleTickets.length === 0 ? (
						<EmptyState
							onCreate={() => setIsComposerOpen(true)}
							isFiltered={
								statusFilter !== "all" ||
								categoryFilter !== "all" ||
								query.trim().length > 0
							}
						/>
					) : (
						<ul className="divide-y divide-[#eef1f0]">
							{visibleTickets.map((ticket) => (
								<li
									key={ticket.id}
									className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
								>
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5F9EA0]">
												{ticket.reference}
											</span>
											<span
												className={cn(
													"rounded-md px-2 py-0.5 text-xs font-semibold",
													statusBadgeClasses[ticket.status],
												)}
											>
												{ticketStatusLabels[ticket.status]}
											</span>
											<span className="rounded-md bg-[#f7faf9] px-2 py-0.5 text-xs font-semibold text-[#576363]">
												{ticketCategoryLabels[ticket.category]}
											</span>
											<span
												className={cn(
													"rounded-md px-2 py-0.5 text-xs font-semibold",
													priorityBadgeClasses[ticket.priority],
												)}
											>
												{ticketPriorityLabels[ticket.priority]}
											</span>
											{ticket.unread ? (
												<span className="inline-flex h-2 w-2 rounded-full bg-[#c97a0f]" />
											) : null}
										</div>
										<p className="mt-2 truncate text-sm font-semibold text-[#576363] sm:text-base">
											{ticket.subject}
										</p>
										<p className="mt-1 text-xs text-[#5d6163]">
											{ticket.messageCount} messages · Last update{" "}
											{formatTicketDate(ticket.updatedAt)} ·{" "}
											{ticket.lastMessageFrom === "support"
												? "Reply from support"
												: "Awaiting support"}
										</p>
									</div>
									<div className="shrink-0">
										<Link
											href={`/account/support/${ticket.reference}`}
											className={buttonVariants({
												size: "sm",
												variant: "outline",
											})}
										>
											View thread
										</Link>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>

			<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="max-w-xl">
						<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5F9EA0]">
							Before you open a ticket
						</p>
						<h2 className="mt-2 text-xl font-semibold text-[#576363]">
							Quick answers and official resources
						</h2>
						<p className="mt-2 text-sm leading-6 text-[#5d6163]">
							Most deposit, withdrawal, and account questions are already
							covered in the public help pages.
						</p>
					</div>
					<div className="flex flex-wrap gap-3">
						<Link
							href="/faq"
							className={buttonVariants({ size: "sm", variant: "outline" })}
						>
							FAQ
						</Link>
						<Link
							href="/how-it-works"
							className={buttonVariants({ size: "sm", variant: "outline" })}
						>
							How it works
						</Link>
						<Link
							href="/contact"
							className={buttonVariants({ size: "sm", variant: "outline" })}
						>
							Contact
						</Link>
					</div>
				</div>
			</section>

			{isComposerOpen ? (
				<TicketComposer
					isSubmitting={isPending}
					onClose={() => setIsComposerOpen(false)}
					onCreate={handleCreateTicket}
				/>
			) : null}
		</div>
	);
}

function SummaryCard({
	hint,
	label,
	value,
}: {
	hint: string;
	label: string;
	value: string;
}) {
	return (
		<div className="rounded-lg border border-[#d7e5e3] bg-white p-5 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
			<p className="text-sm text-[#5d6163]">{label}</p>
			<p className="mt-2 text-2xl font-semibold text-[#576363]">{value}</p>
			<p className="mt-2 text-xs leading-5 text-[#5d6163]">{hint}</p>
		</div>
	);
}

function EmptyState({
	isFiltered,
	onCreate,
}: {
	isFiltered: boolean;
	onCreate: () => void;
}) {
	return (
		<div className="flex flex-col items-center justify-center rounded-md bg-[#f7faf9] px-6 py-12 text-center">
			<div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#5F9EA0]">
				<MailIcon className="h-6 w-6" />
			</div>
			<h3 className="mt-4 text-lg font-semibold text-[#576363]">
				{isFiltered ? "No tickets match these filters" : "No tickets yet"}
			</h3>
			<p className="mt-2 max-w-md text-sm leading-6 text-[#5d6163]">
				{isFiltered
					? "Clear a filter or adjust your search to see more results."
					: "Open your first ticket and the support team will reply inside this dashboard."}
			</p>
			<div className="mt-5">
				<Button onClick={onCreate}>New Ticket</Button>
			</div>
		</div>
	);
}

function TicketComposer({
	isSubmitting,
	onClose,
	onCreate,
}: {
	isSubmitting: boolean;
	onClose: () => void;
	onCreate: (draft: {
		category: TicketCategory;
		message: string;
		priority: TicketPriority;
		relatedReference: string;
		subject: string;
	}) => void;
}) {
	const [subject, setSubject] = useState("");
	const [category, setCategory] = useState<TicketCategory>("account");
	const [priority, setPriority] = useState<TicketPriority>("normal");
	const [relatedReference, setRelatedReference] = useState("");
	const [message, setMessage] = useState("");

	const isSubmittable =
		subject.trim().length >= 4 &&
		message.trim().length >= 10 &&
		!isSubmitting;

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!isSubmittable) {
			return;
		}

		onCreate({
			category,
			message,
			priority,
			relatedReference,
			subject,
		});
	}

	return (
		<div
			aria-modal="true"
			className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
			role="dialog"
		>
			<div
				className="absolute inset-0 bg-black/40"
				onClick={onClose}
				aria-hidden="true"
			/>
			<form
				onSubmit={handleSubmit}
				className="relative z-10 flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-lg border border-[#d7e5e3] bg-white shadow-[0_40px_120px_rgba(87,99,99,0.22)]"
			>
				<div className="flex items-start justify-between border-b border-[#eef1f0] px-6 py-5">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5F9EA0]">
							New ticket
						</p>
						<h2 className="mt-1 text-xl font-semibold text-[#576363]">
							Open a new ticket
						</h2>
						<p className="mt-1 text-sm text-[#5d6163]">
							Give us the details and we&rsquo;ll follow up inside this
							dashboard.
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close new ticket form"
						className="rounded-md p-2 text-[#5d6163] transition hover:bg-[#f7faf9] hover:text-[#5F9EA0] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5F9EA0]/15"
					>
						<CloseIcon className="h-4 w-4" />
					</button>
				</div>

				<div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
					<Field label="Subject" htmlFor="ticket-subject">
						<input
							id="ticket-subject"
							type="text"
							value={subject}
							onChange={(event) => setSubject(event.target.value)}
							placeholder="Short summary of the issue"
							className="h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
						/>
					</Field>

					<div className="grid gap-4 sm:grid-cols-2">
						<Field label="Category" htmlFor="ticket-category">
							<select
								id="ticket-category"
								value={category}
								onChange={(event) =>
									setCategory(event.target.value as TicketCategory)
								}
								className="h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
							>
								{(Object.keys(ticketCategoryLabels) as TicketCategory[]).map(
									(item) => (
										<option key={item} value={item}>
											{ticketCategoryLabels[item]}
										</option>
									),
								)}
							</select>
						</Field>
						<Field label="Priority" htmlFor="ticket-priority">
							<select
								id="ticket-priority"
								value={priority}
								onChange={(event) =>
									setPriority(event.target.value as TicketPriority)
								}
								className="h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
							>
								{(Object.keys(ticketPriorityLabels) as TicketPriority[]).map(
									(item) => (
										<option key={item} value={item}>
											{ticketPriorityLabels[item]}
										</option>
									),
								)}
							</select>
						</Field>
					</div>

					<Field
						label="Related reference (optional)"
						htmlFor="ticket-reference"
					>
						<input
							id="ticket-reference"
							type="text"
							value={relatedReference}
							onChange={(event) => setRelatedReference(event.target.value)}
							placeholder="Transaction ID, plan name, or wallet address"
							className="h-11 w-full rounded-md border border-[#cfdcda] bg-white px-3 text-sm text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
						/>
					</Field>

					<Field label="Message" htmlFor="ticket-message">
						<textarea
							id="ticket-message"
							value={message}
							onChange={(event) => setMessage(event.target.value)}
							placeholder="Describe the issue, expected outcome, and steps already taken."
							rows={5}
							className="w-full rounded-md border border-[#cfdcda] bg-white px-3 py-2 text-sm leading-6 text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
						/>
					</Field>

					<p className="text-xs leading-5 text-[#5d6163]">
						Do not share passwords, private keys, or seed phrases. Support will
						never ask for them.
					</p>
				</div>

				<div className="flex flex-col-reverse gap-2 border-t border-[#eef1f0] bg-[#f7faf9] px-6 py-4 sm:flex-row sm:justify-end">
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit" disabled={!isSubmittable}>
						{isSubmitting ? "Submitting…" : "Submit ticket"}
					</Button>
				</div>
			</form>
		</div>
	);
}

function Field({
	children,
	htmlFor,
	label,
}: {
	children: React.ReactNode;
	htmlFor: string;
	label: string;
}) {
	return (
		<label htmlFor={htmlFor} className="block">
			<span className="text-sm font-semibold text-[#576363]">{label}</span>
			<div className="mt-2">{children}</div>
		</label>
	);
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
			<circle cx="11" cy="11" r="7" />
			<path d="m20 20-3.5-3.5" />
		</svg>
	);
}

function MailIcon({ className }: { className?: string }) {
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
			<path d="M4 6h16v12H4z" />
			<path d="m4 7 8 6 8-6" />
		</svg>
	);
}

function CloseIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			aria-hidden="true"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="2"
		>
			<path d="M6 6 18 18M18 6 6 18" />
		</svg>
	);
}
