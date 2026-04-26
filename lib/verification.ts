import type { SupabaseClient } from "@supabase/supabase-js";

export type VerificationStatus =
	| "Action required"
	| "Approved"
	| "In review"
	| "Not submitted";

export type DocumentStatus =
	| "Approved"
	| "In review"
	| "Needs update"
	| "Not uploaded";

export type DocumentKind = "Address proof" | "Government ID" | "Selfie";

export type VerificationDocument = {
	description: string;
	id: string;
	kind: DocumentKind;
	lastUpdatedAt?: string;
	status: DocumentStatus;
	title: string;
};

export type VerificationStep = {
	description: string;
	id: string;
	status: VerificationStatus;
	title: string;
};

export type VerificationLimit = {
	current: string;
	label: string;
	verified: string;
};

export type VerificationTimelineItem = {
	createdAt: string;
	description: string;
	id: string;
	status: VerificationStatus;
	title: string;
};

export type VerificationSubmissionSnapshot = {
	afterApprovalLimitLabel: string;
	currentLimitLabel: string;
	hasGovernmentIdFront: boolean;
	hasProofOfAddress: boolean;
	hasSelfie: boolean;
	id: string | null;
	status:
		| "pending"
		| "in_review"
		| "needs_resubmission"
		| "approved"
		| "rejected"
		| null;
};

export type VerificationData = {
	documents: VerificationDocument[];
	limits: VerificationLimit[];
	notes: string[];
	overview: {
		nextReviewEta: string;
		reference: string;
		status: VerificationStatus;
		submittedAt?: string;
		tier: string;
	};
	steps: VerificationStep[];
	submission: VerificationSubmissionSnapshot;
	timeline: VerificationTimelineItem[];
};

type SubmissionRow = {
	submission_id: string | null;
	reference: string | null;
	submission_status:
		| "pending"
		| "in_review"
		| "needs_resubmission"
		| "approved"
		| "rejected"
		| null;
	rejection_reason: string | null;
	submitted_at: string | null;
	reviewed_at: string | null;
	current_tier: "beginner" | "amateur" | "advanced" | "pro" | null;
	overview_status:
		| "not_submitted"
		| "approved"
		| "in_review"
		| "action_required"
		| null;
};

type DocumentRow = {
	kind: "government_id" | "proof_of_address" | "selfie";
	title: string;
	description: string;
	display_order: number;
	last_updated_at: string | null;
	status: "not_uploaded" | "in_review" | "needs_update" | "approved";
};

type TimelineRow = {
	id: string;
	action_type: string;
	title: string;
	from_status: SubmissionRow["submission_status"];
	to_status: SubmissionRow["submission_status"];
	created_at: string;
};

type TierLimitRow = {
	tier: "beginner" | "amateur" | "advanced" | "pro";
	display_label: string;
	daily_withdrawal_label: string;
	large_withdrawal_label: string;
	support_routing_label: string;
	display_order: number;
};

const notes = [
	"Use documents that show the same legal name as your Nexcoin profile.",
	"Make sure all four corners of each document are visible and readable.",
	"Do not upload private keys, seed phrases, card numbers, or wallet recovery details.",
	"Verification reviews may be required before sensitive withdrawals or loan-related requests.",
];

const documentKindLabel: Record<DocumentRow["kind"], DocumentKind> = {
	government_id: "Government ID",
	proof_of_address: "Address proof",
	selfie: "Selfie",
};

function mapOverviewStatus(
	value: SubmissionRow["overview_status"],
): VerificationStatus {
	switch (value) {
		case "approved":
			return "Approved";
		case "in_review":
			return "In review";
		case "action_required":
			return "Action required";
		default:
			return "Not submitted";
	}
}

function mapDocumentStatus(value: DocumentRow["status"]): DocumentStatus {
	switch (value) {
		case "approved":
			return "Approved";
		case "in_review":
			return "In review";
		case "needs_update":
			return "Needs update";
		default:
			return "Not uploaded";
	}
}

function mapSubmissionStatusToVerification(
	value: SubmissionRow["submission_status"],
): VerificationStatus {
	switch (value) {
		case "approved":
			return "Approved";
		case "pending":
		case "in_review":
			return "In review";
		case "needs_resubmission":
		case "rejected":
			return "Action required";
		default:
			return "Not submitted";
	}
}

function deriveDocumentsStepStatus(
	documents: VerificationDocument[],
): VerificationStatus {
	if (documents.length === 0) return "Not submitted";
	if (documents.some((d) => d.status === "Needs update")) return "Action required";
	if (documents.every((d) => d.status === "Approved")) return "Approved";
	if (documents.some((d) => d.status === "Not uploaded")) return "Not submitted";
	return "In review";
}

function deriveReviewEta(overview: VerificationStatus): string {
	switch (overview) {
		case "Approved":
			return "Verification approved";
		case "Action required":
			return "Within 24 hours after resubmission";
		case "In review":
			return "Within 24 hours of submission";
		default:
			return "Submit your documents to begin review";
	}
}

function buildLimits(
	current: TierLimitRow | null,
	target: TierLimitRow | null,
): VerificationLimit[] {
	const fallback = target ?? current;
	if (!current && !target) return [];

	return [
		{
			label: "Available withdrawal balance",
			current: current?.daily_withdrawal_label ?? "Not yet verified",
			verified: fallback?.daily_withdrawal_label ?? "",
		},
		{
			label: "Large withdrawals",
			current: current?.large_withdrawal_label ?? "Manual review",
			verified: fallback?.large_withdrawal_label ?? "",
		},
		{
			label: "Support routing",
			current: current?.support_routing_label ?? "Standard support",
			verified: fallback?.support_routing_label ?? "",
		},
	];
}

export async function getVerificationData(
	supabase: SupabaseClient,
	_userId: string,
): Promise<VerificationData> {
	void _userId;

	const [submissionResult, documentsResult, timelineResult, tiersResult] =
		await Promise.all([
			supabase
				.from("user_kyc_submission_view")
				.select(
					"submission_id,reference,submission_status,rejection_reason,submitted_at,reviewed_at,current_tier,overview_status",
				)
				.maybeSingle<SubmissionRow>(),
			supabase
				.from("user_kyc_documents_view")
				.select("kind,title,description,display_order,last_updated_at,status")
				.order("display_order")
				.returns<DocumentRow[]>(),
			supabase
				.from("user_kyc_timeline_view")
				.select("id,action_type,title,from_status,to_status,created_at")
				.order("created_at", { ascending: false })
				.limit(20)
				.returns<TimelineRow[]>(),
			supabase
				.from("kyc_tier_limits")
				.select(
					"tier,display_label,daily_withdrawal_label,large_withdrawal_label,support_routing_label,display_order",
				)
				.order("display_order")
				.returns<TierLimitRow[]>(),
		]);

	if (submissionResult.error) throw new Error(submissionResult.error.message);
	if (documentsResult.error) throw new Error(documentsResult.error.message);
	if (timelineResult.error) throw new Error(timelineResult.error.message);
	if (tiersResult.error) throw new Error(tiersResult.error.message);

	const submission = submissionResult.data;
	const overviewStatus = mapOverviewStatus(submission?.overview_status ?? null);

	const documents: VerificationDocument[] = (documentsResult.data ?? []).map(
		(row) => ({
			id: row.kind,
			kind: documentKindLabel[row.kind],
			title: row.title,
			description: row.description,
			status: mapDocumentStatus(row.status),
			lastUpdatedAt: row.last_updated_at ?? undefined,
		}),
	);

	const identityStatus: VerificationStatus = submission?.submission_id
		? "Approved"
		: "Not submitted";
	const documentsStepStatus = deriveDocumentsStepStatus(documents);

	const steps: VerificationStep[] = [
		{
			id: "identity",
			title: "Identity details",
			description: submission?.submission_id
				? "Personal profile details from your submission are on file."
				: "Submit your identity details to begin the verification flow.",
			status: identityStatus,
		},
		{
			id: "documents",
			title: "Document upload",
			description:
				documentsStepStatus === "Action required"
					? submission?.rejection_reason ??
						"One or more documents need to be replaced."
					: documentsStepStatus === "Approved"
						? "All required documents have been accepted."
						: documentsStepStatus === "In review"
							? "Documents submitted and awaiting compliance review."
							: "Upload the required identity documents.",
			status: documentsStepStatus,
		},
		{
			id: "review",
			title: "Compliance review",
			description:
				overviewStatus === "Approved"
					? "Compliance review complete and verification approved."
					: overviewStatus === "Action required"
						? submission?.rejection_reason ??
							"Compliance review is waiting on updated documents."
						: overviewStatus === "In review"
							? "Submission is with the compliance review queue."
							: "Compliance review begins after your first submission.",
			status: overviewStatus,
		},
	];

	const timeline: VerificationTimelineItem[] = (timelineResult.data ?? []).map(
		(row) => {
			const status = mapSubmissionStatusToVerification(row.to_status);
			const fromLabel = row.from_status
				? mapSubmissionStatusToVerification(row.from_status)
				: null;
			const toLabel = row.to_status ? status : null;
			const description =
				fromLabel && toLabel && fromLabel !== toLabel
					? `Status moved from ${fromLabel} to ${toLabel}.`
					: toLabel
						? `Current status: ${toLabel}.`
						: "Timeline update recorded.";

			return {
				id: row.id,
				title: row.title,
				description,
				status,
				createdAt: row.created_at,
			};
		},
	);

	const tiers = tiersResult.data ?? [];
	const currentTierValue = submission?.current_tier ?? "beginner";
	const currentTier = tiers.find((t) => t.tier === currentTierValue) ?? null;
	const targetTier =
		tiers.find((t) => t.display_order > (currentTier?.display_order ?? 0)) ??
		tiers[tiers.length - 1] ??
		null;

	const tierLabel = currentTier?.display_label ?? "Unverified";

	const currentLimitLabel =
		currentTier?.daily_withdrawal_label ?? "Manual review";
	const afterApprovalLimitLabel =
		targetTier?.daily_withdrawal_label ??
		currentTier?.daily_withdrawal_label ??
		"Higher limits after verification";

	const submissionSnapshot: VerificationSubmissionSnapshot = {
		afterApprovalLimitLabel,
		currentLimitLabel,
		hasGovernmentIdFront: documents.some(
			(d) => d.id === "government_id" && d.status !== "Not uploaded",
		),
		hasProofOfAddress: documents.some(
			(d) => d.id === "proof_of_address" && d.status !== "Not uploaded",
		),
		hasSelfie: documents.some(
			(d) => d.id === "selfie" && d.status !== "Not uploaded",
		),
		id: submission?.submission_id ?? null,
		status: submission?.submission_status ?? null,
	};

	return {
		documents,
		limits: buildLimits(currentTier, targetTier),
		notes,
		overview: {
			nextReviewEta: deriveReviewEta(overviewStatus),
			reference: submission?.reference ?? "No submission yet",
			status: overviewStatus,
			submittedAt: submission?.submitted_at ?? undefined,
			tier: tierLabel,
		},
		steps,
		submission: submissionSnapshot,
		timeline,
	};
}
