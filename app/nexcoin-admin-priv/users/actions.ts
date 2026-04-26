"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

type DbStatus = "active" | "flagged" | "suspended";

export async function updateAccountStatus(
	userId: string,
	status: DbStatus,
	reason?: string,
): Promise<ActionResult> {
	if (!userId) {
		return { ok: false, error: "Missing user." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to update users." };
	}

	const { error } = await supabase.rpc("admin_update_account_status", {
		target_user_id: userId,
		new_status: status,
		reason: reason?.trim() || null,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/nexcoin-admin-priv");
	revalidatePath("/nexcoin-admin-priv/users");
	return { ok: true };
}
