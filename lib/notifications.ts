import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationCategory =
	| "account"
	| "investment"
	| "security"
	| "support"
	| "transaction";

export type NotificationPriority = "high" | "normal";

export type NotificationChannel = "Email" | "In-app" | "SMS";

export type NotificationItem = {
	actionHref?: string;
	actionLabel?: string;
	body: string;
	category: NotificationCategory;
	channels: NotificationChannel[];
	createdAt: string;
	id: string;
	isRead: boolean;
	priority: NotificationPriority;
	title: string;
};

export type NotificationPreference = {
	description: string;
	email: boolean;
	id: string;
	inApp: boolean;
	label: string;
	sms: boolean;
};

export type NotificationsData = {
	items: NotificationItem[];
	preferences: NotificationPreference[];
};

export const notificationCategoryLabels: Record<NotificationCategory, string> = {
	account: "Account",
	investment: "Investment",
	security: "Security",
	support: "Support",
	transaction: "Transaction",
};

type NotificationItemRow = {
	action_href: string | null;
	action_label: string | null;
	body: string;
	category: string;
	channels: string[] | null;
	created_at: string;
	id: string;
	is_read: boolean;
	priority: string;
	title: string;
};

type PreferenceRow = {
	category: string;
	description: string;
	email: boolean;
	id: string;
	in_app: boolean;
	label: string;
	sms: boolean;
};

function mapCategory(value: string): NotificationCategory {
	switch (value) {
		case "investment":
			return "investment";
		case "security":
			return "security";
		case "support":
			return "support";
		case "transaction":
			return "transaction";
		default:
			return "account";
	}
}

function mapPriority(value: string): NotificationPriority {
	return value === "high" ? "high" : "normal";
}

function mapChannel(value: string): NotificationChannel | null {
	switch (value) {
		case "Email":
			return "Email";
		case "In-app":
			return "In-app";
		case "SMS":
			return "SMS";
		default:
			return null;
	}
}
 
export async function getNotificationsData(
	supabase: SupabaseClient,
): Promise<NotificationsData> {
	const [itemsResult, preferencesResult] = await Promise.all([
		supabase
			.from("user_notifications_view")
			.select(
				"id,category,priority,title,body,is_read,action_href,action_label,channels,created_at",
			)
			.order("created_at", { ascending: false })
			.limit(100)
			.returns<NotificationItemRow[]>(),
		supabase
			.from("user_notification_preferences_view")
			.select("category,id,label,description,email,in_app,sms")
			.returns<PreferenceRow[]>(),
	]);

	if (itemsResult.error) throw new Error(itemsResult.error.message);
	if (preferencesResult.error) throw new Error(preferencesResult.error.message);

	const items: NotificationItem[] = (itemsResult.data ?? []).map((row) => ({
		actionHref: row.action_href ?? undefined,
		actionLabel: row.action_label ?? undefined,
		body: row.body,
		category: mapCategory(row.category),
		channels: (row.channels ?? [])
			.map(mapChannel)
			.filter((value): value is NotificationChannel => value !== null),
		createdAt: row.created_at,
		id: row.id,
		isRead: row.is_read,
		priority: mapPriority(row.priority),
		title: row.title,
	}));

	const preferences: NotificationPreference[] = (
		preferencesResult.data ?? []
	).map((row) => ({
		description: row.description,
		email: row.email,
		id: row.category,
		inApp: row.in_app,
		label: row.label,
		sms: row.sms,
	}));

	return { items, preferences };
}
