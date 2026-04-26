"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
	type SupportTicket,
	type TicketStatus,
	ticketCategoryLabels,
	ticketPriorityLabels,
	ticketStatusLabels,
} from "@/lib/support-tickets";
import {
	markTicketRead,
	replySupportTicket,
} from "@/app/account/support/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusBadgeClasses: Record<TicketStatus, string> = {
	awaiting_reply: "bg-[#fff1e0] text-[#a66510]",
	closed: "bg-[#eef1f1] text-[#5d6163]",
	open: "bg-[#e5f3f1] text-[#3c7f80]",
	resolved: "bg-[#e6f3ec] text-[#2e8f5b]",
};

const messageFormatter = new Intl.DateTimeFormat("en-US", {
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
	month: "short",
	year: "numeric",
});

function formatMessageDate(iso: string) {
	return messageFormatter.format(new Date(iso));
}

export function AccountSupportThread({ ticket }: { ticket: SupportTicket }) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const messages = ticket.messages;
	const status: TicketStatus = ticket.status;
	const [reply, setReply] = useState("");
	const [notice, setNotice] = useState<
		{ tone: "success" | "error"; message: string } | null
	>(null);

	const isLocked = status === "closed";
	const canSubmitReply = !isLocked && reply.trim().length >= 4 && !isPending;

	useEffect(() => {
		if (!ticket.unread) return;
		void markTicketRead(ticket.id);
	}, [ticket.id, ticket.unread]);

	function handleReply(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!canSubmitReply) {
			return;
		}

		startTransition(async () => {
			const result = await replySupportTicket(ticket.id, reply);

			if (!result.ok) {
				setNotice({ tone: "error", message: result.error });
				return;
			}

			setReply("");
			setNotice({ tone: "success", message: "Reply sent." });
			router.refresh();
		});
	}

	return (
		<div className="space-y-6">
			<div>
				<Link
					href="/account/support"
					className="inline-flex items-center gap-2 text-sm font-semibold text-[#5F9EA0] transition hover:text-[#3c7f80]"
				>
					<BackIcon className="h-4 w-4" />
					Back to tickets
				</Link>
			</div>

			<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-2">
							<span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5F9EA0]">
								{ticket.reference}
							</span>
							<span
								className={cn(
									"rounded-md px-2 py-0.5 text-xs font-semibold",
									statusBadgeClasses[status],
								)}
							>
								{ticketStatusLabels[status]}
							</span>
							<span className="rounded-md bg-[#f7faf9] px-2 py-0.5 text-xs font-semibold text-[#576363]">
								{ticketCategoryLabels[ticket.category]}
							</span>
							<span className="rounded-md bg-[#eef6f5] px-2 py-0.5 text-xs font-semibold text-[#3c7f80]">
								{ticketPriorityLabels[ticket.priority]} priority
							</span>
						</div>
						<h1 className="mt-3 text-2xl font-semibold text-[#576363] sm:text-3xl">
							{ticket.subject}
						</h1>
						<p className="mt-2 text-sm text-[#5d6163]">
							Opened {formatMessageDate(ticket.createdAt)} · {messages.length}{" "}
							{messages.length === 1 ? "message" : "messages"}
						</p>
					</div>

					<div className="flex shrink-0 flex-wrap gap-2">
						{isLocked ? (
							<p className="text-xs leading-5 text-[#5d6163]">
								Reply below to re-open this ticket.
							</p>
						) : null}
					</div>
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

			<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<h2 className="text-lg font-semibold text-[#576363]">Conversation</h2>
				<ol className="mt-5 space-y-4">
					{messages.map((msg) => {
						const isSupport = msg.author === "support";

						return (
							<li
								key={msg.id}
								className={cn(
									"flex gap-3",
									isSupport ? "flex-row" : "flex-row-reverse",
								)}
							>
								<div
									className={cn(
										"flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
										isSupport
											? "bg-[#5F9EA0] text-white"
											: "bg-[#eef6f5] text-[#3c7f80]",
									)}
									aria-hidden="true"
								>
									{isSupport ? "NS" : "You"}
								</div>
								<div
									className={cn(
										"max-w-[85%] rounded-lg px-4 py-3 text-sm leading-6",
										isSupport
											? "border border-[#eef1f0] bg-[#f7faf9] text-[#576363]"
											: "bg-[#e5f3f1] text-[#3c7f80]",
									)}
								>
									<div
										className={cn(
											"flex items-center gap-2 text-xs font-semibold",
											isSupport ? "text-[#5F9EA0]" : "text-[#3c7f80]",
										)}
									>
										<span>{msg.authorName}</span>
										<span className="text-[#9aa5a4]">·</span>
										<span className="font-medium text-[#5d6163]">
											{formatMessageDate(msg.createdAt)}
										</span>
									</div>
									<p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#576363]">
										{msg.body}
									</p>
								</div>
							</li>
						);
					})}
				</ol>
			</section>

			<section className="rounded-lg border border-[#d7e5e3] bg-white p-6 shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<h2 className="text-lg font-semibold text-[#576363]">Reply</h2>
				{isLocked ? (
					<div className="mt-4 rounded-md bg-[#f7faf9] p-4 text-sm leading-6 text-[#5d6163]">
						This ticket is{" "}
						<span className="font-semibold text-[#576363]">
							{ticketStatusLabels[status].toLowerCase()}
						</span>
						. Closed tickets cannot be replied to — open a new ticket for a
						different issue.
					</div>
				) : (
					<form onSubmit={handleReply} className="mt-4 space-y-3">
						<label className="sr-only" htmlFor="thread-reply">
							Reply to this ticket
						</label>
						<textarea
							id="thread-reply"
							value={reply}
							onChange={(event) => setReply(event.target.value)}
							placeholder="Type your reply to support..."
							rows={5}
							className="w-full rounded-md border border-[#cfdcda] bg-white px-3 py-2 text-sm leading-6 text-[#576363] outline-none focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
						/>
						<div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-xs leading-5 text-[#5d6163]">
								Support replies are posted to this thread. Never share
								passwords, private keys, or seed phrases.
							</p>
							<Button type="submit" disabled={!canSubmitReply}>
								{isPending ? "Sending…" : "Send reply"}
							</Button>
						</div>
					</form>
				)}
			</section>
		</div>
	);
}

function BackIcon({ className }: { className?: string }) {
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
			<path d="m14 7-5 5 5 5" />
		</svg>
	);
}
