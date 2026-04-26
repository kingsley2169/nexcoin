"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

type ActionResult<T = unknown> =
	| { ok: true; data?: T }
	| { ok: false; error: string };

type DbCategory =
	| "account"
	| "deposit"
	| "general"
	| "investment"
	| "kyc"
	| "security"
	| "withdrawal";

type DbPriority = "low" | "medium" | "high" | "urgent";

type CreateTicketInput = {
	category: DbCategory;
	messageBody: string;
	priority: DbPriority;
	relatedReference?: string;
	subject: string;
};

type CreatedTicketRow = {
	id: string;
	reference: string;
};

export async function createSupportTicket(
	input: CreateTicketInput,
): Promise<ActionResult<{ reference: string }>> {
	const subject = input.subject.trim();
	const body = input.messageBody.trim();

	if (subject.length < 4) {
		return { ok: false, error: "Subject must be at least 4 characters." };
	}

	if (body.length < 10) {
		return { ok: false, error: "Message must be at least 10 characters." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to open a ticket." };
	}

	const { data, error } = await supabase
		.rpc("create_support_ticket", {
			subject,
			category: input.category,
			message_body: body,
			priority: input.priority,
			linked_transaction_reference: input.relatedReference?.trim() || null,
		})
		.single<CreatedTicketRow>();

	if (error || !data) {
		return {
			ok: false,
			error: error?.message ?? "Could not open the ticket.",
		};
	}

	revalidatePath("/account/support");
	return { ok: true, data: { reference: data.reference } };
}

export async function replySupportTicket(
	ticketId: string,
	body: string,
): Promise<ActionResult> {
	if (!ticketId) {
		return { ok: false, error: "Missing ticket." };
	}

	if (body.trim().length < 4) {
		return { ok: false, error: "Reply must be at least 4 characters." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to reply." };
	}

	const { error } = await supabase.rpc("user_reply_support_ticket", {
		p_ticket_id: ticketId,
		p_message_body: body.trim(),
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/account/support");
	revalidatePath(`/account/support/${encodeURIComponent(ticketId)}`);
	return { ok: true };
}

export async function markTicketRead(
	ticketId: string,
): Promise<ActionResult> {
	if (!ticketId) {
		return { ok: false, error: "Missing ticket." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in." };
	}

	const { error } = await supabase.rpc("user_mark_ticket_read", {
		p_ticket_id: ticketId,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/account/support");
	return { ok: true };
}
