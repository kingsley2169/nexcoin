"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

type KycSubmissionStatus =
	| "pending"
	| "in_review"
	| "needs_resubmission"
	| "approved"
	| "rejected";

type UpdateKycStatusInput = {
	reason?: string;
	status: KycSubmissionStatus;
	submissionId: string;
};

export async function updateKycSubmissionStatus(
	input: UpdateKycStatusInput,
): Promise<ActionResult> {
	if (!input.submissionId) {
		return { ok: false, error: "Missing submission." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to update KYC submissions." };
	}

	const { error } = await supabase.rpc("admin_update_kyc_submission_status", {
		submission_id: input.submissionId,
		new_status: input.status,
		reason: input.reason?.trim() || null,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/nexcoin-admin-priv");
	revalidatePath("/nexcoin-admin-priv/kyc-review");
	return { ok: true };
}

export async function addKycSubmissionNote(
	submissionId: string,
	note: string,
): Promise<ActionResult> {
	if (!submissionId) {
		return { ok: false, error: "Missing submission." };
	}

	if (!note.trim()) {
		return { ok: false, error: "Enter a note before saving." };
	}

	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to save notes." };
	}

	const { error } = await supabase.rpc("admin_add_kyc_submission_note", {
		submission_id: submissionId,
		note: note.trim(),
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/nexcoin-admin-priv");
	revalidatePath("/nexcoin-admin-priv/kyc-review");
	return { ok: true };
}
