"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

type DbCategory =
	| "account"
	| "investment"
	| "security"
	| "support"
	| "transaction";

type Channel = "email" | "in_app" | "sms";

export async function markNotificationRead(
	notificationId: string,
): Promise<ActionResult> {
	if (!notificationId) {
		return { ok: false, error: "Missing notification." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to update notifications." };
	}

	const { error } = await supabase.rpc("user_mark_notification_read", {
		p_notification_id: notificationId,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/account/notifications");
	return { ok: true };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to update notifications." };
	}

	const { error } = await supabase.rpc("user_mark_all_notifications_read");

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/account/notifications");
	return { ok: true };
}

export async function updateNotificationPreference(
	category: DbCategory,
	channel: Channel,
	enabled: boolean,
): Promise<ActionResult> {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to update preferences." };
	}

	const { error } = await supabase.rpc(
		"user_update_notification_preferences",
		{
			p_category: category,
			p_email_enabled: channel === "email" ? enabled : null,
			p_in_app_enabled: channel === "in_app" ? enabled : null,
			p_sms_enabled: channel === "sms" ? enabled : null,
		},
	);

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/account/notifications");
	return { ok: true };
}
