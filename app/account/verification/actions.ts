"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

type DocumentKind =
	| "government_id_front"
	| "government_id_back"
	| "proof_of_address"
	| "selfie";

type DocumentType = "passport" | "national_id" | "driver_license";
type DocumentQuality = "clear" | "blurry" | "poor";

export async function resubmitKyc(): Promise<ActionResult> {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to resubmit your verification." };
	}

	const { error } = await supabase.rpc("user_resubmit_kyc");

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/account/verification");
	return { ok: true };
}

export async function attachKycDocument(
	kind: DocumentKind,
	storagePath: string,
): Promise<ActionResult> {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to upload verification documents." };
	}

	if (!storagePath.trim()) {
		return { ok: false, error: "Storage path is required." };
	}

	const { error } = await supabase.rpc("user_submit_kyc_document", {
		p_kind: kind,
		p_storage_path: storagePath,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/account/verification");
	return { ok: true };
}

type CreateSubmissionInput = {
	address: string;
	afterApprovalLimitLabel: string;
	currentLimitLabel: string;
	dateOfBirth: string;
	documentBackPath: string | null;
	documentExpiry: string;
	documentFrontPath: string;
	documentNumber: string;
	documentQuality: DocumentQuality;
	documentType: DocumentType;
	proofOfAddressPath: string;
	selfiePath: string;
};

export async function createKycSubmission(
	input: CreateSubmissionInput,
): Promise<ActionResult> {
	const cookieStore = await cookies();
	const supabase = createClient(cookieStore);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Sign in to submit your verification." };
	}

	const { error } = await supabase.rpc("create_kyc_submission", {
		document_type: input.documentType,
		document_number: input.documentNumber.trim(),
		document_expiry: input.documentExpiry,
		document_quality: input.documentQuality,
		date_of_birth: input.dateOfBirth,
		address: input.address.trim(),
		current_limit_label: input.currentLimitLabel,
		after_approval_limit_label: input.afterApprovalLimitLabel,
		document_front_path: input.documentFrontPath,
		document_back_path: input.documentBackPath,
		selfie_path: input.selfiePath,
		proof_of_address_path: input.proofOfAddressPath,
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	revalidatePath("/account/verification");
	return { ok: true };
}
