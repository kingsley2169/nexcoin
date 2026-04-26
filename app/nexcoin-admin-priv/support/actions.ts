"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

type DbStatus =
	| "awaiting_user"
	| "closed"
	| "open"
	| "pending_admin"
	| "resolved";

type DbPriority = "high" | "low" | "medium" | "urgent";

type UpdateInput = {
	assignedAdminId?: string | null;
	priority?: DbPriority;
	status?: DbStatus;
	ticketId: string;
};

export async function updateSupportTicket(
	input: UpdateInput,
): Promise<ActionResult> {
	if (!input.ticketId) {
		return { ok: false, error: "Missing ticket." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to update tickets." };
	}

	const { error } = await supabase.rpc("admin_update_support_ticket", {
		ticket_id: input.ticketId,
		assigned_admin_id: input.assignedAdminId ?? null,
		priority: input.priority ?? null,
		status: input.status ?? null,
		sla_due_at: null,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/nexcoin-admin-priv");
	revalidatePath("/nexcoin-admin-priv/support");
	return { ok: true };
}

export async function replyAdminSupportTicket(
	ticketId: string,
	body: string,
	type: "admin" | "internal" = "admin",
): Promise<ActionResult> {
	if (!ticketId) {
		return { ok: false, error: "Missing ticket." };
	}

	if (body.trim().length === 0) {
		return { ok: false, error: "Message cannot be blank." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to reply." };
	}

	const { error } = await supabase.rpc("admin_reply_support_ticket", {
		ticket_id: ticketId,
		message_body: body.trim(),
		message_type: type,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/nexcoin-admin-priv");
	revalidatePath("/nexcoin-admin-priv/support");
	return { ok: true };
}
