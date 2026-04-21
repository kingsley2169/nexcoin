import type { Metadata } from "next";
import { AccountSupport } from "@/components/account/account-support";
import { supportSummary, supportTickets } from "@/lib/support-tickets";

export const metadata: Metadata = {
	title: "Support Tickets | Nexcoin",
	description:
		"Open new support tickets and track responses from the Nexcoin support team.",
};

export default function AccountSupportPage() {
	return <AccountSupport summary={supportSummary} tickets={supportTickets} />;
}
