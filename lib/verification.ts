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
	timeline: VerificationTimelineItem[];
};

export const verificationData: VerificationData = {
	overview: {
		nextReviewEta: "Within 24 hours after resubmission",
		reference: "KYC-4821",
		status: "Action required",
		submittedAt: "2026-04-19T11:30:00Z",
		tier: "Standard verification",
	},
	steps: [
		{
			description: "Personal profile details are complete and match account records.",
			id: "identity",
			status: "Approved",
			title: "Identity details",
		},
		{
			description: "Government ID front is clear. Back image needs a brighter upload.",
			id: "documents",
			status: "Action required",
			title: "Document upload",
		},
		{
			description: "Compliance review resumes after the requested document is replaced.",
			id: "review",
			status: "In review",
			title: "Compliance review",
		},
	],
	documents: [
		{
			description: "Passport, national ID, or driver's license. Front and back may be required.",
			id: "gov-id",
			kind: "Government ID",
			lastUpdatedAt: "2026-04-19T11:30:00Z",
			status: "Needs update",
			title: "Government ID",
		},
		{
			description: "Recent utility bill, bank statement, or official address document.",
			id: "address",
			kind: "Address proof",
			lastUpdatedAt: "2026-04-18T16:12:00Z",
			status: "Approved",
			title: "Proof of address",
		},
		{
			description: "A clear selfie used to match your submitted identity document.",
			id: "selfie",
			kind: "Selfie",
			status: "Not uploaded",
			title: "Selfie check",
		},
	],
	limits: [
		{
			current: "$6,850 available",
			label: "Available withdrawal balance",
			verified: "$50,000 daily limit",
		},
		{
			current: "Manual review",
			label: "Large withdrawals",
			verified: "Priority review",
		},
		{
			current: "Standard support",
			label: "Support routing",
			verified: "Verification desk",
		},
	],
	timeline: [
		{
			createdAt: "2026-04-20T09:15:00Z",
			description: "Compliance requested a clearer scan of the back of your ID.",
			id: "event-1",
			status: "Action required",
			title: "Additional document requested",
		},
		{
			createdAt: "2026-04-19T11:30:00Z",
			description: "Your initial verification package was submitted for review.",
			id: "event-2",
			status: "In review",
			title: "Verification submitted",
		},
		{
			createdAt: "2026-04-18T16:12:00Z",
			description: "Address document was accepted.",
			id: "event-3",
			status: "Approved",
			title: "Proof of address approved",
		},
	],
	notes: [
		"Use documents that show the same legal name as your Nexcoin profile.",
		"Make sure all four corners of each document are visible and readable.",
		"Do not upload private keys, seed phrases, card numbers, or wallet recovery details.",
		"Verification reviews may be required before sensitive withdrawals or loan-related requests.",
	],
};
