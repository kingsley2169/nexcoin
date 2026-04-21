import type { Metadata } from "next";
import Link from "next/link";
import { AccountSupportThread } from "@/components/account/account-support-thread";
import { buttonVariants } from "@/components/ui/button";
import { findSupportTicket } from "@/lib/support-tickets";

type PageProps = {
	params: Promise<{ reference: string }>;
};

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { reference } = await params;
	const ticket = findSupportTicket(reference);

	if (!ticket) {
		return {
			title: "Ticket not found | Nexcoin",
		};
	}

	return {
		title: `${ticket.reference} · ${ticket.subject} | Nexcoin`,
		description:
			"View the full support conversation, reply to the team, and manage the ticket status.",
	};
}

export default async function SupportTicketPage({ params }: PageProps) {
	const { reference } = await params;
	const ticket = findSupportTicket(reference);

	if (!ticket) {
		return (
			<div className="mx-auto max-w-xl rounded-lg border border-[#d7e5e3] bg-white p-8 text-center shadow-[0_18px_50px_rgba(87,99,99,0.08)]">
				<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5F9EA0]">
					Not found
				</p>
				<h1 className="mt-3 text-2xl font-semibold text-[#576363]">
					We couldn&rsquo;t find ticket {reference}
				</h1>
				<p className="mt-3 text-sm leading-6 text-[#5d6163]">
					The reference may be incorrect, or the ticket may have been removed.
				</p>
				<div className="mt-6">
					<Link
						href="/account/support"
						className={buttonVariants({ variant: "outline" })}
					>
						Back to tickets
					</Link>
				</div>
			</div>
		);
	}

	return <AccountSupportThread ticket={ticket} />;
}
