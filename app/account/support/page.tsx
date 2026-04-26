import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AccountSupport } from "@/components/account/account-support";
import { getSupportData } from "@/lib/support-tickets";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
	title: "Support Tickets | Nexcoin",
	description:
		"Open new support tickets and track responses from the Nexcoin support team.",
};

export default async function AccountSupportPage() {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);
	const { summary, tickets } = await getSupportData(supabase);

	return <AccountSupport summary={summary} tickets={tickets} />;
}
