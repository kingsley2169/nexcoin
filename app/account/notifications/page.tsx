import { AccountNotifications } from "@/components/account/account-notifications";
import { notificationsData } from "@/lib/notifications";

export const metadata = {
	title: "Notifications | Nexcoin",
	description:
		"Review account alerts, investment updates, withdrawal status changes, and security notices.",
};

export default function NotificationsPage() {
	return <AccountNotifications data={notificationsData} />;
}
