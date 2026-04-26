import { cookies } from "next/headers";
import { AccountNotifications } from "@/components/account/account-notifications";
import { getNotificationsData } from "@/lib/notifications";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
	title: "Notifications | Nexcoin",
	description:
		"Review account alerts, investment updates, withdrawal status changes, and security notices.",
};

export default async function NotificationsPage() {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);
	const data = await getNotificationsData(supabase);

	return <AccountNotifications data={data} />;
}
