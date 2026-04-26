import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminKycStatus =
	| "Approved"
	| "In Review"
	| "Needs Resubmission"
	| "Pending"
	| "Rejected";

export type AdminKycDocumentType =
	| "Driver License"
	| "National ID"
	| "Passport";

export type AdminKycCheckStatus = "Failed" | "Passed" | "Review";

export type AdminKycCheck = {
	label: string;
	status: AdminKycCheckStatus;
};

export type AdminKycTimelineItem = {
	createdAt: string;
	id: string;
	label: string;
};

export type AdminKycSubmission = {
	accountLimits: {
		current: string;
		afterApproval: string;
	};
	accountStatus: "Active" | "Flagged" | "Restricted";
	address: string;
	checks: AdminKycCheck[];
	createdAt: string;
	dateOfBirth: string;
	documentBackUrl: string | null;
	documentExpiry: string;
	documentFrontUrl: string | null;
	documentNumber: string;
	documentQuality: "Blurry" | "Clear" | "Poor";
	documentType: AdminKycDocumentType;
	flags: string[];
	id: string;
	internalNotes: string[];
	livenessStatus: AdminKycCheckStatus;
	proofOfAddressStatus: AdminKycCheckStatus;
	proofOfAddressUrl: string | null;
	reference: string;
	selfieUrl: string | null;
	status: AdminKycStatus;
	timeline: AdminKycTimelineItem[];
	userEmail: string;
	userName: string;
};

export type AdminKycReviewData = {
	flags: {
		count: number;
		id: string;
		label: string;
	}[];
	submissions: AdminKycSubmission[];
	summary: {
		approvedToday: number;
		averageReviewTime: string;
		documentsExpiring: number;
		pendingReview: number;
		rejectedToday: number;
	};
};

type DbSubmissionStatus =
	| "pending"
	| "in_review"
	| "needs_resubmission"
	| "approved"
	| "rejected";

type DbDocumentType = "passport" | "national_id" | "driver_license";
type DbDocumentQuality = "clear" | "blurry" | "poor";
type DbCheckStatus = "passed" | "failed" | "review";
type DbAccountStatus = "active" | "flagged" | "suspended";

type SubmissionRow = {
	id: string;
	reference: string;
	user_id: string;
	user_name: string | null;
	user_email: string | null;
	account_status: DbAccountStatus | null;
	document_type: DbDocumentType;
	document_number: string;
	document_expiry: string;
	document_front_path: string | null;
	document_back_path: string | null;
	selfie_path: string | null;
	proof_of_address_path: string | null;
	document_quality: DbDocumentQuality;
	date_of_birth: string;
	address: string;
	liveness_status: DbCheckStatus;
	proof_of_address_status: DbCheckStatus;
	status: DbSubmissionStatus;
	current_limit_label: string;
	after_approval_limit_label: string;
	created_at: string;
	checks:
		| Array<{
				id?: string;
				label?: string;
				status?: DbCheckStatus;
		  }>
		| null;
	flags:
		| Array<{
				code?: string;
				label?: string;
				detail?: string | null;
				display?: string;
		  }>
		| null;
	internal_notes:
		| Array<{
				note?: string;
		  }>
		| null;
	timeline:
		| Array<{
				id?: string;
				label?: string;
				createdAt?: string;
		  }>
		| null;
};

type SummaryPayload = {
	summary: {
		pendingReview: number | string;
		approvedToday: number | string;
		rejectedToday: number | string;
		averageReviewMinutes: number | string;
		documentsExpiring: number | string;
	};
	flags: Array<{
		code: string;
		label: string;
		count: number | string;
	}>;
};

function toNumber(value: number | string | null | undefined) {
	if (typeof value === "number") return value;
	if (typeof value === "string" && value.length > 0) return Number(value);
	return 0;
}

function mapStatus(value: DbSubmissionStatus): AdminKycStatus {
	switch (value) {
		case "approved":
			return "Approved";
		case "in_review":
			return "In Review";
		case "needs_resubmission":
			return "Needs Resubmission";
		case "rejected":
			return "Rejected";
		default:
			return "Pending";
	}
}

function mapDocumentType(value: DbDocumentType): AdminKycDocumentType {
	switch (value) {
		case "passport":
			return "Passport";
		case "driver_license":
			return "Driver License";
		default:
			return "National ID";
	}
}

function mapDocumentQuality(
	value: DbDocumentQuality,
): AdminKycSubmission["documentQuality"] {
	switch (value) {
		case "clear":
			return "Clear";
		case "blurry":
			return "Blurry";
		default:
			return "Poor";
	}
}

function mapCheckStatus(value: DbCheckStatus | undefined): AdminKycCheckStatus {
	switch (value) {
		case "passed":
			return "Passed";
		case "failed":
			return "Failed";
		default:
			return "Review";
	}
}

function mapAccountStatus(
	value: DbAccountStatus | null,
): AdminKycSubmission["accountStatus"] {
	switch (value) {
		case "flagged":
			return "Flagged";
		case "suspended":
			return "Restricted";
		default:
			return "Active";
	}
}

function formatAverageReviewTime(minutes: number): string {
	if (minutes <= 0) return "—";
	if (minutes < 60) return `${Math.round(minutes)} min`;
	const hours = minutes / 60;
	if (hours < 24) return `${hours.toFixed(1)} h`;
	return `${(hours / 24).toFixed(1)} d`;
}

const KYC_DOCUMENTS_BUCKET = "kyc-documents";
const SIGNED_URL_EXPIRES_SECONDS = 60 * 10;

async function buildSignedUrlMap(
	supabase: SupabaseClient,
	paths: string[],
): Promise<Map<string, string>> {
	const map = new Map<string, string>();
	if (paths.length === 0) return map;

	const { data, error } = await supabase.storage
		.from(KYC_DOCUMENTS_BUCKET)
		.createSignedUrls(paths, SIGNED_URL_EXPIRES_SECONDS);

	if (error || !data) return map;

	for (const entry of data) {
		if (entry.path && entry.signedUrl) {
			map.set(entry.path, entry.signedUrl);
		}
	}

	return map;
}

export async function getAdminKycReviewData(
	supabase: SupabaseClient,
): Promise<AdminKycReviewData> {
	const [summaryResult, submissionsResult] = await Promise.all([
		supabase.rpc("get_admin_kyc_review_summary").single<SummaryPayload>(),
		supabase
			.from("admin_kyc_review_view")
			.select(
				"id,reference,user_id,user_name,user_email,account_status,document_type,document_number,document_expiry,document_front_path,document_back_path,selfie_path,proof_of_address_path,document_quality,date_of_birth,address,liveness_status,proof_of_address_status,status,current_limit_label,after_approval_limit_label,created_at,checks,flags,internal_notes,timeline",
			)
			.order("created_at", { ascending: false })
			.returns<SubmissionRow[]>(),
	]);

	if (summaryResult.error) throw new Error(summaryResult.error.message);
	if (submissionsResult.error) throw new Error(submissionsResult.error.message);

	const summaryPayload = summaryResult.data;
	const averageMinutes = toNumber(summaryPayload?.summary.averageReviewMinutes);

	const rows = submissionsResult.data ?? [];
	const allPaths = new Set<string>();
	for (const row of rows) {
		for (const path of [
			row.document_front_path,
			row.document_back_path,
			row.selfie_path,
			row.proof_of_address_path,
		]) {
			if (path) allPaths.add(path);
		}
	}

	const signedUrlMap = await buildSignedUrlMap(supabase, Array.from(allPaths));
	const urlFor = (path: string | null) =>
		path ? (signedUrlMap.get(path) ?? null) : null;

	const submissions: AdminKycSubmission[] = rows.map((row) => ({
		accountLimits: {
			afterApproval: row.after_approval_limit_label,
			current: row.current_limit_label,
		},
		accountStatus: mapAccountStatus(row.account_status),
		address: row.address,
		checks: (row.checks ?? []).map((check) => ({
			label: check.label ?? "",
			status: mapCheckStatus(check.status),
		})),
		createdAt: row.created_at,
		dateOfBirth: row.date_of_birth,
		documentBackUrl: urlFor(row.document_back_path),
		documentExpiry: row.document_expiry,
		documentFrontUrl: urlFor(row.document_front_path),
		documentNumber: row.document_number,
		documentQuality: mapDocumentQuality(row.document_quality),
		documentType: mapDocumentType(row.document_type),
		flags: (row.flags ?? [])
			.map((flag) => flag.display ?? flag.detail ?? flag.label ?? "")
			.filter((value) => value.length > 0),
		id: row.id,
		internalNotes: (row.internal_notes ?? [])
			.map((item) => item.note ?? "")
			.filter((value) => value.length > 0),
		livenessStatus: mapCheckStatus(row.liveness_status),
		proofOfAddressStatus: mapCheckStatus(row.proof_of_address_status),
		proofOfAddressUrl: urlFor(row.proof_of_address_path),
		reference: row.reference,
		selfieUrl: urlFor(row.selfie_path),
		status: mapStatus(row.status),
		timeline: (row.timeline ?? [])
			.map((item, index) => ({
				createdAt: item.createdAt ?? "",
				id: item.id ?? `${row.id}-timeline-${index}`,
				label: item.label ?? "",
			}))
			.filter(
				(item) => item.createdAt.length > 0 && item.label.length > 0,
			)
			.sort(
				(left, right) =>
					new Date(left.createdAt).getTime() -
					new Date(right.createdAt).getTime(),
			),
		userEmail: row.user_email ?? "",
		userName: row.user_name ?? "Unknown user",
	}));

	return {
		flags: (summaryPayload?.flags ?? []).map((flag) => ({
			count: toNumber(flag.count),
			id: flag.code,
			label: flag.label,
		})),
		submissions,
		summary: {
			approvedToday: toNumber(summaryPayload?.summary.approvedToday),
			averageReviewTime: formatAverageReviewTime(averageMinutes),
			documentsExpiring: toNumber(summaryPayload?.summary.documentsExpiring),
			pendingReview: toNumber(summaryPayload?.summary.pendingReview),
			rejectedToday: toNumber(summaryPayload?.summary.rejectedToday),
		},
	};
}
